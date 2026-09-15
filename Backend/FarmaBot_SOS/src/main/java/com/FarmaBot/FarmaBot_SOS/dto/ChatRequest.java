package com.FarmaBot.FarmaBot_SOS.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest (
        @NotBlank(message = "El mensaje no puede estar vacio")
        String mensaje,
        String usuario
) {
}
