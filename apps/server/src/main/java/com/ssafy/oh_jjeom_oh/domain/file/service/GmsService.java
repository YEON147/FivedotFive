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
            // 1. 이미지를 Base64로 인코딩
            String base64Image = Base64.getEncoder().encodeToString(sourceImage.getBytes());
            String mimeType = sourceImage.getContentType();

            // 2. GPT-4o 요청 바디 구성
            Map<String, Object> requestBody = createGpt4oRequestBody(base64Image, mimeType);

            // 3. 헤더 구성 (Authorization: Bearer 방식)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + gmsKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 4. GMS API 호출
            log.info("GPT-4o API 호출 중 (URL: {})", gmsUrl);
            ResponseEntity<Map> response = restTemplate.postForEntity(gmsUrl, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractImageBytesFromGpt4o(response.getBody());
            }

            throw new CustomException(ErrorCode.AI_GENERATION_FAILED);

        } catch (Exception e) {
            log.error("GPT-4o 서비스 오류: ", e);
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
            Map message = (Map) choices.get(0).get("message");
            
            Object contentObj = message.get("content");
            if (contentObj instanceof List) {
                List<Map> contents = (List<Map>) contentObj;
                for (Map part : contents) {
                    if ("image".equals(part.get("type")) || part.containsKey("image_url")) {
                        return extractBytes(part);
                    }
                }
            } else if (contentObj instanceof String) {
                log.warn("GPT-4o가 텍스트 응답만 반환했습니다: {}", contentObj);
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
            Map imageUrl = (Map) part.get("image_url");
            String url = (String) imageUrl.get("url");
            if (url.startsWith("data:")) {
                return Base64.getDecoder().decode(url.substring(url.indexOf(",") + 1));
            }
        }
        throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
    }
}
