package com.FarmaBot.FarmaBot_SOS.dto;

import java.util.List;

public record ChatResponse (
        boolean esEmergencia,
        String mensaje,
        List<ProductoRecomendado> productos
) {
    public static ChatResponse emergencia (String razon){
        return new ChatResponse(
                true,
                "Esto podria ser una EMERGENCIA: " + razon +
                        ". Por favor busca atencion inmediata en la linea 123 o a tu EX :).",
                List.of()
        );
    }

    public static ChatResponse comercial(String mensaje, List<ProductoRecomendado> productos){
        return new ChatResponse(false, mensaje, productos);
    }

}
