package com.festivalpulse.kafka;

import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("kafka")
public class CrowdEventConsumer {

    @KafkaListener(topics = "festival.reports", groupId = "festival-pulse")
    public void onReportEvent(ReportEvent event) {
        // The minimum app handles alert creation synchronously in CrowdService.
    }
}
