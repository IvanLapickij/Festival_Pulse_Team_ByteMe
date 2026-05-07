package com.festivalpulse.repository;

import com.festivalpulse.model.AlertStatus;
import com.festivalpulse.model.CrowdAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<CrowdAlert, Long> {
    List<CrowdAlert> findByStatusOrderByCreatedAtDesc(AlertStatus status);

    Optional<CrowdAlert> findByAreaIdAndStatus(Long areaId, AlertStatus status);
}
