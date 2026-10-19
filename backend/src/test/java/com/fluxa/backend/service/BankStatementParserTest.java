package com.fluxa.backend.service;

import com.fluxa.backend.exception.InvalidStatementFileException;
import org.junit.jupiter.api.Test;

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
