package com.FarmaBot.FarmaBot_SOS.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class LlmService {

    private final RestClient llmClient;

    @Value("${llm.chat.model}")
    private String chatModel;

    public LlmService(RestClient llmClient) {
        this.llmClient = llmClient;
    }

    public String generarRespuesta(String systemPrompt, String userMessage) {
        Map<String, Object> body = Map.of(
                "model", chatModel,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                )
        );

        Map<String, Object> response = llmClient.post()
                .uri("/chat/completions")
                .body(body)
                .retrieve()
                .body(Map.class);

        var choices = (List<Map<String, Object>>) response.get("choices");
        var message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}
