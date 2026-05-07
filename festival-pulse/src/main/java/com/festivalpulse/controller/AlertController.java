package com.festivalpulse.controller;

import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.service.CrowdService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository alertRepository;
    private final CrowdService crowdService;

    public AlertController(AlertRepository alertRepository, CrowdService crowdService) {
        this.alertRepository = alertRepository;
        this.crowdService = crowdService;
    }

    @GetMapping
    public List<CrowdAlert> all() {
        return alertRepository.findAll();
    }

    @GetMapping("/active")
    public List<CrowdAlert> active() {
        return crowdService.getActiveAlerts();
    }

    @PutMapping("/{id}/resolve")
    public CrowdAlert resolve(@PathVariable Long id) {
        return crowdService.resolveAlert(id);
    }
}
