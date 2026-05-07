package com.festivalpulse.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity @Data
public class Report {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Area area;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CrowdLevel crowdLevel;

    private String steward;

    private LocalDateTime reportedAt = LocalDateTime.now();
}
