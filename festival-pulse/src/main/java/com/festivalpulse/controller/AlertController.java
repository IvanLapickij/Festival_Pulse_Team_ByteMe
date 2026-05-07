package com.festivalpulse.controller;

import com.festivalpulse.model.Alert;
import com.festivalpulse.service.CrowdService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final CrowdService crowdService;

    @GetMapping
    public List<Alert> active() {
        return crowdService.getActiveAlerts();
    }

    @PatchMapping("/{id}/resolve")
    public void resolve(@PathVariable Long id) {
        crowdService.resolveAlert(id);
    }
}
