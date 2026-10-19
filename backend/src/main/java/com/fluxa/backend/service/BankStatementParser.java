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
    private static final Pattern OFX_TRANSACTION = Pattern.compile(
            "(?is)<STMTTRN>(.*?)(?=<STMTTRN>|</BANKTRANLIST>|</STMTRS>|</CCSTMTRS>|$)");
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

        String content = decode(bytes).replace("\u0000", "");
        String extension = extension(filename);
        if (extension.equals("ofx") || looksLikeOfx(content)) {
            return parseOfx(content);
        }
        if (!extension.equals("csv") && !extension.isEmpty()) {
            throw new InvalidStatementFileException("Formato não suportado. Envie um arquivo CSV ou OFX.");
        }
        return new ParsedStatement("CSV", parseCsv(content), null, null);
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
        List<List<String>> records = readCsvRecords(withoutBom, detectDelimiter(withoutBom));
        if (records.size() < 2) {
            throw new InvalidStatementFileException("O CSV precisa ter cabeçalho e ao menos uma movimentação.");
        }

        List<String> headers = records.get(0).stream().map(BankStatementParser::normalizeHeader).toList();
        int dateIndex = findColumn(headers, "data", "datadalancamento", "datamovimento",
                "datadomovimento", "datadatransacao", "date", "posteddate", "transactiondate");
        int descriptionIndex = findColumn(headers, "descricao", "descricaodamovimentacao", "historico",
                "lancamento", "detalhe", "description", "memo", "name", "title");
        int amountIndex = findColumn(headers, "valor", "valorbrl", "valorr", "valoremreais",
                "amount", "value", "montante");
        int debitIndex = findColumn(headers, "debito", "saida", "debit", "withdrawal");
        int creditIndex = findColumn(headers, "credito", "entrada", "credit", "deposit");
        int typeIndex = findColumn(headers, "tipo", "natureza", "operacao", "type", "transactiontype");

        if (dateIndex < 0 || descriptionIndex < 0 || (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)) {
            throw new InvalidStatementFileException(
                    "Não reconheci as colunas do CSV. São necessárias data, descrição e valor (ou débito/crédito).");
        }

        List<StatementPreviewRowDTO> rows = new ArrayList<>();
        Map<String, Integer> repeatedReferences = new HashMap<>();
        for (int recordIndex = 1; recordIndex < records.size(); recordIndex++) {
            List<String> cells = records.get(recordIndex);
            if (cells.stream().allMatch(String::isBlank)) continue;
            int rowNumber = recordIndex + 1;
            LocalDate date = parseDate(cell(cells, dateIndex), rowNumber);
            String description = cell(cells, descriptionIndex).trim();
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

    private static char detectDelimiter(String content) {
        String firstLine = content.lines().filter(line -> !line.isBlank()).findFirst().orElse("");
        char selected = ',';
        int maxCount = -1;
        boolean quoted = false;
        int[] counts = new int[3];
        char[] delimiters = {',', ';', '\t'};
        for (int i = 0; i < firstLine.length(); i++) {
            char current = firstLine.charAt(i);
            if (current == '"') quoted = !quoted;
            if (!quoted) {
                for (int d = 0; d < delimiters.length; d++) {
                    if (current == delimiters[d]) counts[d]++;
                }
            }
        }
        for (int i = 0; i < counts.length; i++) {
            if (counts[i] > maxCount) {
                maxCount = counts[i];
                selected = delimiters[i];
            }
        }
        return selected;
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

    private static int findColumn(List<String> headers, String... aliases) {
        for (int i = 0; i < headers.size(); i++) {
            for (String alias : aliases) if (headers.get(i).equals(alias)) return i;
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
