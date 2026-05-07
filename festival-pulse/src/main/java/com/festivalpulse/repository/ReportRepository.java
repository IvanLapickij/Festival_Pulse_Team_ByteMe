package com.festivalpulse.repository;

import com.festivalpulse.model.CrowdReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<CrowdReport, Long> {
    List<CrowdReport> findByAreaIdOrderByReportedAtDesc(Long areaId);
}
