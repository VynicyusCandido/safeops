package br.com.safeops.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class PasswordChangeRequiredException extends RuntimeException {
    public PasswordChangeRequiredException() {
        super("PASSWORD_CHANGE_REQUIRED");
    }
}
