package com.ssafy.oh_jjeom_oh.domain.auth.controller.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TokenResponse {
    private String accessToken;
    private String username;

    @JsonIgnore
    private String refreshToken;
}
