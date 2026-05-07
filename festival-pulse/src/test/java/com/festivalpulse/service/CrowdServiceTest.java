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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaOperations;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrowdServiceTest {

    @Mock
    private AreaRepository areaRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private KafkaOperations<String, ReportEvent> kafkaOperations;

    private CrowdService crowdService;

    @BeforeEach
    void setUp() {
        crowdService = new CrowdService(areaRepository, reportRepository, alertRepository, kafkaOperations);
    }

    @Test
    void submitReportUpdatesAreaSavesReportAndPublishesEvent() {
        FestivalArea area = area(42L, "Main Stage", CrowdLevel.LOW);
        when(areaRepository.findById(42L)).thenReturn(Optional.of(area));

        CrowdReport report = crowdService.submitReport(42L, CrowdLevel.FULL, "Nia", "At capacity");

        assertThat(area.getCurrentCrowdLevel()).isEqualTo(CrowdLevel.FULL);
        assertThat(report.getArea()).isSameAs(area);
        assertThat(report.getCrowdLevel()).isEqualTo(CrowdLevel.FULL);
        assertThat(report.getSteward()).isEqualTo("Nia");
        assertThat(report.getNote()).isEqualTo("At capacity");
        verify(reportRepository).save(report);
        verify(kafkaOperations).send(eq("festival.reports"), eq("42"),
                argThat(event -> event.getAreaId().equals(42L)
                        && event.getAreaName().equals("Main Stage")
                        && event.getCrowdLevel() == CrowdLevel.FULL));
    }

    @Test
    void submitReportThrowsWhenAreaDoesNotExist() {
        when(areaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crowdService.submitReport(99L, CrowdLevel.MEDIUM, "Nia", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Area not found: 99");

        verify(reportRepository, never()).save(argThat(report -> true));
        verify(kafkaOperations, never()).send(eq("festival.reports"), eq("99"), argThat(event -> true));
    }

    @Test
    void getActiveAlertsReturnsRepositoryResults() {
        CrowdAlert alert = new CrowdAlert();
        when(alertRepository.findByStatusOrderByCreatedAtDesc(AlertStatus.ACTIVE)).thenReturn(List.of(alert));

        assertThat(crowdService.getActiveAlerts()).containsExactly(alert);
    }

    @Test
    void resolveAlertMarksItResolvedAndSetsTimestamp() {
        CrowdAlert alert = new CrowdAlert();
        when(alertRepository.findById(7L)).thenReturn(Optional.of(alert));

        CrowdAlert resolved = crowdService.resolveAlert(7L);

        assertThat(resolved.getStatus()).isEqualTo(AlertStatus.RESOLVED);
        assertThat(resolved.getResolvedAt()).isNotNull();
    }

    @Test
    void resolveAlertThrowsWhenAlertDoesNotExist() {
        when(alertRepository.findById(123L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crowdService.resolveAlert(123L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Alert not found: 123");
    }

    private FestivalArea area(Long id, String name, CrowdLevel crowdLevel) {
        FestivalArea area = new FestivalArea();
        area.setId(id);
        area.setName(name);
        area.setCurrentCrowdLevel(crowdLevel);
        return area;
    }
}
