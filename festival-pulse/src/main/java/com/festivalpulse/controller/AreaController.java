package com.festivalpulse.controller;

import com.festivalpulse.model.CrowdLevel;
import com.festivalpulse.model.FestivalArea;
import com.festivalpulse.repository.AreaRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
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

    @PutMapping("/{id}")
    public ResponseEntity<FestivalArea> update(@PathVariable Long id, @Valid @RequestBody AreaRequest request) {
        return areaRepository.findById(id).map(area -> {
            area.setName(request.name());
            if (request.currentCrowdLevel() != null) area.setCurrentCrowdLevel(request.currentCrowdLevel());
            return ResponseEntity.ok(areaRepository.save(area));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!areaRepository.existsById(id)) return ResponseEntity.notFound().build();
        areaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public record AreaRequest(@NotBlank String name, CrowdLevel currentCrowdLevel) {}
}
