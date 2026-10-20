package com.fluxa.backend.service;

import com.fluxa.backend.exception.InvalidStatementFileException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.IOException;

public final class PdfStatementTextExtractor {

    private PdfStatementTextExtractor() {
    }

    public static String extract(byte[] bytes) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            if (text == null || text.isBlank()) {
                throw new InvalidStatementFileException(
                        "O PDF não tem texto extraível. Se for uma digitalização, copie o texto ou use CSV/OFX.");
            }
            return text;
        } catch (InvalidPasswordException exception) {
            throw new InvalidStatementFileException(
                    "O PDF está protegido por senha. Remova a proteção ou use CSV/OFX.");
        } catch (InvalidStatementFileException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            throw new InvalidStatementFileException("Não foi possível ler o PDF enviado.");
        }
    }
}
