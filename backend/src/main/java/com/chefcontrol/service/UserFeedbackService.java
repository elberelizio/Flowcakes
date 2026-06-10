package com.Flow Cakes.service;

import com.Flow Cakes.dto.FeedbackPromptStatusDto;
import com.Flow Cakes.dto.UserFeedbackDto;
import com.Flow Cakes.entity.UserEntity;
import com.Flow Cakes.entity.UserFeedbackEntity;
import com.Flow Cakes.repository.UserFeedbackRepository;
import com.Flow Cakes.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserFeedbackService {

    /** Minimum days between satisfaction prompts after a submission. */
    public static final int PROMPT_COOLDOWN_DAYS = 30;

    private final UserFeedbackRepository repository;
    private final UserRepository userRepository;

    public UserFeedbackService(UserFeedbackRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public UserFeedbackDto submit(UUID userId, int rating, String comment, Boolean wouldRecommend) {
        if (rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avaliação deve ser entre 1 e 5");
        }
        UserFeedbackEntity e = new UserFeedbackEntity();
        e.setUserId(userId);
        e.setRating(rating);
        e.setComment(comment != null ? comment.trim() : null);
        e.setWouldRecommend(wouldRecommend);
        e = repository.save(e);
        return toDto(e);
    }

    public FeedbackPromptStatusDto getPromptStatus(UUID userId, boolean firstLoginContext) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (user.isAdmin()) {
            FeedbackPromptStatusDto empty = new FeedbackPromptStatusDto();
            empty.setEligible(false);
            empty.setShouldPromptOnLogin(false);
            empty.setShouldPromptOnLogout(false);
            return empty;
        }

        var last = repository.findFirstByUserIdOrderByCreatedAtDesc(userId);
        boolean eligible = last.isEmpty()
            || last.get().getCreatedAt().isBefore(Instant.now().minus(PROMPT_COOLDOWN_DAYS, ChronoUnit.DAYS));

        FeedbackPromptStatusDto dto = new FeedbackPromptStatusDto();
        dto.setEligible(eligible);
        dto.setShouldPromptOnLogin(eligible && firstLoginContext);
        dto.setShouldPromptOnLogout(eligible);
        last.ifPresent(e -> dto.setLastSubmittedAt(e.getCreatedAt().toString()));
        return dto;
    }

    public List<UserFeedbackDto> listForAdmin(UUID adminUserId) {
        UserEntity u = userRepository.findById(adminUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!u.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso reservado a administradores");
        }
        return repository.findTop50ByOrderByCreatedAtDesc().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public double getAverageRating(UUID adminUserId) {
        UserEntity u = userRepository.findById(adminUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!u.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso reservado a administradores");
        }
        List<UserFeedbackEntity> all = repository.findAll();
        if (all.isEmpty()) return 0;
        return all.stream().mapToInt(UserFeedbackEntity::getRating).average().orElse(0);
    }

    public long getRecommendYesCount(UUID adminUserId) {
        assertAdmin(adminUserId);
        return repository.findAll().stream().filter(e -> Boolean.TRUE.equals(e.getWouldRecommend())).count();
    }

    private void assertAdmin(UUID adminUserId) {
        UserEntity u = userRepository.findById(adminUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!u.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso reservado a administradores");
        }
    }

    private UserFeedbackDto toDto(UserFeedbackEntity e) {
        UserFeedbackDto d = new UserFeedbackDto();
        d.setId(e.getId() != null ? e.getId().toString() : null);
        d.setUserId(e.getUserId() != null ? e.getUserId().toString() : null);
        d.setRating(e.getRating() != null ? e.getRating() : 0);
        d.setComment(e.getComment());
        d.setWouldRecommend(e.getWouldRecommend());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        userRepository.findById(e.getUserId()).ifPresent(u -> {
            d.setUserPhone(u.getPhone());
            d.setUserFullName(u.getFullName());
        });
        return d;
    }
}
