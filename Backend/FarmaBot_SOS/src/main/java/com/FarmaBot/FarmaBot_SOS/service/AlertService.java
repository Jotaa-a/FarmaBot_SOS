package com.FarmaBot.FarmaBot_SOS.service;

import com.FarmaBot.FarmaBot_SOS.dto.ChatRequest;
import com.FarmaBot.FarmaBot_SOS.dto.TriageResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AlertService {

    private final RestClient alertClient;

    @Value("${alert.webhook.url}")
    private String webhookUrl;

    public AlertService() {
        this.alertClient = RestClient.builder().build();
    }

    public void enviarAlertaSOS(ChatRequest request, TriageResult triage) {
        Map<String, Object> payload = Map.of(
                "usuario", request.usuario() != null ? request.usuario() : "anonimo",
                "mensajeOriginal", request.mensaje(),
                "nivelRiesgo", triage.nivelRiesgo(),
                "razon", triage.razon()
        );

        try {
            alertClient.post()
                    .uri(webhookUrl)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // En caso de fallar el webhook, se loguea pero sigue mostrando el mensaje de emergencia
            System.err.println("Fallo al enviar alerta SOS: " + e.getMessage());
        }
    }
}
