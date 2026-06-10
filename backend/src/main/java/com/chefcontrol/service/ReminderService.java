package com.Flow Cakes.service;

import com.Flow Cakes.dto.ReminderRequest;
import com.Flow Cakes.dto.ReminderResponse;
import com.Flow Cakes.entity.ReminderEntity;
import com.Flow Cakes.repository.ReminderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;

    public ReminderService(ReminderRepository reminderRepository) {
        this.reminderRepository = reminderRepository;
    }

    public List<ReminderResponse> findAllByUserId(UUID userId) {
        return reminderRepository.findAllByUserIdOrderByDeliveryDateAsc(userId).stream()
                .map(ReminderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReminderResponse> findByUserIdAndDeliveryDate(UUID userId, LocalDate deliveryDate) {
        return reminderRepository.findByUserIdAndDeliveryDate(userId, deliveryDate).stream()
                .map(ReminderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReminderResponse> findByUserIdAndDeliveryDateBetween(UUID userId, LocalDate start, LocalDate end) {
        return reminderRepository.findByUserIdAndDeliveryDateBetweenOrderByDeliveryDateAsc(userId, start, end).stream()
                .map(ReminderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ReminderResponse create(UUID userId, ReminderRequest request) {
        ReminderEntity e = new ReminderEntity();
        e.setUserId(userId);
        e.setClientName(request.getClientName() != null ? request.getClientName().trim() : "");
        e.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        e.setDeliveryDate(request.getDeliveryDate());
        e.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        e.setNotifyDaysBefore(
                request.getNotifyDaysBefore() != null ? request.getNotifyDaysBefore() : 5);
        e = reminderRepository.save(e);
        return ReminderResponse.fromEntity(e);
    }

    public ReminderResponse update(UUID id, UUID userId, ReminderRequest request) {
        ReminderEntity e = reminderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lembrete não encontrado"));
        if (!e.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lembrete não pertence ao utilizador");
        }
        e.setClientName(request.getClientName() != null ? request.getClientName().trim() : "");
        e.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        e.setDeliveryDate(request.getDeliveryDate());
        e.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        e.setNotifyDaysBefore(
                request.getNotifyDaysBefore() != null ? request.getNotifyDaysBefore() : 5);
        e = reminderRepository.save(e);
        return ReminderResponse.fromEntity(e);
    }

    public void delete(UUID id, UUID userId) {
        ReminderEntity e = reminderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lembrete não encontrado"));
        if (!e.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lembrete não pertence ao utilizador");
        }
        reminderRepository.delete(e);
    }
}
