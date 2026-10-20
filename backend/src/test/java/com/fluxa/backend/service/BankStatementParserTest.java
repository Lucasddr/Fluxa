package com.fluxa.backend.service;

import com.fluxa.backend.exception.InvalidStatementFileException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BankStatementParserTest {
    private final BankStatementParser parser = new BankStatementParser();

    @Test
    void parsesBrazilianCsvWithQuotedDescriptionAndSignedValues() {
        String csv = "Data;Descrição;Valor\n"
                + "19/10/2026;\"Mercado, bairro\";-1.234,56\n"
                + "2026-10-20;Salário;5000,00\n";

        var statement = parser.parse("extrato.csv", csv.getBytes(StandardCharsets.UTF_8));

        assertEquals("CSV", statement.format());
        assertEquals(2, statement.rows().size());
        assertEquals("2026-10-19", statement.rows().get(0).occurredAt());
        assertEquals("Mercado, bairro", statement.rows().get(0).description());
        assertEquals(new BigDecimal("-1234.56"), statement.rows().get(0).signedAmount());
        assertEquals(new BigDecimal("5000.00"), statement.rows().get(1).signedAmount());
        assertEquals(statement.rows().get(0).sourceReference(),
                parser.parse("extrato.csv", csv.getBytes(StandardCharsets.UTF_8)).rows().get(0).sourceReference());
    }

    @Test
    void parsesDebitAndCreditColumnsAndWindows1252Text() {
        String csv = "Data;Histórico;Débito;Crédito\r\n"
                + "01/10/2026;Café;12,50;\r\n"
                + "02/10/2026;Salário;;2500,00\r\n";

        var statement = parser.parse("movimentos.csv", csv.getBytes(Charset.forName("windows-1252")));

        assertEquals("Café", statement.rows().get(0).description());
        assertEquals(new BigDecimal("-12.50"), statement.rows().get(0).signedAmount());
        assertEquals(new BigDecimal("2500.00"), statement.rows().get(1).signedAmount());
    }

    @Test
    void skipsBankPreambleBeforeCsvHeader() {
        String csv = "Extrato Conta Corrente\n"
                + "Conta ;161468861\n"
                + "Período ;19/09/2026 a 19/10/2026\n"
                + "Saldo ;1,25\n"
                + "\n"
                + "Data Lançamento;Histórico;Descrição;Valor;Saldo\n"
                + "09/10/2026;Pagamento efetuado;Pagamento Fatura - LUCAS;-225,00;1,25\n"
                + "21/09/2026;Compra no débito;Viacosteira           Capivari;-3,00;3,50\n";

        var statement = parser.parse("extrato.csv", csv.getBytes(StandardCharsets.UTF_8));

        assertEquals(2, statement.rows().size());
        assertEquals("2026-10-09", statement.rows().get(0).occurredAt());
        assertEquals("Pagamento Fatura - LUCAS", statement.rows().get(0).description());
        assertEquals(new BigDecimal("-225.00"), statement.rows().get(0).signedAmount());
        assertEquals("Viacosteira Capivari", statement.rows().get(1).description());
        assertEquals(6, statement.rows().get(0).rowNumber());
    }

    @Test
    void parsesPastedTextFromDifferentBankLayouts() {
        String text = String.join("\n",
                "Extrato de conta corrente",
                "Data Descrição Valor Saldo",
                "09/10/2026 Pix recebido +R$ 500,00 226,25",
                "09/10/2026 Pagamento fatura -225,00 1,25",
                "08/10/2026 DOC recebido 300,00 C 301,25",
                "07/10/2026 Compra no débito 225,00 D 0,00",
                "06 OUT 2026 Compra no débito -3,00",
                "01 de outubro de 2026 Compra 12,50 D");

        var statement = parser.parseText(text, "TEXTO");

        assertEquals(6, statement.rows().size());
        assertEquals(new BigDecimal("500.00"), statement.rows().get(0).signedAmount());
        assertEquals("Pix recebido", statement.rows().get(0).description());
        assertEquals(new BigDecimal("-225.00"), statement.rows().get(1).signedAmount());
        assertEquals(new BigDecimal("300.00"), statement.rows().get(2).signedAmount());
        assertEquals(new BigDecimal("-225.00"), statement.rows().get(3).signedAmount());
        assertEquals("2026-10-06", statement.rows().get(4).occurredAt());
        assertEquals(new BigDecimal("-12.50"), statement.rows().get(5).signedAmount());
    }

    @Test
    void parsesMercadoPagoPdfLayoutWithIdsAndWrappedDescriptions() {
        String text = String.join("\n",
                "EXTRATO DE CONTA",
                "Data Descrição ID da operação Valor Saldo",
                "01-06-2026 Rendimentos 1744549132687 R$ 1,06 R$ 2.091,27",
                "Pix recebido LUCAS DUTRA ",
                "01-06-2026 161148427387 R$ 65,00 R$ 2.156,27",
                "DA ROSA",
                "Pix enviado Lucas Dutra da ",
                "01-06-2026 161162103673 R$ -14,00 R$ 2.142,27",
                "Rosa",
                "Pagamento com QR Pix ",
                "09-06-2026 SOCIESC, ESCOLA TECNICA 163312187112 R$ -1.185,97 R$ 1.004,88",
                "TUPY E COLEGIO TUPY",
                "25-06-2026 Pix recebido Anne Jäger 164994923777 R$ 720,00 R$ 7.236,17",
                "Data de geração: 20-10-2026");

        var statement = parser.parseText(text, "TEXTO");

        assertEquals(5, statement.rows().size());
        assertEquals("Rendimentos", statement.rows().get(0).description());
        assertEquals(new BigDecimal("1.06"), statement.rows().get(0).signedAmount());
        assertEquals("Pix recebido LUCAS DUTRA DA ROSA", statement.rows().get(1).description());
        assertEquals(new BigDecimal("65.00"), statement.rows().get(1).signedAmount());
        assertEquals("Pix enviado Lucas Dutra da Rosa", statement.rows().get(2).description());
        assertEquals(new BigDecimal("-14.00"), statement.rows().get(2).signedAmount());
        assertEquals("Pagamento com QR Pix SOCIESC, ESCOLA TECNICA TUPY E COLEGIO TUPY",
                statement.rows().get(3).description());
        assertEquals(new BigDecimal("-1185.97"), statement.rows().get(3).signedAmount());
        assertEquals("Pix recebido Anne Jäger", statement.rows().get(4).description());
        assertEquals(new BigDecimal("720.00"), statement.rows().get(4).signedAmount());
    }

    @Test
    void joinsMultilineDescriptionInPastedText() {
        String text = "09/10/2026 Pix recebido\n"
                + "Lucas Dutra Da Rosa\n"
                + "500,00\n";

        var statement = parser.parseText(text, "TEXTO");

        assertEquals(1, statement.rows().size());
        assertEquals("Pix recebido Lucas Dutra Da Rosa", statement.rows().get(0).description());
        assertEquals(new BigDecimal("500.00"), statement.rows().get(0).signedAmount());
        assertEquals("2026-10-09", statement.rows().get(0).occurredAt());
    }

    @Test
    void extractsTextFromPdfStatement() throws Exception {
        byte[] pdf;
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                stream.newLineAtOffset(50, 760);
                for (String line : new String[] {
                        "Extrato de conta corrente",
                        "Data Descricao Valor Saldo",
                        "09/10/2026 Pix recebido 500,00 226,25",
                        "08/10/2026 Pagamento fatura -225,00 1,25"}) {
                    stream.showText(line);
                    stream.newLineAtOffset(0, -14);
                }
                stream.endText();
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            pdf = out.toByteArray();
        }

        var statement = parser.parse("extrato.pdf", pdf);

        assertEquals("PDF", statement.format());
        assertEquals(2, statement.rows().size());
        assertEquals("Pix recebido", statement.rows().get(0).description());
        assertEquals(new BigDecimal("500.00"), statement.rows().get(0).signedAmount());
        assertEquals(new BigDecimal("-225.00"), statement.rows().get(1).signedAmount());
    }

    @Test
    void parsesOfxSgmlAndUsesFitIdAsStableSourceReference() {
        String ofx = "OFXHEADER:100\nDATA:OFXSGML\n<OFX><BANKTRANLIST>"
                + "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261019120000[-3:BRT]"
                + "<TRNAMT>-42.90<FITID>bank-entry-42<NAME>Farmácia</STMTTRN>"
                + "</BANKTRANLIST><LEDGERBAL><BALAMT>957.10<DTASOF>20261019120000[-3:BRT]"
                + "</LEDGERBAL></OFX>";

        var statement = parser.parse("conta.ofx", ofx.getBytes(StandardCharsets.UTF_8));

        assertEquals("OFX", statement.format());
        assertEquals(1, statement.rows().size());
        assertEquals("2026-10-19", statement.rows().get(0).occurredAt());
        assertEquals("Farmácia", statement.rows().get(0).description());
        assertEquals(new BigDecimal("-42.90"), statement.rows().get(0).signedAmount());
        assertTrue(statement.rows().get(0).sourceReference().startsWith("OFX:"));
        assertEquals(new BigDecimal("957.10"), statement.statementBalance());
        assertEquals("2026-10-19", statement.statementBalanceAsOf());
        assertEquals(statement.rows().get(0).sourceReference(),
                parser.parse("conta.ofx", ofx.getBytes(StandardCharsets.UTF_8))
                        .rows().get(0).sourceReference());
    }

    @Test
    void reportsWhichCsvRowHasInvalidData() {
        String csv = "date,description,amount\n2026-10-01,Market,not-money\n";

        InvalidStatementFileException exception = assertThrows(
                InvalidStatementFileException.class,
                () -> parser.parse("statement.csv", csv.getBytes(StandardCharsets.UTF_8)));

        assertEquals("Linha 2: valor inválido.", exception.getMessage());
    }

    @Test
    void parsesIsoDateTimeInCsvAsLocalTransactionDate() {
        String csv = "date,title,amount\n2026-10-19T23:59:00-03:00,Transfer,-2.25\n";

        var statement = parser.parse("statement.csv", csv.getBytes(StandardCharsets.UTF_8));

        assertEquals("2026-10-19", statement.rows().get(0).occurredAt());
        assertEquals(new BigDecimal("-2.25"), statement.rows().get(0).signedAmount());
    }

    @Test
    void usesFitIdToIdentifyRepeatedOfxEntries() {
        String entry = "<STMTTRN><DTPOSTED>20261019120000<TRNAMT>-5.00<FITID>same-id<NAME>Market</STMTTRN>";
        String ofx = "<OFX><BANKTRANLIST>" + entry + entry + "</BANKTRANLIST></OFX>";

        var statement = parser.parse("statement.ofx", ofx.getBytes(StandardCharsets.UTF_8));

        assertEquals(2, statement.rows().size());
        assertEquals(statement.rows().get(0).sourceReference(), statement.rows().get(1).sourceReference());
    }
}
