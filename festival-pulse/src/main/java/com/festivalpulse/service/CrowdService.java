package com.festivalpulse.service;

import com.festivalpulse.model.AlertStatus;
import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.CrowdReport;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import com.festivalpulse.repository.ReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CrowdService {

    private final AreaRepository areaRepository;
    private final ReportRepository reportRepository;
    private final AlertRepository alertRepository;

    public CrowdService(
            AreaRepository areaRepository,
            ReportRepository reportRepository,
            AlertRepository alertRepository
    ) {
        this.areaRepository = areaRepository;
        this.reportRepository = reportRepository;
        this.alertRepository = alertRepository;
    }

    @Transactional
    public CrowdReport submitReport(Long areaId, CrowdLevel level, String steward) {
        FestivalArea area = areaRepository.findById(areaId)
                .orElseThrow(() -> new IllegalArgumentException("Area not found: " + areaId));

        area.setCurrentCrowdLevel(level);

        CrowdReport report = new CrowdReport();
        report.setArea(area);
        report.setCrowdLevel(level);
        report.setSteward(steward);
        reportRepository.save(report);

        if (level == CrowdLevel.FULL) {
            alertRepository.findByAreaIdAndStatus(area.getId(), AlertStatus.ACTIVE)
                    .orElseGet(() -> createFullAlert(area));
        }

        return report;
    }

    public List<CrowdAlert> getActiveAlerts() {
        return alertRepository.findByStatusOrderByCreatedAtDesc(AlertStatus.ACTIVE);
    }

    @Transactional
    public CrowdAlert resolveAlert(Long alertId) {
        CrowdAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        return alert;
    }

    private CrowdAlert createFullAlert(FestivalArea area) {
        CrowdAlert alert = new CrowdAlert();
        alert.setArea(area);
        alert.setMessage(area.getName() + " is FULL - immediate attention required.");
        return alertRepository.save(alert);
    }
}
