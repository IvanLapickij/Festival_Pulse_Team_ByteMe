package com.festivalpulse.service;

import com.festivalpulse.kafka.ReportEvent;
import com.festivalpulse.model.Alert;
import com.festivalpulse.model.Area;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.Report;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import com.festivalpulse.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CrowdService {

    private final AreaRepository areaRepository;
    private final ReportRepository reportRepository;
    private final AlertRepository alertRepository;
    private final KafkaTemplate<String, ReportEvent> kafkaTemplate;

    @Transactional
    public Report submitReport(Long areaId, CrowdLevel level, String steward) {
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new IllegalArgumentException("Area not found: " + areaId));

        Report report = new Report();
        report.setArea(area);
        report.setCrowdLevel(level);
        report.setSteward(steward);
        reportRepository.save(report);

        kafkaTemplate.send("festival.reports", String.valueOf(areaId),
                new ReportEvent(areaId, area.getName(), level));

        return report;
    }

    public List<Alert> getActiveAlerts() {
        return alertRepository.findByResolvedFalse();
    }

    @Transactional
    public void resolveAlert(Long alertId) {
        alertRepository.findById(alertId).ifPresent(a -> {
            a.setResolved(true);
            alertRepository.save(a);
        });
    }
}
