package br.com.safeops.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(code = HttpStatus.FORBIDDEN, reason = "MFA_REQUIRED")
public class MfaRequiredException extends RuntimeException {
    public MfaRequiredException() {
        super("MFA validation is required for this account");
    }
}
