package com.festivalpulse.kafka;

import com.festivalpulse.model.AlertStatus;
import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrowdEventConsumerTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private AreaRepository areaRepository;

    private CrowdEventConsumer crowdEventConsumer;

    @BeforeEach
    void setUp() {
        crowdEventConsumer = new CrowdEventConsumer(alertRepository, areaRepository);
    }

    @Test
    void ignoresReportsThatAreNotFull() {
        crowdEventConsumer.onReportEvent(new ReportEvent(1L, "Main Stage", CrowdLevel.MEDIUM));

        verify(alertRepository, never()).save(org.mockito.ArgumentMatchers.any(CrowdAlert.class));
        verify(areaRepository, never()).findById(1L);
    }

    @Test
    void doesNotCreateDuplicateActiveAlertForArea() {
        CrowdAlert existing = new CrowdAlert();
        when(alertRepository.findByAreaIdAndStatus(1L, AlertStatus.ACTIVE)).thenReturn(Optional.of(existing));

        crowdEventConsumer.onReportEvent(new ReportEvent(1L, "Main Stage", CrowdLevel.FULL));

        verify(alertRepository, never()).save(org.mockito.ArgumentMatchers.any(CrowdAlert.class));
        verify(areaRepository, never()).findById(1L);
    }

    @Test
    void createsActiveAlertForFullReportWhenNoActiveAlertExists() {
        FestivalArea area = new FestivalArea();
        area.setId(1L);
        area.setName("Main Stage");
        when(alertRepository.findByAreaIdAndStatus(1L, AlertStatus.ACTIVE)).thenReturn(Optional.empty());
        when(areaRepository.findById(1L)).thenReturn(Optional.of(area));

        crowdEventConsumer.onReportEvent(new ReportEvent(1L, "Main Stage", CrowdLevel.FULL));

        ArgumentCaptor<CrowdAlert> alertCaptor = ArgumentCaptor.forClass(CrowdAlert.class);
        verify(alertRepository).save(alertCaptor.capture());
        CrowdAlert savedAlert = alertCaptor.getValue();
        assertThat(savedAlert.getArea()).isSameAs(area);
        assertThat(savedAlert.getStatus()).isEqualTo(AlertStatus.ACTIVE);
        assertThat(savedAlert.getMessage()).contains("Main Stage");
    }
}
