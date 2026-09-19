package com.FarmaBot.FarmaBot_SOS.service;

import com.FarmaBot.FarmaBot_SOS.dto.ProductoRecomendado;
import com.FarmaBot.FarmaBot_SOS.dto.TriageResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TriageService {

    private static final Logger log = LoggerFactory.getLogger(TriageService.class);

    private static final String TRIAGE_PROMPT = """
        Eres un clasificador de riesgo médico para una droguería.
        Analiza el mensaje del usuario y responde SOLO con un JSON válido,
        sin texto adicional, con este formato exacto:
        {"esEmergencia": boolean, "nivelRiesgo": "ALTO" o "BAJO", "razon": "string breve"}

        Marca esEmergencia=true si detectas señales como: dolor en el pecho,
        falta de aire, visión borrosa repentina, convulsiones, sangrado abundante,
        pérdida de consciencia, o cualquier síntoma que sugiera una urgencia médica.
        """;

    private static final String RESPUESTA_COMERCIAL_PROMPT = """
        Eres un asistente farmacéutico. Con base en los productos recuperados,
        recomienda el más adecuado al síntoma del usuario, indicando su precio
        y en qué estante se encuentra. SIEMPRE termina aclarando que esta
        respuesta es solo una guía y no reemplaza la opinión de un médico o farmacéutico.
    """;

    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    public TriageService(LlmService llmService, ObjectMapper objectMapper) {
        this.llmService = llmService;
        this.objectMapper = objectMapper;
    }

    public TriageResult evaluar(String mensajeUsuario){
        String jsonRespuesta = llmService.generarRespuesta(TRIAGE_PROMPT, mensajeUsuario);
        try {
            TriageResult resultado = objectMapper.readValue(jsonRespuesta, TriageResult.class);
            log.info("Triaje realizado - esEmergencia: {}, nivelRiesgo: {}, razon: {}",
                    resultado.esEmergencia(), resultado.nivelRiesgo(), resultado.razon());
            return resultado;
        } catch (Exception e) {
            log.error("Fallo al parsear respuesta del LLM: {}", e.getMessage());
            return new TriageResult(false, "BAJO",
                    "No se puede clasificar automaticamente: " + e.getMessage());
        }
    }

    public String generarRespuestaComercial(List<ProductoRecomendado> productos) {
        String contexto = productos.stream()
                .map(p -> "- %s: %s (Precio: $%d, Estante: %s)".formatted(
                        p.nombre(), p.usos(), p.precio(), p.estante()))
                .collect(Collectors.joining("\n"));

        return llmService.generarRespuesta(RESPUESTA_COMERCIAL_PROMPT, contexto);
    }
}
