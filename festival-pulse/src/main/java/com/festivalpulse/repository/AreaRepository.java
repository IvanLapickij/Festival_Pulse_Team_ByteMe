package com.festivalpulse.repository;

import com.festivalpulse.model.FestivalArea;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AreaRepository extends JpaRepository<FestivalArea, Long> {}
