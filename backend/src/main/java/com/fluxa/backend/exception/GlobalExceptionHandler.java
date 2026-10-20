package com.fluxa.backend.exception;

import com.fluxa.backend.dto.response.ErrorResponseDTO;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponseDTO> handleEmailAlreadyExists(EmailAlreadyExistsException ex){
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDTO(
                        HttpStatus.CONFLICT.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidCredentials(InvalidCredentialsException ex){
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponseDTO(
                        HttpStatus.UNAUTHORIZED.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(MethodArgumentNotValidException ex) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .toList();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        errors
                ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        List.of("Corpo da requisição inválido ou JSON malformado.")
                ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDTO> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        List.of("Parâmetro com valor ou tipo inválido: " + ex.getName() + ".")
                ));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponseDTO> handleMissingParameter(MissingServletRequestParameterException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        List.of("Parâmetro obrigatório ausente: " + ex.getParameterName() + ".")
                ));
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ResponseEntity<ErrorResponseDTO> handleMissingCookie(MissingRequestCookieException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        List.of("Cookie obrigatório ausente: " + ex.getCookieName() + ".")
                ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConstraintViolation(ConstraintViolationException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        List.of("Requisição inválida.")
                ));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ErrorResponseDTO(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
                        List.of("Content-Type não suportado.")
                ));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnsupportedMethod(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorResponseDTO(
                        HttpStatus.METHOD_NOT_ALLOWED.value(),
                        List.of("Método não suportado para esta rota.")
                ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponseDTO> handleRuntimeException(RuntimeException ex) {

        log.error("Unexpected server error", ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponseDTO(
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        List.of("Internal server error")
                ));
    }

    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleTransactionNotFoundException(TransactionNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO(
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleCategoryNotFoundException(CategoryNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO(
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage().lines().toList()
                ));
    }
    
    @ExceptionHandler(AccountNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccountNotFoundException(AccountNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO(
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(AccountInUseException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccountInUseException(AccountInUseException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDTO(
                        HttpStatus.CONFLICT.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(BalanceObservationNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleBalanceObservationNotFound(
            BalanceObservationNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO(
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InvalidBalanceObservationException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidBalanceObservation(
            InvalidBalanceObservationException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InvalidStatementFileException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidStatementFile(
            InvalidStatementFileException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponseDTO(
                        HttpStatus.PAYLOAD_TOO_LARGE.value(),
                        List.of("O arquivo deve ter no máximo 5 MB.")
                ));
    }

    @ExceptionHandler(CategoryInUseException.class)
    public ResponseEntity<ErrorResponseDTO> handleCategoryInUseException(CategoryInUseException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDTO(
                        HttpStatus.CONFLICT.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(CreditPurchaseNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleCreditPurchaseNotFoundException(CreditPurchaseNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO(
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InstallmentNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleInstallmentNotFoundException(InstallmentNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponseDTO(
                        HttpStatus.NOT_FOUND.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InstallmentAlreadyPaidException.class)
    public ResponseEntity<ErrorResponseDTO> handleInstallmentAlreadyPaidException(InstallmentAlreadyPaidException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponseDTO(
                        HttpStatus.CONFLICT.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InvalidInstallmentsSumException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidInstallmentsSumException(InvalidInstallmentsSumException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InvalidCategoryKindException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidCategoryKindException(InvalidCategoryKindException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(InvalidInstallmentOperationException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidInstallmentOperationException(InvalidInstallmentOperationException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage().lines().toList()
                ));
    }

    @ExceptionHandler(CategoryInactiveException.class)
    public ResponseEntity<ErrorResponseDTO> handleCategoryInactiveException(CategoryInactiveException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage().lines().toList()
                ));
    }
}
