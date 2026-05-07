package com.festivalpulse.controller;

import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.CrowdReport;
import com.festivalpulse.repository.ReportRepository;
import com.festivalpulse.service.CrowdService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final CrowdService crowdService;
    private final ReportRepository reportRepository;

    public ReportController(CrowdService crowdService, ReportRepository reportRepository) {
        this.crowdService = crowdService;
        this.reportRepository = reportRepository;
    }

    @GetMapping
    public List<CrowdReport> all() {
        return reportRepository.findAll();
    }

    @PostMapping
    public CrowdReport submit(@Valid @RequestBody ReportRequest request) {
        return crowdService.submitReport(request.areaId(), request.crowdLevel(), request.steward(), request.note());
    }

    public record ReportRequest(@NotNull Long areaId, @NotNull CrowdLevel crowdLevel, String steward, String note) {}
}
