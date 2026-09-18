package com.FarmaBot.FarmaBot_SOS.controller;

import com.FarmaBot.FarmaBot_SOS.dto.ChatRequest;
import com.FarmaBot.FarmaBot_SOS.dto.ChatResponse;
import com.FarmaBot.FarmaBot_SOS.dto.ProductoRecomendado;
import com.FarmaBot.FarmaBot_SOS.dto.TriageResult;
import com.FarmaBot.FarmaBot_SOS.modelo.Producto;
import com.FarmaBot.FarmaBot_SOS.repository.ProductoRepository;
import com.FarmaBot.FarmaBot_SOS.service.AlertService;
import com.FarmaBot.FarmaBot_SOS.service.QdrantService;
import com.FarmaBot.FarmaBot_SOS.service.TriageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Chat", description = "Requiere un string con el mensaje (Los sintomas) y el usuario quien hace la peticion")
public class ChatController {

    private final TriageService triageService;
    private final QdrantService qdrantService;
    private final AlertService alertService;
    private final ProductoRepository productoRepository;

    public ChatController(TriageService triageService,
                          QdrantService qdrantService,
                          AlertService alertService,
                          ProductoRepository productoRepository) {
        this.triageService = triageService;
        this.qdrantService = qdrantService;
        this.alertService = alertService;
        this.productoRepository = productoRepository;
    }

    @Operation(
            summary = "Requiere los sintomas del paciente",
            description = "Hace la consulta al modelo  IA basandose en los sintomas del paciente"
    )

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat (@Valid @RequestBody ChatRequest request){
        TriageResult triage = triageService.evaluar(request.mensaje());

        if (triage.esEmergencia()) {
            alertService.enviarAlertaSOS(request, triage);
            return ResponseEntity.ok(ChatResponse.emergencia(triage.razon()));
        }

        List<Long> ids = qdrantService.buscarIdsSimilares(request.mensaje(), 3);
        List<ProductoRecomendado> productos = productoRepository.findAllById(ids).stream()
                .map(
                        p -> new ProductoRecomendado(
                                p.getNombre(),
                                p.getUsos(),
                                p.getPrecio(),
                                p.getEstante()
                        )
                ).toList();
        String respuesta = triageService.generarRespuestaComercial(productos);

        return ResponseEntity.ok(ChatResponse.comercial(respuesta, productos));
    }
}
