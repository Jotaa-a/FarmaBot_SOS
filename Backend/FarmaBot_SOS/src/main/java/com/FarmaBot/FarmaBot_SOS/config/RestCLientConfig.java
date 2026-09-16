package com.FarmaBot.FarmaBot_SOS.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestCLientConfig {

    @Value("${qdrant.url}")
    private String qdrantUrl;

    @Value("${llm.api.url}")
    private String llmApiUrl;

    @Value("${llm.api.key}")
    private String llmApiKey;

    @Bean
    public RestClient qdrantClient() {
        return RestClient.builder()
                .baseUrl(qdrantUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Bean
    public RestClient llmClient() {
        return RestClient.builder()
                .baseUrl(llmApiUrl)
                .defaultHeader("Authorization", "Bearer " + llmApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
