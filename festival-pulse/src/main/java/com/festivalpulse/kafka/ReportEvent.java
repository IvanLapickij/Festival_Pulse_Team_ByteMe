package com.festivalpulse.kafka;

import com.festivalpulse.model.CrowdLevel;

public class ReportEvent {
    private Long areaId;
    private String areaName;
    private CrowdLevel crowdLevel;

    public ReportEvent() {
    }

    public ReportEvent(Long areaId, String areaName, CrowdLevel crowdLevel) {
        this.areaId = areaId;
        this.areaName = areaName;
        this.crowdLevel = crowdLevel;
    }

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }

    public CrowdLevel getCrowdLevel() {
        return crowdLevel;
    }

    public void setCrowdLevel(CrowdLevel crowdLevel) {
        this.crowdLevel = crowdLevel;
    }
}
