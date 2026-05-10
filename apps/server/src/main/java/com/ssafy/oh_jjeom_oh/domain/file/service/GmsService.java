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

            Map<String, Object> requestBody = createGeminiRequestBody(base64Image, mimeType);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", gmsKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Gemini 2.0 Image Generation 호출 중...");
            ResponseEntity<Map> response = restTemplate.postForEntity(gmsUrl, entity, Map.class);

            // [중요 로그] 원본이 올라가는 원인을 추적하기 위해 응답 바디를 반드시 확인하세요.
            log.info("Gemini 응답 상태 코드: {}", response.getStatusCode());
            log.info("Gemini 응답 바디: {}", response.getBody());

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
        String prompt = "업로드된 인물 사진을 기반으로 귀여운 캐릭터 이미지를 생성해주세요. " +
                "사람이 아닌 간결한 스타일의 2D 캐릭터로 그려주세요.";

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

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseModalities", Arrays.asList("Text", "Image"));
        body.put("generationConfig", generationConfig);

        return body;
    }

    @SuppressWarnings("unchecked")
    private byte[] extractImageBytesFromGemini(Map responseBody) {
        try {
            List<Map> candidates = (List<Map>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) throw new CustomException(ErrorCode.AI_GENERATION_FAILED);

            Map content = (Map) candidates.get(0).get("content");
            List<Map> parts = (List<Map>) content.get("parts");

            // [수정] 원본 사진이 에코(Echo)되는 경우를 대비해, 리스트의 '뒤에서부터' 거꾸로 찾습니다.
            // 보통 AI가 새로 생성한 결과물은 리스트의 가장 마지막에 위치합니다.
            for (int i = parts.size() - 1; i >= 0; i--) {
                Map part = parts.get(i);
                if (part.containsKey("inlineData")) {
                    Map inlineData = (Map) part.get("inlineData");
                    String base64Data = (String) inlineData.get("data");
                    log.info("이미지 데이터를 찾았습니다 (index: {})", i);
                    return Base64.getDecoder().decode(base64Data);
                }
            }
        } catch (Exception e) {
            log.error("Gemini 응답 파싱 오류: ", e);
        }
        throw new CustomException(ErrorCode.AI_GENERATION_FAILED);
    }
}
