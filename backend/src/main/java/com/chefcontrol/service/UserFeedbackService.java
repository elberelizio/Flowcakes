package com.chefcontrol.service;

import com.chefcontrol.dto.UserFeedbackDto;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.entity.UserFeedbackEntity;
import com.chefcontrol.repository.UserFeedbackRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserFeedbackService {

    private final UserFeedbackRepository repository;
    private final UserRepository userRepository;

    public UserFeedbackService(UserFeedbackRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public UserFeedbackDto submit(UUID userId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avaliação deve ser entre 1 e 5");
        }
        UserFeedbackEntity e = new UserFeedbackEntity();
        e.setUserId(userId);
        e.setRating(rating);
        e.setComment(comment != null ? comment.trim() : null);
        e = repository.save(e);
        return toDto(e);
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

    private UserFeedbackDto toDto(UserFeedbackEntity e) {
        UserFeedbackDto d = new UserFeedbackDto();
        d.setId(e.getId() != null ? e.getId().toString() : null);
        d.setUserId(e.getUserId() != null ? e.getUserId().toString() : null);
        d.setRating(e.getRating() != null ? e.getRating() : 0);
        d.setComment(e.getComment());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        userRepository.findById(e.getUserId()).ifPresent(u -> {
            d.setUserPhone(u.getPhone());
            d.setUserFullName(u.getFullName());
        });
        return d;
    }
}
