package com.festivalpulse.controller;

import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.service.CrowdService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final CrowdService crowdService;

    public AlertController(CrowdService crowdService) {
        this.crowdService = crowdService;
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
