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

    public QdrantService(RestClient qdrantClient, EmbeddingService embeddingService){
        this.qdrantClient = qdrantClient;
        this.embeddingService = embeddingService;
    }

    public List<ProductoRecomendado> buscarSimilares(String consulta, int k){
        List<Double> vector = embeddingService.generarEmbedding(consulta);

        Map<String, Object> body = Map.of(
                "vector", vector,
                "limit", k,
                "with_payload", true
        );

        Map<String, Object> response = qdrantClient.post()
                .uri("/collections/{collection}/points/search", collection)
                .body(body)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> resultados = (List<Map<String, Object>>) response.get("result");

        return resultados.stream()
                .map(this::mapearProducto)
                .collect(Collectors.toList());
    }

    private ProductoRecomendado mapearProducto(Map<String, Object> punto) {
        Map<String, Object> payload = (Map<String, Object>) punto.get("payload");
        double score = ((Number) punto.get("score")).doubleValue();

        return new ProductoRecomendado(
                (String) payload.get("nombre"),
                (String) payload.get("indicaciones"),
                (String) payload.get("categoria"),
                (String) payload.get("dosis_recomendada"),
                score
        );
    }

}
