package com.watchparty.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.watchparty.exception.ErrorCode;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        boolean success,
        ErrorCode errorCode,
        String message,
        List<FieldErrorDetail> fieldErrors,
        Instant timestamp,
        String path
) {

    public static ApiErrorResponse of(ErrorCode errorCode, String message, String path) {
        return new ApiErrorResponse(false, errorCode, message, null, Instant.now(), path);
    }

    public static ApiErrorResponse validation(
            String message,
            List<FieldErrorDetail> fieldErrors,
            String path
    ) {
        return new ApiErrorResponse(false, ErrorCode.VALIDATION_FAILED, message, fieldErrors, Instant.now(), path);
    }

    public record FieldErrorDetail(String field, String message, Object rejectedValue) {
    }
}
