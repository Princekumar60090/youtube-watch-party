package com.watchparty.controller;

import com.watchparty.dto.ApiResponse;
import com.watchparty.dto.response.HealthResponse;
import com.watchparty.service.HealthInfoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    private final HealthInfoService healthInfoService;

    public HealthController(HealthInfoService healthInfoService) {
        this.healthInfoService = healthInfoService;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<HealthResponse>> health() {
        return ResponseEntity.ok(ApiResponse.ok(healthInfoService.getHealth()));
    }
}
