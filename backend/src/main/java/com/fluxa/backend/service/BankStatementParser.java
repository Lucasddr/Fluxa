package com.fluxa.backend.service;

import com.fluxa.backend.dto.response.StatementPreviewRowDTO;
import com.fluxa.backend.exception.InvalidStatementFileException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class BankStatementParser {
    private static final int MAX_ROWS = 5_000;
    private static final int HEADER_SEARCH_ROWS = 20;
    private static final List<String> DATE_ALIASES = List.of(
            "data", "datalancamento", "dtlancamento", "datadalancamento",
            "datamovimento", "datadomovimento", "datadatransacao",
            "date", "posteddate", "transactiondate");
    private static final List<String> DESCRIPTION_ALIASES = List.of(
            "descricao", "descricaodamovimentacao", "historico", "lancamento",
            "detalhe", "description", "memo", "name", "title");
    private static final List<String> AMOUNT_ALIASES = List.of(
            "valor", "valorbrl", "valorr", "valoremreais", "amount", "value", "montante");
    private static final List<String> DEBIT_ALIASES = List.of(
            "debito", "saida", "debit", "withdrawal");
    private static final List<String> CREDIT_ALIASES = List.of(
            "credito", "entrada", "credit", "deposit");
    private static final List<String> TYPE_ALIASES = List.of(
            "tipo", "natureza", "operacao", "type", "transactiontype");
    private static final int MAX_TEXT_LENGTH = 1_000_000;
    private static final Pattern OFX_TRANSACTION = Pattern.compile(
            "(?is)<STMTTRN>(.*?)(?=<STMTTRN>|</BANKTRANLIST>|</STMTRS>|</CCSTMTRS>|$)");
    private static final Pattern TEXT_MONEY = Pattern.compile(
            "(?<![\\d.,])(?:R\\$\\s*)?-?\\d{1,3}(?:\\.\\d{3})*,\\d{2}-?(?:\\s*[DdCc])?(?![\\d.,])");
    private static final Pattern TEXT_DATE_NUMERIC = Pattern.compile(
            "^(\\d{1,2})[/.\\-](\\d{1,2})(?:[/.\\-](\\d{2,4}))?(?![\\d/.\\-])");
    private static final Pattern TEXT_OPERATION_ID = Pattern.compile("\\b\\d[\\d.]{5,}\\b");
    private static final List<String> OPERATION_PREFIXES = List.of(
            "pix", "pagamento", "compra", "transferencia", "rendimento", "debito",
            "credito", "boleto", "saque", "deposito", "tarifa", "estorno", "doc",
            "ted", "resgate", "aplicacao", "recebimento", "envio", "cobranca",
            "emprestimo", "devolucao", "ajuste", "correcao", "vencimento");
    private static final Pattern TEXT_DATE_NAMED = Pattern.compile(
            "^(\\d{1,2})\\s*(?:de\\s+)?([\\p{L}]{3,10})\\.?\\s*(?:de\\s+)?(\\d{4})\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern TEXT_SEPARATOR = Pattern.compile("[\\s|;:–—+\\-]+$");
    private static final List<String> IGNORED_TEXT_PREFIXES = List.of(
            "extrato", "demonstrativo", "agencia", "periodo", "saldo",
            "total", "subtotal", "data", "historico", "descricao", "lancamento",
            "pagina", "page", "cpf", "cnpj", "ouvidoria", "centraldeatendimento",
            "sac", "resumo", "informacoes", "solicitacoes", "geradoem",
            "emitidoem", "internetbanking", "movimentacoes", "vencimento", "fechamento");
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss", Locale.ROOT),
            DateTimeFormatter.ofPattern("d/M/uuuu HH:mm:ss", Locale.ROOT),
            new DateTimeFormatterBuilder().appendPattern("d/M/uuuu").toFormatter(Locale.ROOT),
            new DateTimeFormatterBuilder().appendPattern("d-M-uuuu").toFormatter(Locale.ROOT),
            new DateTimeFormatterBuilder().appendPattern("d/M/uu").toFormatter(Locale.ROOT),
            DateTimeFormatter.BASIC_ISO_DATE);

    public ParsedStatement parse(String filename, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new InvalidStatementFileException("O arquivo está vazio.");
        }
        if (bytes.length > 5 * 1024 * 1024) {
            throw new InvalidStatementFileException("O arquivo deve ter no máximo 5 MB.");
        }

        String extension = extension(filename);
        if (extension.equals("pdf") || looksLikePdf(bytes)) {
            return parseText(PdfStatementTextExtractor.extract(bytes), "PDF");
        }

        String content = decode(bytes).replace("\u0000", "");
        if (extension.equals("ofx") || looksLikeOfx(content)) {
            return parseOfx(content);
        }
        if (!extension.equals("csv") && !extension.isEmpty()) {
            throw new InvalidStatementFileException(
                    "Formato não suportado. Envie um arquivo CSV, OFX ou PDF.");
        }
        return new ParsedStatement("CSV", parseCsv(content), null, null);
    }

    public ParsedStatement parseText(String text, String format) {
        String content = text == null ? "" : text.replace("\u0000", "").trim();
        if (content.isEmpty()) {
            throw new InvalidStatementFileException("Cole o texto do extrato.");
        }
        if (content.length() > MAX_TEXT_LENGTH) {
            throw new InvalidStatementFileException("O texto do extrato deve ter no máximo 1 MB.");
        }
        List<StatementPreviewRowDTO> rows = parseFreeText(content);
        if (rows.isEmpty()) {
            throw new InvalidStatementFileException(
                    "Não encontrei movimentações no texto. Cada linha precisa ter data, descrição e valor.");
        }
        return new ParsedStatement(format, rows, null, null);
    }

    private static List<StatementPreviewRowDTO> parseFreeText(String content) {
        List<Draft> drafts = new ArrayList<>();
        StringBuilder pendingDescription = new StringBuilder();
        LocalDate pendingDate = null;
        Draft lastDraft = null;
        int lastDraftLine = -10;
        boolean lastDraftExtended = false;
        String[] lines = content.split("\\R", -1);

        for (int lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            int rowNumber = lineIndex + 1;
            String line = lines[lineIndex].replaceAll("[\\t\\u00A0]", " ")
                    .replaceAll("\\s{2,}", " ").trim();
            if (line.isEmpty()) continue;

            TextDate date = findTextDate(line, rowNumber);
            String rest = date == null ? line : date.rest();
            Matcher money = TEXT_MONEY.matcher(rest);
            boolean hasMoney = money.find();

            if (hasMoney && (date != null || pendingDate != null)) {
                LocalDate occurredAt = date != null ? date.value() : pendingDate;
                String inline = stripOperationIds(cleanDescription(rest.substring(0, money.start())));
                String description = combineDescriptions(pendingDescription, inline);
                pendingDate = null;
                BigDecimal amount = parseMoneyToken(money.group(), rowNumber);
                if (isValidDescription(description) && amount.signum() != 0) {
                    if (occurredAt.isAfter(LocalDate.now())) {
                        throw rowError(rowNumber, "a data está no futuro.");
                    }
                    Draft draft = new Draft(occurredAt, description, amount, rowNumber);
                    drafts.add(draft);
                    lastDraft = draft;
                    lastDraftLine = rowNumber;
                    lastDraftExtended = false;
                    checkMaxRows(drafts.size());
                }
                continue;
            }

            if (date != null) {
                pendingDate = date.value();
                String raw = stripOperationIds(cleanDescription(rest));
                pendingDescription.setLength(0);
                if (!raw.isEmpty() && !isIgnoredTextLine(raw)) {
                    pendingDescription.append(raw);
                }
                continue;
            }

            if (pendingDate != null) {
                if (!isIgnoredTextLine(line) && pendingDescription.length() + line.length() <= 200) {
                    if (!pendingDescription.isEmpty()) pendingDescription.append(' ');
                    pendingDescription.append(line);
                }
                continue;
            }

            if (isIgnoredTextLine(line)) continue;

            if (looksLikeOperationStart(line)) {
                if (!pendingDescription.isEmpty()) pendingDescription.append(' ');
                pendingDescription.append(line);
                continue;
            }

            if (lastDraft != null && !lastDraftExtended && rowNumber - lastDraftLine <= 2
                    && isDescriptionTail(line)) {
                lastDraft.description = (lastDraft.description + " " + line).trim();
                lastDraftExtended = true;
            }
        }

        Map<String, Integer> repeatedReferences = new HashMap<>();
        List<StatementPreviewRowDTO> rows = new ArrayList<>();
        for (Draft draft : drafts) {
            String canonical = draft.date + "|" + draft.amount.toPlainString()
                    + "|" + normalizeHeader(draft.description);
            String reference = "TXT:" + fingerprint(canonical, repeatedReferences);
            rows.add(new StatementPreviewRowDTO(draft.rowNumber, reference, draft.date.toString(),
                    draft.description, draft.amount, false, null));
        }
        return rows;
    }

    private static boolean isValidDescription(String description) {
        return !description.isEmpty() && description.length() <= 200
                && !isIgnoredTextDescription(description);
    }

    private static boolean isDescriptionTail(String line) {
        return line.length() <= 60 && line.matches(".*[\\p{L}].*")
                && !line.matches(".*[.!?:;].*");
    }

    private static boolean looksLikeOperationStart(String line) {
        String normalized = normalizeHeader(line);
        return OPERATION_PREFIXES.stream().anyMatch(normalized::startsWith);
    }

    private static String stripOperationIds(String value) {
        return TEXT_OPERATION_ID.matcher(value).replaceAll(" ")
                .replaceAll("\\s+", " ").trim();
    }

    private static String cleanDescription(String value) {
        return TEXT_SEPARATOR.matcher(value).replaceAll("").replaceAll("\\s+", " ").trim();
    }

    private static String combineDescriptions(StringBuilder pending, String inline) {
        String left = pending.toString().trim();
        pending.setLength(0);
        if (inline.isEmpty()) return left;
        return left.isEmpty() ? inline : left + " " + inline;
    }

    private static final class Draft {
        private final LocalDate date;
        private final BigDecimal amount;
        private final int rowNumber;
        private String description;

        private Draft(LocalDate date, String description, BigDecimal amount, int rowNumber) {
            this.date = date;
            this.description = description;
            this.amount = amount;
            this.rowNumber = rowNumber;
        }
    }

    private static TextDate findTextDate(String line, int rowNumber) {
        Matcher numeric = TEXT_DATE_NUMERIC.matcher(line);
        if (numeric.find()) {
            int day = Integer.parseInt(numeric.group(1));
            int month = Integer.parseInt(numeric.group(2));
            String yearGroup = numeric.group(3);
            String remaining = line.substring(numeric.end());
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12
                    && (yearGroup != null || !remaining.trim().isEmpty())) {
                Integer year = yearGroup == null ? null
                        : yearGroup.length() == 2 ? 2000 + Integer.parseInt(yearGroup)
                                : Integer.parseInt(yearGroup);
                LocalDate parsed = buildDate(day, month, year, rowNumber);
                if (parsed != null) {
                    return new TextDate(parsed, remaining);
                }
            }
        }

        Matcher named = TEXT_DATE_NAMED.matcher(line);
        if (named.find()) {
            Integer month = monthNumber(named.group(2));
            if (month != null) {
                int day = Integer.parseInt(named.group(1));
                int year = Integer.parseInt(named.group(3));
                LocalDate parsed = buildDate(day, month, year, rowNumber);
                if (parsed != null) {
                    return new TextDate(parsed, line.substring(named.end()));
                }
            }
        }
        return null;
    }

    private static LocalDate buildDate(int day, int month, Integer year, int rowNumber) {
        try {
            LocalDate today = LocalDate.now();
            if (year == null) {
                LocalDate candidate = LocalDate.of(today.getYear(), month, day);
                return candidate.isAfter(today.plusDays(1)) ? candidate.minusYears(1) : candidate;
            }
            return LocalDate.of(year, month, day);
        } catch (RuntimeException invalidDate) {
            return null;
        }
    }

    private static Integer monthNumber(String name) {
        String normalized = normalizeHeader(name);
        return switch (normalized) {
            case "jan", "janeiro" -> 1;
            case "fev", "fevereiro" -> 2;
            case "mar", "marco" -> 3;
            case "abr", "abril" -> 4;
            case "mai", "maio" -> 5;
            case "jun", "junho" -> 6;
            case "jul", "julho" -> 7;
            case "ago", "agosto" -> 8;
            case "set", "setembro" -> 9;
            case "out", "outubro" -> 10;
            case "nov", "novembro" -> 11;
            case "dez", "dezembro" -> 12;
            default -> null;
        };
    }

    private static BigDecimal parseMoneyToken(String token, int rowNumber) {
        String cleaned = token.replaceAll("(?i)R\\$", "").replaceAll("\\s", "");
        boolean negative = cleaned.startsWith("-") || cleaned.endsWith("-");
        cleaned = cleaned.replace("-", "");
        if (!cleaned.isEmpty()) {
            char last = Character.toUpperCase(cleaned.charAt(cleaned.length() - 1));
            if (last == 'D') {
                negative = true;
                cleaned = cleaned.substring(0, cleaned.length() - 1);
            } else if (last == 'C') {
                negative = false;
                cleaned = cleaned.substring(0, cleaned.length() - 1);
            }
        }
        try {
            BigDecimal amount = new BigDecimal(cleaned.replace(".", "").replace(',', '.')).setScale(2);
            return negative ? amount.negate() : amount;
        } catch (NumberFormatException exception) {
            throw rowError(rowNumber, "valor inválido.");
        }
    }

    private static boolean isIgnoredTextLine(String line) {
        String normalized = normalizeHeader(line);
        return IGNORED_TEXT_PREFIXES.stream().anyMatch(normalized::startsWith);
    }

    private static boolean isIgnoredTextDescription(String description) {
        String normalized = normalizeHeader(description);
        return normalized.startsWith("saldo") || normalized.equals("total")
                || normalized.startsWith("subtotal") || normalized.startsWith("limite");
    }

    private record TextDate(LocalDate value, String rest) {
    }

    private static ParsedStatement parseOfx(String content) {
        Matcher matcher = OFX_TRANSACTION.matcher(content);
        List<StatementPreviewRowDTO> rows = new ArrayList<>();
        Map<String, Integer> repeatedReferences = new HashMap<>();
        int rowNumber = 0;
        while (matcher.find()) {
            String block = matcher.group(1);
            rowNumber++;
            String dateValue = tag(block, "DTPOSTED");
            String amountValue = tag(block, "TRNAMT");
            String fitId = tag(block, "FITID");
            String name = tag(block, "NAME");
            String memo = tag(block, "MEMO");
            String description = joinDescription(name, memo);
            if (dateValue == null || amountValue == null || description.isBlank()) {
                throw rowError(rowNumber, "OFX precisa conter data, valor e descrição em cada movimentação.");
            }

            LocalDate date = parseOfxDate(dateValue, rowNumber);
            BigDecimal amount = parseAmount(amountValue, rowNumber);
            if (amount.signum() == 0) throw rowError(rowNumber, "o valor não pode ser zero.");
            String reference = fitId == null || fitId.isBlank()
                    ? fingerprint(date + "|" + amount.toPlainString() + "|" + description, repeatedReferences)
                    : "OFX:" + fingerprint(fitId.trim(), new HashMap<>());
            rows.add(new StatementPreviewRowDTO(rowNumber, reference, date.toString(), description,
                    amount, false, null));
            checkMaxRows(rows.size());
        }
        if (rows.isEmpty()) {
            throw new InvalidStatementFileException("O arquivo OFX não contém movimentações.");
        }
        String balanceAmountText = tag(content, "BALAMT");
        String balanceDateText = tag(content, "DTASOF");
        BigDecimal statementBalance = null;
        String statementBalanceAsOf = null;
        if (balanceAmountText != null || balanceDateText != null) {
            if (balanceAmountText == null || balanceDateText == null) {
                throw new InvalidStatementFileException(
                        "O saldo final OFX precisa informar valor e data juntos.");
            }
            statementBalance = parseAmount(balanceAmountText, 1);
            statementBalanceAsOf = parseOfxDate(balanceDateText, 1).toString();
        }
        return new ParsedStatement("OFX", rows, statementBalance, statementBalanceAsOf);
    }

    private static List<StatementPreviewRowDTO> parseCsv(String content) {
        String withoutBom = content.startsWith("\uFEFF") ? content.substring(1) : content;
        List<List<String>> records = null;
        CsvColumns columns = null;
        for (char delimiter : delimiterCandidates(withoutBom)) {
            List<List<String>> candidate;
            try {
                candidate = readCsvRecords(withoutBom, delimiter);
            } catch (InvalidStatementFileException malformedWithThisDelimiter) {
                continue;
            }
            CsvColumns found = findCsvColumns(candidate);
            if (found != null) {
                records = candidate;
                columns = found;
                break;
            }
        }
        if (columns == null || records == null) {
            throw new InvalidStatementFileException(
                    "Não reconheci as colunas do CSV. São necessárias data, descrição e valor (ou débito/crédito).");
        }
        if (records.size() < columns.headerRow() + 2) {
            throw new InvalidStatementFileException("O CSV precisa ter cabeçalho e ao menos uma movimentação.");
        }

        int dateIndex = columns.date();
        int descriptionIndex = columns.description();
        int amountIndex = columns.amount();
        int debitIndex = columns.debit();
        int creditIndex = columns.credit();
        int typeIndex = columns.type();

        List<StatementPreviewRowDTO> rows = new ArrayList<>();
        Map<String, Integer> repeatedReferences = new HashMap<>();
        for (int recordIndex = columns.headerRow() + 1; recordIndex < records.size(); recordIndex++) {
            List<String> cells = records.get(recordIndex);
            if (cells.stream().allMatch(String::isBlank)) continue;
            int rowNumber = recordIndex + 1;
            LocalDate date = parseDate(cell(cells, dateIndex), rowNumber);
            String description = cell(cells, descriptionIndex).replaceAll("\\s+", " ").trim();
            if (description.isBlank()) throw rowError(rowNumber, "a descrição está vazia.");

            BigDecimal amount;
            if (amountIndex >= 0 && !cell(cells, amountIndex).isBlank()) {
                amount = parseAmount(cell(cells, amountIndex), rowNumber);
            } else {
                String debit = cell(cells, debitIndex);
                String credit = cell(cells, creditIndex);
                if (debit.isBlank() == credit.isBlank()) {
                    throw rowError(rowNumber, "preencha somente débito ou crédito.");
                }
                amount = parseAmount(debit.isBlank() ? credit : debit, rowNumber);
                if (!debit.isBlank()) amount = amount.abs().negate();
            }

            String type = typeIndex < 0 ? "" : normalizeHeader(cell(cells, typeIndex));
            if (amount.signum() > 0 && (type.contains("debito") || type.contains("saida") || type.equals("d"))) {
                amount = amount.negate();
            } else if (amount.signum() < 0 && (type.contains("credito") || type.contains("entrada") || type.equals("c"))) {
                amount = amount.abs();
            }
            if (amount.signum() == 0) throw rowError(rowNumber, "o valor não pode ser zero.");

            String canonical = date + "|" + amount.toPlainString() + "|" + normalizeHeader(description);
            String reference = "CSV:" + fingerprint(canonical, repeatedReferences);
            rows.add(new StatementPreviewRowDTO(
                    rowNumber, reference, date.toString(), description, amount, false, null));
            checkMaxRows(rows.size());
        }
        if (rows.isEmpty()) throw new InvalidStatementFileException("O CSV não contém movimentações.");
        return rows;
    }

    private static CsvColumns findCsvColumns(List<List<String>> records) {
        int limit = Math.min(records.size(), HEADER_SEARCH_ROWS);
        for (int recordIndex = 0; recordIndex < limit; recordIndex++) {
            List<String> headers = records.get(recordIndex).stream()
                    .map(BankStatementParser::normalizeHeader).toList();
            int dateIndex = findColumn(headers, DATE_ALIASES);
            int descriptionIndex = findColumn(headers, DESCRIPTION_ALIASES);
            int amountIndex = findColumn(headers, AMOUNT_ALIASES);
            int debitIndex = findColumn(headers, DEBIT_ALIASES);
            int creditIndex = findColumn(headers, CREDIT_ALIASES);
            int typeIndex = findColumn(headers, TYPE_ALIASES);
            if (dateIndex >= 0 && descriptionIndex >= 0
                    && (amountIndex >= 0 || debitIndex >= 0 || creditIndex >= 0)) {
                return new CsvColumns(recordIndex, dateIndex, descriptionIndex,
                        amountIndex, debitIndex, creditIndex, typeIndex);
            }
        }
        return null;
    }

    private record CsvColumns(int headerRow, int date, int description,
            int amount, int debit, int credit, int type) {
    }

    private static List<List<String>> readCsvRecords(String text, char delimiter) {
        List<List<String>> records = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < text.length(); i++) {
            char current = text.charAt(i);
            if (quoted) {
                if (current == '"' && i + 1 < text.length() && text.charAt(i + 1) == '"') {
                    field.append('"');
                    i++;
                } else if (current == '"') {
                    quoted = false;
                } else {
                    field.append(current);
                }
            } else if (current == '"' && field.isEmpty()) {
                quoted = true;
            } else if (current == delimiter) {
                row.add(field.toString());
                field.setLength(0);
            } else if (current == '\n' || current == '\r') {
                if (current == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') i++;
                row.add(field.toString());
                field.setLength(0);
                if (!row.stream().allMatch(String::isBlank)) records.add(List.copyOf(row));
                row.clear();
                checkMaxRows(records.size());
            } else {
                field.append(current);
            }
        }
        if (quoted) throw new InvalidStatementFileException("O CSV contém um campo entre aspas sem fechamento.");
        if (!field.isEmpty() || !row.isEmpty()) {
            row.add(field.toString());
            if (!row.stream().allMatch(String::isBlank)) records.add(List.copyOf(row));
        }
        return records;
    }

    private static char[] delimiterCandidates(String content) {
        char[] delimiters = {',', ';', '\t'};
        int[] maxCounts = new int[delimiters.length];
        for (String line : content.lines()
                .filter(line -> !line.isBlank())
                .limit(HEADER_SEARCH_ROWS)
                .toList()) {
            int[] counts = new int[delimiters.length];
            boolean quoted = false;
            for (int i = 0; i < line.length(); i++) {
                char current = line.charAt(i);
                if (current == '"') quoted = !quoted;
                if (!quoted) {
                    for (int d = 0; d < delimiters.length; d++) {
                        if (current == delimiters[d]) counts[d]++;
                    }
                }
            }
            for (int d = 0; d < delimiters.length; d++) {
                maxCounts[d] = Math.max(maxCounts[d], counts[d]);
            }
        }
        Integer[] order = {0, 1, 2};
        Arrays.sort(order, (left, right) -> Integer.compare(maxCounts[right], maxCounts[left]));
        char[] candidates = new char[delimiters.length];
        for (int i = 0; i < order.length; i++) candidates[i] = delimiters[order[i]];
        return candidates;
    }

    private static LocalDate parseDate(String value, int rowNumber) {
        String trimmed = value.trim();
        try {
            return OffsetDateTime.parse(trimmed).toLocalDate();
        } catch (DateTimeParseException ignored) {
            // Continue with local date/time and bank-specific formats.
        }
        try {
            return LocalDateTime.parse(trimmed, DateTimeFormatter.ISO_LOCAL_DATE_TIME).toLocalDate();
        } catch (DateTimeParseException ignored) {
            // Try the explicit date-only formats below.
        }
        for (DateTimeFormatter formatter : DATE_FORMATS) {
            try {
                return LocalDate.parse(trimmed, formatter);
            } catch (DateTimeParseException ignored) {
                // Try the next known bank-export date pattern.
            }
        }
        throw rowError(rowNumber, "data inválida; use dd/MM/aaaa ou aaaa-MM-dd.");
    }

    private static LocalDate parseOfxDate(String value, int rowNumber) {
        String digits = value.trim().replaceAll("[^0-9].*$", "");
        if (digits.length() < 8) throw rowError(rowNumber, "data OFX inválida.");
        try {
            return LocalDate.parse(digits.substring(0, 8), DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException exception) {
            throw rowError(rowNumber, "data OFX inválida.");
        }
    }

    private static BigDecimal parseAmount(String value, int rowNumber) {
        String normalized = value.trim().replaceAll("(?i)R\\$", "").replaceAll("\\s", "");
        boolean negativeParentheses = normalized.startsWith("(") && normalized.endsWith(")");
        if (negativeParentheses) normalized = normalized.substring(1, normalized.length() - 1);
        if (normalized.contains(",")) {
            normalized = normalized.replace(".", "").replace(',', '.');
        } else if (normalized.matches("-?\\d{1,3}(?:\\.\\d{3})+")) {
            normalized = normalized.replace(".", "");
        }
        try {
            BigDecimal amount = new BigDecimal(normalized);
            if (amount.stripTrailingZeros().scale() > 2) {
                throw rowError(rowNumber, "use no máximo duas casas decimais.");
            }
            amount = amount.setScale(2);
            return negativeParentheses ? amount.abs().negate() : amount;
        } catch (InvalidStatementFileException exception) {
            throw exception;
        } catch (NumberFormatException exception) {
            throw rowError(rowNumber, "valor inválido.");
        }
    }

    private static String tag(String block, String name) {
        Matcher matcher = Pattern.compile("(?is)<" + name + ">\\s*([^<\\r\\n]*)").matcher(block);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private static String joinDescription(String name, String memo) {
        String left = name == null ? "" : name.trim();
        String right = memo == null ? "" : memo.trim();
        if (left.isBlank()) return right;
        if (right.isBlank() || normalizeHeader(left).equals(normalizeHeader(right))) return left;
        return left + " — " + right;
    }

    private static String normalizeHeader(String value) {
        return java.text.Normalizer.normalize(value == null ? "" : value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
    }

    private static int findColumn(List<String> headers, List<String> aliases) {
        for (String alias : aliases) {
            for (int i = 0; i < headers.size(); i++) {
                if (headers.get(i).equals(alias)) return i;
            }
        }
        return -1;
    }

    private static String cell(List<String> cells, int index) {
        return index < 0 || index >= cells.size() ? "" : cells.get(index);
    }

    private static String fingerprint(String value, Map<String, Integer> occurrences) {
        int occurrence = occurrences.merge(value, 1, Integer::sum);
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((value + "|" + occurrence).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime.", impossible);
        }
    }

    private static String extension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static boolean looksLikePdf(byte[] bytes) {
        return bytes.length >= 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    private static boolean looksLikeOfx(String content) {
        String prefix = content.substring(0, Math.min(content.length(), 2_000)).toUpperCase(Locale.ROOT);
        return prefix.contains("<OFX") || prefix.contains("OFXHEADER:");
    }

    private static String decode(byte[] bytes) {
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes)).toString();
        } catch (CharacterCodingException exception) {
            return new String(bytes, Charset.forName("windows-1252"));
        }
    }

    private static InvalidStatementFileException rowError(int rowNumber, String detail) {
        return new InvalidStatementFileException("Linha " + rowNumber + ": " + detail);
    }

    private static void checkMaxRows(int count) {
        if (count > MAX_ROWS) throw new InvalidStatementFileException("O arquivo pode ter no máximo 5.000 movimentações.");
    }

    public record ParsedStatement(
            String format,
            List<StatementPreviewRowDTO> rows,
            BigDecimal statementBalance,
            String statementBalanceAsOf) {
    }
}
