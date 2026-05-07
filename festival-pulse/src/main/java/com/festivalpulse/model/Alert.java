package com.festivalpulse.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity @Data
public class Alert {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Area area;

    private String message;
    private boolean resolved = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}
