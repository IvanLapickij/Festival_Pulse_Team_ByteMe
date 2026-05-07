package com.festivalpulse.controller;

import com.festivalpulse.model.Area;
import com.festivalpulse.repository.AreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
@RequiredArgsConstructor
public class AreaController {

    private final AreaRepository areaRepository;

    @GetMapping
    public List<Area> all() {
        return areaRepository.findAll();
    }

    @PostMapping
    public Area create(@RequestBody Area area) {
        return areaRepository.save(area);
    }
}
