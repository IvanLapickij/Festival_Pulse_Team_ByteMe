package com.festivalpulse.controller;

import com.festivalpulse.service.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;

    @GetMapping("/stream")
    SseEmitter stream() {
        return sseService.subscribe();
    }
}
