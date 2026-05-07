package com.festivalpulse.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity @Data
public class Area {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String name;
}
