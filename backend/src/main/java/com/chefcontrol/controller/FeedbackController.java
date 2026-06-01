package com.chefcontrol.controller;

import com.chefcontrol.config.CurrentUserId;
import com.chefcontrol.dto.FeedbackPromptStatusDto;
import com.chefcontrol.dto.UserFeedbackDto;
import com.chefcontrol.dto.UserFeedbackRequest;
import com.chefcontrol.service.UserFeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Submissão de feedback de satisfação por utilizadores autenticados.
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final UserFeedbackService feedbackService;

    public FeedbackController(UserFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<UserFeedbackDto> submit(@CurrentUserId UUID userId, @Valid @RequestBody UserFeedbackRequest body) {
        return ResponseEntity.ok(
            feedbackService.submit(userId, body.getRating(), body.getComment(), body.getWouldRecommend()));
    }

    /** When the app may show the satisfaction survey (after login or before logout). */
    @GetMapping("/prompt-status")
    public ResponseEntity<FeedbackPromptStatusDto> promptStatus(
        @CurrentUserId UUID userId,
        @RequestParam(defaultValue = "false") boolean firstLoginContext) {
        return ResponseEntity.ok(feedbackService.getPromptStatus(userId, firstLoginContext));
    }
}
