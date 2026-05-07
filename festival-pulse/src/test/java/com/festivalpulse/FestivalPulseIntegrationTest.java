package com.festivalpulse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.festivalpulse.kafka.CrowdEventConsumer;
import com.festivalpulse.kafka.ReportEvent;
import com.festivalpulse.model.AlertStatus;
import com.festivalpulse.model.CrowdAlert;
import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AlertRepository;
import com.festivalpulse.repository.AreaRepository;
import com.festivalpulse.repository.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaOperations;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@AutoConfigureMockMvc
class FestivalPulseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private CrowdEventConsumer crowdEventConsumer;

    @MockBean
    private KafkaOperations<String, ReportEvent> kafkaOperations;

    @BeforeEach
    void resetData() {
        alertRepository.deleteAll();
        reportRepository.deleteAll();
        areaRepository.deleteAll();
    }

    @Test
    void createsAndListsAreas() throws Exception {
        mockMvc.perform(post("/api/areas")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("name", "West Gate"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("West Gate"))
                .andExpect(jsonPath("$.currentCrowdLevel").value("LOW"));

        mockMvc.perform(get("/api/areas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("West Gate"))
                .andExpect(jsonPath("$[0].currentCrowdLevel").value("LOW"));
    }

    @Test
    void submitsValidCrowdReport() throws Exception {
        FestivalArea area = saveArea("Main Stage");

        mockMvc.perform(post("/api/reports")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "areaId", area.getId(),
                                "crowdLevel", "MEDIUM",
                                "steward", "Sam",
                                "note", "Queues building"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.area.id").value(area.getId()))
                .andExpect(jsonPath("$.crowdLevel").value("MEDIUM"))
                .andExpect(jsonPath("$.steward").value("Sam"))
                .andExpect(jsonPath("$.note").value("Queues building"));

        assertThat(reportRepository.findAll()).hasSize(1);
        assertThat(areaRepository.findById(area.getId()).orElseThrow().getCurrentCrowdLevel())
                .isEqualTo(CrowdLevel.MEDIUM);
        verify(kafkaOperations).send(eq("festival.reports"), eq(String.valueOf(area.getId())),
                argThat(event -> event.getAreaId().equals(area.getId())
                        && event.getAreaName().equals("Main Stage")
                        && event.getCrowdLevel() == CrowdLevel.MEDIUM));
    }

    @Test
    void rejectsReportForMissingArea() throws Exception {
        mockMvc.perform(post("/api/reports")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of(
                                "areaId", 9999,
                                "crowdLevel", "FULL"
                        ))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Area not found: 9999"));

        assertThat(reportRepository.findAll()).isEmpty();
        verify(kafkaOperations, never()).send(eq("festival.reports"), eq("9999"), argThat(event -> true));
    }

    @Test
    void createsAlertFromFullReportEvent() {
        FestivalArea area = saveArea("Dance Tent");

        crowdEventConsumer.onReportEvent(new ReportEvent(area.getId(), area.getName(), CrowdLevel.FULL));

        assertThat(alertRepository.findAll())
                .singleElement()
                .satisfies(alert -> {
                    assertThat(alert.getArea().getId()).isEqualTo(area.getId());
                    assertThat(alert.getStatus()).isEqualTo(AlertStatus.ACTIVE);
                    assertThat(alert.getMessage()).contains("Dance Tent");
                });
    }

    @Test
    void resolvesAlert() throws Exception {
        FestivalArea area = saveArea("Food Village");
        CrowdAlert alert = new CrowdAlert();
        alert.setArea(area);
        alert.setMessage("Food Village is FULL - immediate attention required.");
        alert = alertRepository.save(alert);

        mockMvc.perform(put("/api/alerts/{id}/resolve", alert.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alert.getId()))
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        CrowdAlert resolved = alertRepository.findById(alert.getId()).orElseThrow();
        assertThat(resolved.getStatus()).isEqualTo(AlertStatus.RESOLVED);
        assertThat(resolved.getResolvedAt()).isNotNull();
    }

    private FestivalArea saveArea(String name) {
        FestivalArea area = new FestivalArea();
        area.setName(name);
        area.setCurrentCrowdLevel(CrowdLevel.LOW);
        return areaRepository.save(area);
    }
}
