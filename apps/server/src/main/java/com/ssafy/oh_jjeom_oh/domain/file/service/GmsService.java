package com.ssafy.oh_jjeom_oh.domain.file.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@Slf4j
public class GmsService {

    @Value("${gms.url}")
    private String gmsUrl;

    @Value("${gms.key}")
    private String gmsKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public byte[] generateCharacterImage(MultipartFile sourceImage) {
        try {
            String base64Image = Base64.getEncoder().encodeToString(sourceImage.getBytes());
            String mimeType = sourceImage.getContentType();

            Map<String, Object> requestBody = createGpt4oRequestBody(base64Image, mimeType);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + gmsKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("GPT-4o API 호출 시도... URL: {}", gmsUrl);
            ResponseEntity<Map> response = restTemplate.postForEntity(gmsUrl, entity, Map.class);

            // 상세 로그 추가: 실제 응답 값을 확인하기 위함
            log.info("GMS 응답 상태 코드: {}", response.getStatusCode());
            log.info("GMS 응답 바디: {}", response.getBody());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractImageBytesFromGpt4o(response.getBody());
            }

            throw new CustomException(ErrorCode.AI_GENERATION_FAILED);

        } catch (Exception e) {
            log.error("GMS 호출 중 예외 발생: ", e);
            throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
        }
    }

    private Map<String, Object> createGpt4oRequestBody(String base64Image, String mimeType) {
        Map<String, Object> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", "캐릭터 느낌은 간결한 표현을 주로한 캐리커처 느낌으로 색감은 조금만 사용해주세요.");

        Map<String, Object> imageContent = new HashMap<>();
        imageContent.put("type", "image_url");
        Map<String, String> imageUrl = new HashMap<>();
        imageUrl.put("url", "data:" + mimeType + ";base64," + base64Image);
        imageContent.put("image_url", imageUrl);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", Arrays.asList(textContent, imageContent));

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o");
        body.put("messages", Arrays.asList(message));

        return body;
    }

    @SuppressWarnings("unchecked")
    private byte[] extractImageBytesFromGpt4o(Map responseBody) {
        try {
            List<Map> choices = (List<Map>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                log.error("응답에 'choices' 필드가 없습니다.");
                throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
            }

            Map message = (Map) choices.get(0).get("message");
            Object contentObj = message.get("content");
            
            log.info("추출된 content 타입: {}", contentObj != null ? contentObj.getClass().getSimpleName() : "null");

            if (contentObj instanceof List) {
                List<Map> contents = (List<Map>) contentObj;
                for (Map part : contents) {
                    if ("image".equals(part.get("type")) || part.containsKey("image_url") || part.containsKey("image")) {
                        return extractBytes(part);
                    }
                }
            } else if (contentObj instanceof String) {
                // 일반적인 gpt-4o chat/completions는 텍스트만 반환할 확률이 높습니다.
                // 만약 텍스트 안에 이미지 URL이나 Base64가 포함되어 있다면 별도 처리가 필요할 수 있습니다.
                log.warn("GPT-4o가 텍스트 응답을 반환했습니다: {}", contentObj);
            }
        } catch (Exception e) {
            log.error("GPT-4o 응답 파싱 오류: ", e);
        }
        throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
    }

    private byte[] extractBytes(Map part) {
        if (part.containsKey("image")) {
            return Base64.getDecoder().decode((String) part.get("image"));
        }
        if (part.containsKey("image_url")) {
            Object urlObj = part.get("image_url");
            String url = "";
            if (urlObj instanceof Map) {
                url = (String) ((Map) urlObj).get("url");
            } else if (urlObj instanceof String) {
                url = (String) urlObj;
            }
            
            if (url.startsWith("data:")) {
                return Base64.getDecoder().decode(url.substring(url.indexOf(",") + 1));
            }
        }
        throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
    }
}
