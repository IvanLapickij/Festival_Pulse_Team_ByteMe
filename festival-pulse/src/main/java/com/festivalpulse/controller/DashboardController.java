package com.festivalpulse.controller;

import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.model.CrowdReport;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AreaRepository;
import com.festivalpulse.repository.ReportRepository;
import com.festivalpulse.service.CrowdService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final AreaRepository areaRepository;
    private final ReportRepository reportRepository;
    private final CrowdService crowdService;

    public DashboardController(
            AreaRepository areaRepository,
            ReportRepository reportRepository,
            CrowdService crowdService
    ) {
        this.areaRepository = areaRepository;
        this.reportRepository = reportRepository;
        this.crowdService = crowdService;
    }

    @GetMapping
    public DashboardResponse getDashboard() {
        return new DashboardResponse(
                areaRepository.findAll(),
                reportRepository.findAll(),
                crowdService.getActiveAlerts()
        );
    }

    public record DashboardResponse(
            List<FestivalArea> areas,
            List<CrowdReport> reports,
            List<CrowdAlert> activeAlerts
    ) {
    }
}
