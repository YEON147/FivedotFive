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
            // 이미지 크기 체크 (예: 5MB 초과 시 경고 또는 제한 가능)
            if (sourceImage.getSize() > 5 * 1024 * 1024) {
                log.warn("업로드된 이미지 크기가 큽니다: {} bytes", sourceImage.getSize());
            }

            String base64Image = Base64.getEncoder().encodeToString(sourceImage.getBytes());
            String mimeType = sourceImage.getContentType();

            Map<String, Object> requestBody = createGpt4oRequestBody(base64Image, mimeType);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + gmsKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("GMS GPT-4o 호출 시작... (URL: {})", gmsUrl);
            ResponseEntity<Map> response = restTemplate.postForEntity(gmsUrl, entity, Map.class);

            // [중요] 피드백 반영: 응답 구조를 반드시 로그로 확인해야 함
            log.info("GMS Response Status: {}", response.getStatusCode());
            log.info("GMS Response Body: {}", response.getBody());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractImageBytesFromGpt4o(response.getBody());
            }

            throw new CustomException(ErrorCode.AI_GENERATION_FAILED);

        } catch (Exception e) {
            log.error("AI 캐릭터 생성 과정 중 오류 발생: ", e);
            throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
        }
    }

    private Map<String, Object> createGpt4oRequestBody(String base64Image, String mimeType) {
        // [피드백 반영] 프롬프트 품질 대폭 강화
        String prompt = "업로드된 인물 사진을 기반으로 캐리커처 스타일 캐릭터로 변환해주세요.\n\n" +
                "조건:\n" +
                "- 사람 느낌보다 캐릭터 느낌 강조\n" +
                "- 간결한 선 표현\n" +
                "- 색감은 최소화\n" +
                "- 눈/표정은 귀엽게 단순화\n" +
                "- 스티커 느낌\n" +
                "- 배경 제거\n" +
                "- 얼굴 특징은 유지\n" +
                "- 실사처럼 만들지 말 것";

        Map<String, Object> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", prompt);

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
        // 피드백 반영: 스타일 일관성을 위해 temperature 설정 (필요 시)
        body.put("temperature", 0.7);

        return body;
    }

    @SuppressWarnings("unchecked")
    private byte[] extractImageBytesFromGpt4o(Map responseBody) {
        try {
            List<Map> choices = (List<Map>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                log.error("응답에 choices 데이터가 없습니다.");
                throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
            }

            Map message = (Map) choices.get(0).get("message");
            Object contentObj = message.get("content");

            // 리스트 형태의 멀티모달 응답인 경우
            if (contentObj instanceof List) {
                List<Map> contents = (List<Map>) contentObj;
                for (Map part : contents) {
                    String type = (String) part.get("type");
                    if ("image".equals(type) || part.containsKey("image_url")) {
                        return extractBytes(part);
                    }
                }
            } 
            // 텍스트로만 온 경우 (보통 gpt-4o는 이리로 들어옵니다)
            else if (contentObj instanceof String) {
                log.warn("AI가 이미지 대신 텍스트로 응답했습니다. (내용: {})", contentObj);
                // 만약 텍스트 안에 base64 데이터가 포함되어 있는지 마지막으로 확인
                String text = (String) contentObj;
                if (text.contains("data:image")) {
                    return extractBytesFromText(text);
                }
            }
        } catch (Exception e) {
            log.error("응답 데이터 파싱 중 오류: ", e);
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
            if (url != null && url.startsWith("data:")) {
                return Base64.getDecoder().decode(url.substring(url.indexOf(",") + 1));
            }
        }
        throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
    }

    private byte[] extractBytesFromText(String text) {
        try {
            int start = text.indexOf("data:image");
            if (start != -1) {
                int comma = text.indexOf(",", start);
                // 대략적인 끝 지점 찾기 (공백이나 따옴표 등)
                int end = text.indexOf(" ", comma);
                if (end == -1) end = text.length();
                return Base64.getDecoder().decode(text.substring(comma + 1, end).trim());
            }
        } catch (Exception e) {
            log.error("텍스트 내 이미지 데이터 추출 실패", e);
        }
        throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
    }
}
