package com.festivalpulse.kafka;

import com.festivalpulse.model.AlertStatus;
import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class CrowdEventConsumer {

    private final AlertRepository alertRepository;
    private final AreaRepository areaRepository;

    public CrowdEventConsumer(AlertRepository alertRepository, AreaRepository areaRepository) {
        this.alertRepository = alertRepository;
        this.areaRepository = areaRepository;
    }

    @KafkaListener(topics = "festival.reports", groupId = "festival-pulse")
    public void onReportEvent(ReportEvent event) {
        if (event.getCrowdLevel() != CrowdLevel.FULL) return;

        // Avoid duplicate active alerts for the same area
        boolean alreadyActive = alertRepository
                .findByAreaIdAndStatus(event.getAreaId(), AlertStatus.ACTIVE)
                .isPresent();
        if (alreadyActive) return;

        FestivalArea area = areaRepository.findById(event.getAreaId()).orElseThrow();
        CrowdAlert alert = new CrowdAlert();
        alert.setArea(area);
        alert.setMessage(event.getAreaName() + " is FULL — immediate attention required.");
        alertRepository.save(alert);
    }
}
