package com.FarmaBot.FarmaBot_SOS.service;

import com.FarmaBot.FarmaBot_SOS.dto.ProductoRecomendado;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QdrantService {

    private final RestClient qdrantClient;
    private final EmbeddingService embeddingService;

    @Value("${qdrant.collection}")
    private String collection;

    public QdrantService(RestClient qdrantClient, EmbeddingService embeddingService) {
        this.qdrantClient = qdrantClient;
        this.embeddingService = embeddingService;
    }

    public List<Long> buscarIdsSimilares(String consulta, int k) {
        List<Double> vector = embeddingService.generarEmbedding(consulta);

        Map<String, Object> body = Map.of(
                "vector", vector,
                "limit", k,
                "with_payload", false
        );

        Map<String, Object> response = qdrantClient.post()
                .uri("/collections/{collection}/points/search", collection)
                .body(body)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> resultados = (List<Map<String, Object>>) response.get("result");

        return resultados.stream()
                .map(r -> ((Number) r.get("id")).longValue())
                .collect(Collectors.toList());
    }
}
