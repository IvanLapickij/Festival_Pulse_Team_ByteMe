package com.festivalpulse.controller;

import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.Report;
import com.festivalpulse.repository.ReportRepository;
import com.festivalpulse.service.CrowdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final CrowdService crowdService;
    private final ReportRepository reportRepository;

    @GetMapping
    public List<Report> all() {
        return reportRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Report> submit(
            @RequestParam Long areaId,
            @RequestParam CrowdLevel crowdLevel,
            @RequestParam(required = false) String steward) {
        return ResponseEntity.ok(crowdService.submitReport(areaId, crowdLevel, steward));
    }
}
