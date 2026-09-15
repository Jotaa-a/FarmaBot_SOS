package com.FarmaBot.FarmaBot_SOS.dto;

public record TriageResult(
        boolean esEmergencia,
        String nivelRiesgo,
        String razon
) {
}
