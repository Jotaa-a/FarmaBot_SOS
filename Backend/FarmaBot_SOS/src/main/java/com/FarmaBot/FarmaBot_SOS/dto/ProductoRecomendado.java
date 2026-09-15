package com.FarmaBot.FarmaBot_SOS.dto;

public record ProductoRecomendado(
        String nombre,
        String indicaciones,
        String categoria,
        String dosisRecomendada,
        double score
) {
}
