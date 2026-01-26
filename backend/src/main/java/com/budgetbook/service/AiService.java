package com.budgetbook.service;

import com.budgetbook.domain.category.Category;
import com.budgetbook.domain.category.CategoryRepository;
import com.budgetbook.domain.category.TransactionType;
import com.budgetbook.dto.ai.AiParseResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final WebClient geminiWebClient;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    public AiParseResponse parseTransaction(Long userId, String userInput) {
        try {
            // 사용자의 카테고리 목록 가져오기
            List<Category> categories = categoryRepository.findByUserId(userId);
            
            String prompt = buildPrompt(userInput, categories);
            String response = callGeminiApi(prompt);
            
            return parseGeminiResponse(response, categories);
        } catch (Exception e) {
            log.error("AI 파싱 실패: {}", e.getMessage(), e);
            return AiParseResponse.builder()
                    .success(false)
                    .errorMessage("AI 파싱 중 오류가 발생했습니다: " + e.getMessage())
                    .build();
        }
    }

    private String buildPrompt(String userInput, List<Category> categories) {
        // 카테고리를 타입별로 분류
        String expenseCategories = categories.stream()
                .filter(c -> c.getType() == TransactionType.EXPENSE)
                .map(Category::getName)
                .collect(Collectors.joining(", "));
        
        String incomeCategories = categories.stream()
                .filter(c -> c.getType() == TransactionType.INCOME)
                .map(Category::getName)
                .collect(Collectors.joining(", "));

        return String.format("""
            당신은 가계부 앱의 거래 내역 파싱 도우미입니다.
            사용자의 자연어 입력을 분석하여 다음 정보를 JSON으로 추출하세요.
            
            반드시 다음 JSON 형식만 출력하세요 (다른 텍스트 없이):
            {"type":"INCOME 또는 EXPENSE","amount":금액숫자,"categoryName":"카테고리명","memo":"추가메모"}
            
            규칙:
            1. type: 수입이면 "INCOME", 지출이면 "EXPENSE"
            2. amount: 숫자만 (원, 만원 등 단위 변환 필요 - 예: 5천원=5000, 3만원=30000)
            3. categoryName: 아래 카테고리 중 가장 적합한 것 선택
            4. memo: 구체적인 내용 (없으면 빈 문자열)
            
            지출 카테고리: %s
            수입 카테고리: %s
            
            카테고리가 없거나 맞는 게 없으면 가장 비슷한 것을 선택하거나 "기타"로 설정하세요.
            
            예시:
            입력: "점심에 김밥 5천원 먹었어"
            출력: {"type":"EXPENSE","amount":5000,"categoryName":"식비","memo":"점심 김밥"}
            
            입력: "이번달 월급 300만원 들어왔어"
            출력: {"type":"INCOME","amount":3000000,"categoryName":"월급","memo":"이번달 월급"}
            
            사용자 입력: %s
            """, expenseCategories, incomeCategories, userInput);
    }

    private String callGeminiApi(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            ),
            "generationConfig", Map.of(
                "temperature", 0.1,
                "maxOutputTokens", 256
            )
        );

        String url = "/" + model + ":generateContent?key=" + apiKey;

        String response = geminiWebClient.post()
                .uri(url)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(e -> {
                    log.error("Gemini API 호출 실패: {}", e.getMessage());
                    return Mono.error(new RuntimeException("Gemini API 호출 실패: " + e.getMessage()));
                })
                .block();

        log.debug("Gemini 응답: {}", response);
        return response;
    }

    private AiParseResponse parseGeminiResponse(String response, List<Category> categories) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            
            if (candidates.isEmpty()) {
                return AiParseResponse.builder()
                        .success(false)
                        .errorMessage("AI 응답이 비어있습니다")
                        .build();
            }

            String text = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            // JSON 부분 추출 (마크다운 코드 블록 제거)
            String jsonText = extractJson(text);
            JsonNode parsed = objectMapper.readTree(jsonText);

            String type = parsed.path("type").asText();
            Long amount = parsed.path("amount").asLong();
            String categoryName = parsed.path("categoryName").asText();
            String memo = parsed.path("memo").asText("");

            // 카테고리 ID 찾기
            TransactionType transactionType = "INCOME".equals(type) ? 
                    TransactionType.INCOME : TransactionType.EXPENSE;
            
            Optional<Category> matchedCategory = categories.stream()
                    .filter(c -> c.getName().equals(categoryName) && c.getType() == transactionType)
                    .findFirst();

            // 정확한 매칭이 없으면 이름만으로 검색
            if (matchedCategory.isEmpty()) {
                matchedCategory = categories.stream()
                        .filter(c -> c.getName().equals(categoryName))
                        .findFirst();
            }

            return AiParseResponse.builder()
                    .success(true)
                    .type(type)
                    .amount(amount)
                    .categoryName(categoryName)
                    .categoryId(matchedCategory.map(Category::getId).orElse(null))
                    .memo(memo)
                    .confidence(0.9)
                    .build();

        } catch (Exception e) {
            log.error("Gemini 응답 파싱 실패: {}", e.getMessage(), e);
            return AiParseResponse.builder()
                    .success(false)
                    .errorMessage("AI 응답 파싱 실패: " + e.getMessage())
                    .build();
        }
    }

    private String extractJson(String text) {
        // 마크다운 코드 블록 제거
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        return text.trim();
    }
}
