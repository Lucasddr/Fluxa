package com.fluxa.backend.exception;

public class EmailAlreadyExistsException extends RuntimeException{

    public EmailAlreadyExistsException(){
        super("Email já cadastrado.");
    }
}
