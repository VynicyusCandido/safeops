package br.com.safeops.exception;

public class MfaSetupRequiredException extends RuntimeException {
    private final String qrCodeDataUri;

    public MfaSetupRequiredException(String qrCodeDataUri) {
        super("MFA Setup Required");
        this.qrCodeDataUri = qrCodeDataUri;
    }

    public String getQrCodeDataUri() {
        return qrCodeDataUri;
    }
}
