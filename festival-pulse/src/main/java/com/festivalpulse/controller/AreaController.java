package com.festivalpulse.controller;

import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AreaRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private final AreaRepository areaRepository;

    public AreaController(AreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    @GetMapping
    public List<FestivalArea> all() {
        return areaRepository.findAll();
    }

    @PostMapping
    public FestivalArea create(@Valid @RequestBody AreaRequest request) {
        FestivalArea area = new FestivalArea();
        area.setName(request.name());
        area.setCurrentCrowdLevel(request.currentCrowdLevel() == null ? CrowdLevel.LOW : request.currentCrowdLevel());
        return areaRepository.save(area);
    }

    public record AreaRequest(@NotBlank String name, CrowdLevel currentCrowdLevel) {
    }
}
