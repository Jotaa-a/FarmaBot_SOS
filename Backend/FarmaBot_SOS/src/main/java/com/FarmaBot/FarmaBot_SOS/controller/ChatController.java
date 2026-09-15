package com.FarmaBot.FarmaBot_SOS.controller;

import com.FarmaBot.FarmaBot_SOS.dto.ChatRequest;
import com.FarmaBot.FarmaBot_SOS.dto.ChatResponse;
import com.FarmaBot.FarmaBot_SOS.dto.TriageResult;
import com.FarmaBot.FarmaBot_SOS.service.AlertService;
import com.FarmaBot.FarmaBot_SOS.service.QdrantService;
import com.FarmaBot.FarmaBot_SOS.service.TriageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final TriageService triageService;
    private final QdrantService qdrantService;
    private final AlertService alertService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> caht (@RequestBody ChatRequest request){
        TriageResult triage = triageService.evaluar(request.getMessage)
    }
}
