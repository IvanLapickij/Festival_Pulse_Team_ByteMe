package com.festivalpulse.repository;

import com.festivalpulse.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByAreaIdOrderByReportedAtDesc(Long areaId);
}
