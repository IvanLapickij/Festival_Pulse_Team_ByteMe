package com.festivalpulse.kafka;

import com.festivalpulse.model.Alert;
import com.festivalpulse.model.Area;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import com.festivalpulse.service.SseService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class CrowdEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(CrowdEventConsumer.class);

    private final AlertRepository alertRepository;
    private final AreaRepository areaRepository;
    private final SseService sseService;

    @KafkaListener(topics = "festival.reports", groupId = "festival-pulse")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onReportEvent(ReportEvent event) {
        if (event.getCrowdLevel() != CrowdLevel.FULL) return;

        boolean alreadyAlerted = !alertRepository.findByResolvedFalse().stream()
                .filter(a -> a.getArea().getId().equals(event.getAreaId()))
                .toList()
                .isEmpty();

        if (alreadyAlerted) {
            log.debug("Active alert already exists for area {}, skipping", event.getAreaName());
            return;
        }

        Area area = areaRepository.findById(event.getAreaId()).orElseThrow();
        Alert alert = new Alert();
        alert.setArea(area);
        alert.setMessage(event.getAreaName() + " is FULL - immediate attention required.");
        alertRepository.save(alert);

        log.info("Alert created for area {}", area.getName());
        sseService.broadcast(alert);
    }
}
