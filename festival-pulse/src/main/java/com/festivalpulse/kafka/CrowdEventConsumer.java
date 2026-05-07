package com.festivalpulse.kafka;

import com.festivalpulse.model.Alert;
import com.festivalpulse.model.Area;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CrowdEventConsumer {

    private final AlertRepository alertRepository;
    private final AreaRepository areaRepository;

    @KafkaListener(topics = "festival.reports", groupId = "festival-pulse")
    public void onReportEvent(ReportEvent event) {
        if (event.getCrowdLevel() != CrowdLevel.FULL) return;

        Area area = areaRepository.findById(event.getAreaId()).orElseThrow();

        Alert alert = new Alert();
        alert.setArea(area);
        alert.setMessage(event.getAreaName() + " is FULL — immediate attention required.");
        alertRepository.save(alert);
    }
}
