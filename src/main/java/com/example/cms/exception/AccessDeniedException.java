package com.example.cms.exception;

public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) { super(message); }
}
