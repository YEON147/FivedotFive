package com.ssafy.oh_jjeom_oh.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private String errorCode;
    private T data;

    public static <T> ApiResponse<T> success(SuccessMessage message, T data) {
        return new ApiResponse<>(true, message.getMessage(), null, data);
    }

    public static <T> ApiResponse<T> success(SuccessMessage message) {
        return new ApiResponse<>(true, message.getMessage(), null, null);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, message, null, null);
    }

    public static <T> ApiResponse<T> fail(String message, String errorCode) {
        return new ApiResponse<>(false, message, errorCode, null);
    }

}