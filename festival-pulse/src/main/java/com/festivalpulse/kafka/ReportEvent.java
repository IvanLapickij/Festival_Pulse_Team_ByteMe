package com.festivalpulse.kafka;

import com.festivalpulse.model.CrowdLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportEvent {
    private Long areaId;
    private String areaName;
    private CrowdLevel crowdLevel;
}
