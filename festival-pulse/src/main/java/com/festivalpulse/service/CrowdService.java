package com.festivalpulse.service;

import com.festivalpulse.kafka.ReportEvent;
import com.festivalpulse.model.AlertStatus;
import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.CrowdReport;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import com.festivalpulse.repository.ReportRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CrowdService {

    private final AreaRepository areaRepository;
    private final ReportRepository reportRepository;
    private final AlertRepository alertRepository;
    private final KafkaTemplate<String, ReportEvent> kafkaTemplate;

    public CrowdService(AreaRepository areaRepository, ReportRepository reportRepository,
                        AlertRepository alertRepository,
                        KafkaTemplate<String, ReportEvent> kafkaTemplate) {
        this.areaRepository = areaRepository;
        this.reportRepository = reportRepository;
        this.alertRepository = alertRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public CrowdReport submitReport(Long areaId, CrowdLevel level, String steward, String note) {
        FestivalArea area = areaRepository.findById(areaId)
                .orElseThrow(() -> new IllegalArgumentException("Area not found: " + areaId));

        area.setCurrentCrowdLevel(level);

        CrowdReport report = new CrowdReport();
        report.setArea(area);
        report.setCrowdLevel(level);
        report.setSteward(steward);
        report.setNote(note);
        reportRepository.save(report);

        kafkaTemplate.send("festival.reports", String.valueOf(areaId),
                new ReportEvent(areaId, area.getName(), level));

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
}
