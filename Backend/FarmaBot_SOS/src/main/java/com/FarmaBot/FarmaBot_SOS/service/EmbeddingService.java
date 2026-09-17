package com.FarmaBot.FarmaBot_SOS.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {

    private final RestClient llmClient;

    public EmbeddingService(RestClient llmClient){
        this.llmClient = llmClient;
    }

    @Value("${llm.embedding.model}")
    private String embeddingModel;

    public List<Double> generarEmbedding(String texto) {
        Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", texto,
                "dimensions", 1536
        );

        Map<String, Object> response = llmClient.post()
                .uri("/embeddings")
                .body(body)
                .retrieve()
                .body(Map.class);

        var data = (List<Map<String, Object>>) response.get("data");

        return (List<Double>) data.get(0).get("embedding");
    }
}
