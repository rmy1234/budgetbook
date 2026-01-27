package com.budgetbook.service;

import com.budgetbook.domain.category.Category;
import com.budgetbook.domain.category.CategoryRepository;
import com.budgetbook.domain.category.TransactionType;
import com.budgetbook.dto.ai.AiParseResponse;
import com.budgetbook.dto.ai.ChatResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final WebClient ollamaWebClient;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    @Value("${ollama.model}")
    private String model;

    public AiParseResponse parseTransaction(Long userId, String userInput) {
        try {
            // 사용자의 카테고리 목록 가져오기
            List<Category> categories = categoryRepository.findByUserId(userId);
            
            String prompt = buildPrompt(userInput, categories);
            String response = callOllamaApi(prompt);
            
            return parseOllamaResponse(response, categories);
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
            2. amount: 반드시 원 단위 숫자로 변환
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
            
            JSON만 출력:""", expenseCategories, incomeCategories, userInput);
    }

    private String callOllamaApi(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "prompt", prompt,
            "stream", false,
            "options", Map.of(
                "temperature", 0.1,
                "num_predict", 256
            )
        );

        String response = ollamaWebClient.post()
                .uri("/api/generate")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(60))
                .onErrorResume(e -> {
                    log.error("Ollama API 호출 실패: {}", e.getMessage());
                    return Mono.error(new RuntimeException("Ollama API 호출 실패: " + e.getMessage()));
                })
                .block();

        log.debug("Ollama 응답: {}", response);
        return response;
    }

    private AiParseResponse parseOllamaResponse(String response, List<Category> categories) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String text = root.path("response").asText();
            
            if (text == null || text.isEmpty()) {
                return AiParseResponse.builder()
                        .success(false)
                        .errorMessage("AI 응답이 비어있습니다")
                        .build();
            }

            // JSON 부분 추출 (마크다운 코드 블록 제거)
            String jsonText = extractJson(text);
            log.debug("추출된 JSON: {}", jsonText);
            
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
            
            // 여전히 없으면 부분 매칭 시도
            if (matchedCategory.isEmpty()) {
                final String searchName = categoryName;
                matchedCategory = categories.stream()
                        .filter(c -> c.getName().contains(searchName) || searchName.contains(c.getName()))
                        .filter(c -> c.getType() == transactionType)
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
            log.error("Ollama 응답 파싱 실패: {}", e.getMessage(), e);
            return AiParseResponse.builder()
                    .success(false)
                    .errorMessage("AI 응답 파싱 실패: " + e.getMessage())
                    .build();
        }
    }

    private String extractJson(String text) {
        text = text.trim();
        
        // 마크다운 코드 블록 제거
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        
        // JSON 객체 부분만 추출
        int startIndex = text.indexOf('{');
        int endIndex = text.lastIndexOf('}');
        
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            text = text.substring(startIndex, endIndex + 1);
        }
        
        return text.trim();
    }

    /**
     * 일상 대화 + 거래 감지 채팅 메서드
     */
    public ChatResponse chat(Long userId, String userMessage) {
        try {
            List<Category> categories = categoryRepository.findByUserId(userId);
            String prompt = buildChatPrompt(userMessage, categories);
            String response = callOllamaApiForChat(prompt);
            
            return parseChatResponse(response, categories);
        } catch (Exception e) {
            log.error("AI 채팅 실패: {}", e.getMessage(), e);
            return ChatResponse.builder()
                    .message("죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.")
                    .actionType("CHAT")
                    .hasTransaction(false)
                    .transaction(null)
                    .category(null)
                    .account(null)
                    .build();
        }
    }

    private String buildChatPrompt(String userMessage, List<Category> categories) {
        String expenseCategories = categories.stream()
                .filter(c -> c.getType() == TransactionType.EXPENSE)
                .map(Category::getName)
                .collect(Collectors.joining(", "));
        
        String incomeCategories = categories.stream()
                .filter(c -> c.getType() == TransactionType.INCOME)
                .map(Category::getName)
                .collect(Collectors.joining(", "));

        return String.format("""
            당신은 가계부 앱의 친근한 AI 어시스턴트입니다.
            사용자와 자연스럽게 대화하면서 다음 기능들을 수행할 수 있습니다:
            1. 거래(수입/지출) 기록
            2. 카테고리 생성
            3. 계좌 생성
            4. 사용법 안내
            
            반드시 다음 JSON 형식으로만 응답하세요:
            {"message":"응답 메시지","actionType":"CHAT/TRANSACTION/CATEGORY/ACCOUNT/HELP","hasTransaction":false,"transaction":null,"category":null,"account":null}
            
            actionType 설명:
            - CHAT: 일반 대화 (아무 액션 없음)
            - TRANSACTION: 거래 기록 요청 감지
            - CATEGORY: 카테고리 생성 요청 감지
            - ACCOUNT: 계좌 생성 요청 감지
            - HELP: 사용법/도움말 요청
            
            현재 등록된 카테고리:
            - 지출: %s
            - 수입: %s
            
            === 액션별 응답 형식 ===
            
            1. 거래 기록 (TRANSACTION) - 금액이 명시된 수입/지출:
            {"message":"5,000원 지출을 기록해드릴까요?","actionType":"TRANSACTION","hasTransaction":true,"transaction":{"type":"EXPENSE","amount":5000,"categoryName":"식비","memo":"점심"},"category":null,"account":null}
            
            2. 카테고리 생성 (CATEGORY) - "카테고리 만들어줘", "~카테고리 추가해줘":
            {"message":"'커피' 지출 카테고리를 만들어드릴까요?","actionType":"CATEGORY","hasTransaction":false,"transaction":null,"category":{"name":"커피","type":"EXPENSE","icon":"local_cafe"},"account":null}
            
            3. 계좌 생성 (ACCOUNT) - "계좌 추가해줘", "~은행 등록해줘":
            {"message":"'신한은행 월급통장' 계좌를 등록해드릴까요?","actionType":"ACCOUNT","hasTransaction":false,"transaction":null,"category":null,"account":{"bankName":"신한은행","alias":"월급통장","balance":0}}
            
            4. 도움말 (HELP) - "어떻게 사용해?", "뭐 할 수 있어?", "사용법", "도움말":
            {"message":"저는 다음과 같은 일을 도와드릴 수 있어요!\\n\\n📝 **거래 기록**\\n- \\"점심에 김밥 5천원 먹었어\\"\\n- \\"이번달 월급 300만원 들어왔어\\"\\n\\n📁 **카테고리 생성**\\n- \\"커피 지출 카테고리 만들어줘\\"\\n- \\"부수입 수입 카테고리 추가해줘\\"\\n\\n🏦 **계좌 등록**\\n- \\"신한은행 월급통장 계좌 추가해줘\\"\\n- \\"카카오뱅크 생활비 계좌 등록해줘\\"\\n\\n💬 **일상 대화**\\n- 무엇이든 편하게 물어보세요!","actionType":"HELP","hasTransaction":false,"transaction":null,"category":null,"account":null}
            
            5. 일반 대화 (CHAT):
            {"message":"친근한 응답","actionType":"CHAT","hasTransaction":false,"transaction":null,"category":null,"account":null}
            
            카테고리 생성 시 icon 추천:
            - 식비: restaurant, fastfood, local_cafe
            - 교통: directions_car, directions_bus, local_taxi
            - 쇼핑: shopping_cart, shopping_bag
            - 문화: movie, sports_esports, music_note
            - 의료: local_hospital, medical_services
            - 교육: school, menu_book
            - 월급/수입: payments, account_balance
            - 기타: category, more_horiz
            
            사용자 입력: %s
            
            JSON만 출력:""", expenseCategories, incomeCategories, userMessage);
    }

    private String callOllamaApiForChat(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "prompt", prompt,
            "stream", false,
            "options", Map.of(
                "temperature", 0.7,
                "num_predict", 512
            )
        );

        String response = ollamaWebClient.post()
                .uri("/api/generate")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(60))
                .onErrorResume(e -> {
                    log.error("Ollama API 호출 실패: {}", e.getMessage());
                    return Mono.error(new RuntimeException("Ollama API 호출 실패: " + e.getMessage()));
                })
                .block();

        log.debug("Ollama 채팅 응답: {}", response);
        return response;
    }

    private ChatResponse parseChatResponse(String response, List<Category> categories) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String text = root.path("response").asText();
            
            if (text == null || text.isEmpty()) {
                log.warn("Ollama 응답이 비어있습니다. 원본 응답: {}", response);
                return ChatResponse.builder()
                        .message("응답을 생성하지 못했습니다. 다시 시도해주세요.")
                        .actionType("CHAT")
                        .hasTransaction(false)
                        .build();
            }

            String jsonText = extractJson(text);
            log.debug("추출된 채팅 JSON: {}", jsonText);
            
            if (jsonText == null || jsonText.isEmpty() || !jsonText.trim().startsWith("{")) {
                log.warn("JSON 추출 실패. 원본 텍스트: {}", text);
                // JSON이 없으면 일반 대화로 처리
                return ChatResponse.builder()
                        .message(text.trim())
                        .actionType("CHAT")
                        .hasTransaction(false)
                        .build();
            }
            
            JsonNode parsed = objectMapper.readTree(jsonText);
            
            String message = parsed.path("message").asText("네, 말씀하세요!");
            String actionType = parsed.path("actionType").asText("CHAT");
            boolean hasTransaction = parsed.path("hasTransaction").asBoolean(false);
            
            // 거래 데이터 파싱
            AiParseResponse transaction = null;
            if (hasTransaction && parsed.has("transaction") && !parsed.path("transaction").isNull()) {
                JsonNode txNode = parsed.path("transaction");
                String type = txNode.path("type").asText();
                Long amount = txNode.path("amount").asLong();
                String categoryName = txNode.path("categoryName").asText();
                String memo = txNode.path("memo").asText("");
                
                TransactionType transactionType = "INCOME".equals(type) ? 
                        TransactionType.INCOME : TransactionType.EXPENSE;
                
                Optional<Category> matchedCategory = categories.stream()
                        .filter(c -> c.getName().equals(categoryName) && c.getType() == transactionType)
                        .findFirst();

                if (matchedCategory.isEmpty()) {
                    matchedCategory = categories.stream()
                            .filter(c -> c.getName().equals(categoryName))
                            .findFirst();
                }
                
                if (matchedCategory.isEmpty()) {
                    final String searchName = categoryName;
                    matchedCategory = categories.stream()
                            .filter(c -> c.getName().contains(searchName) || searchName.contains(c.getName()))
                            .filter(c -> c.getType() == transactionType)
                            .findFirst();
                }

                transaction = AiParseResponse.builder()
                        .success(true)
                        .type(type)
                        .amount(amount)
                        .categoryName(categoryName)
                        .categoryId(matchedCategory.map(Category::getId).orElse(null))
                        .memo(memo)
                        .confidence(0.9)
                        .build();
            }

            // 카테고리 데이터 파싱
            ChatResponse.CategoryData categoryData = null;
            if ("CATEGORY".equals(actionType) && parsed.has("category") && !parsed.path("category").isNull()) {
                JsonNode catNode = parsed.path("category");
                categoryData = ChatResponse.CategoryData.builder()
                        .name(catNode.path("name").asText())
                        .type(catNode.path("type").asText())
                        .icon(catNode.path("icon").asText("category"))
                        .build();
            }

            // 계좌 데이터 파싱
            ChatResponse.AccountData accountData = null;
            if ("ACCOUNT".equals(actionType) && parsed.has("account") && !parsed.path("account").isNull()) {
                JsonNode accNode = parsed.path("account");
                accountData = ChatResponse.AccountData.builder()
                        .bankName(accNode.path("bankName").asText())
                        .alias(accNode.path("alias").asText())
                        .balance(accNode.path("balance").asLong(0))
                        .build();
            }

            return ChatResponse.builder()
                    .message(message)
                    .actionType(actionType)
                    .hasTransaction(hasTransaction)
                    .transaction(transaction)
                    .category(categoryData)
                    .account(accountData)
                    .build();

        } catch (Exception e) {
            log.error("채팅 응답 파싱 실패: {}", e.getMessage(), e);
            return ChatResponse.builder()
                    .message("응답을 처리하는 중 문제가 발생했습니다. 다시 말씀해주세요.")
                    .actionType("CHAT")
                    .hasTransaction(false)
                    .build();
        }
    }
}
