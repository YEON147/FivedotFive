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

            // Gemini 2.0 Flash 요청 바디 구성
            Map<String, Object> requestBody = createGeminiRequestBody(base64Image, mimeType);

            // GMS 전용 헤더: x-goog-api-key 사용
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", gmsKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Gemini 2.0 Image Generation 호출 중...");
            ResponseEntity<Map> response = restTemplate.postForEntity(gmsUrl, entity, Map.class);

            log.info("Gemini 응답 상태 코드: {}", response.getStatusCode());
            // 이미지 데이터가 포함된 경우 로그가 매우 길어질 수 있으므로 주의
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractImageBytesFromGemini(response.getBody());
            }

            throw new CustomException(ErrorCode.AI_GENERATION_FAILED);

        } catch (Exception e) {
            log.error("Gemini 캐릭터 생성 실패: ", e);
            throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
        }
    }

    private Map<String, Object> createGeminiRequestBody(String base64Image, String mimeType) {
        String prompt = "업로드된 인물 사진을 기반으로 귀여운 캐리커처 스타일의 캐릭터 이미지를 생성해주세요. " +
                "배경은 제거하고 캐릭터만 명확하게 그려주세요.";

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> imagePart = new HashMap<>();
        Map<String, String> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType);
        inlineData.put("data", base64Image);
        imagePart.put("inlineData", inlineData);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Arrays.asList(textPart, imagePart));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", Arrays.asList(content));

        // 응답 형식을 텍스트와 이미지 모두 포함하도록 설정
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseModalities", Arrays.asList("Text", "Image"));
        body.put("generationConfig", generationConfig);

        return body;
    }

    @SuppressWarnings("unchecked")
    private byte[] extractImageBytesFromGemini(Map responseBody) {
        try {
            List<Map> candidates = (List<Map>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                log.error("Gemini 응답에 후보(candidates)가 없습니다.");
                throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
            }

            Map content = (Map) candidates.get(0).get("content");
            List<Map> parts = (List<Map>) content.get("parts");

            // Parts 중에서 inlineData(이미지 데이터)가 포함된 파트를 찾음
            for (Map part : parts) {
                if (part.containsKey("inlineData")) {
                    Map inlineData = (Map) part.get("inlineData");
                    String base64Data = (String) inlineData.get("data");
                    return Base64.getDecoder().decode(base64Data);
                }
            }
        } catch (Exception e) {
            log.error("Gemini 응답 파싱 오류: ", e);
        }
        throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
    }
}
