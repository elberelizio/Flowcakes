package com.chefcontrol.service;

import com.chefcontrol.dto.WithdrawalRequest;
import com.chefcontrol.dto.WithdrawalResponse;
import com.chefcontrol.entity.WithdrawalEntity;
import com.chefcontrol.repository.WithdrawalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;

    public WithdrawalService(WithdrawalRepository withdrawalRepository) {
        this.withdrawalRepository = withdrawalRepository;
    }

    public List<WithdrawalResponse> findAllByUserId(UUID userId) {
        return withdrawalRepository.findAllByUserIdOrderByWithdrawalDateDesc(userId).stream()
                .map(WithdrawalResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public BigDecimal getTotalWithdrawnByUserId(UUID userId) {
        BigDecimal sum = withdrawalRepository.sumAmountByUserId(userId);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public WithdrawalResponse create(UUID userId, WithdrawalRequest request) {
        WithdrawalEntity e = new WithdrawalEntity();
        e.setUserId(userId);
        e.setAmount(request.getAmount());
        e.setWithdrawalDate(request.getWithdrawalDate());
        e.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        e = withdrawalRepository.save(e);
        return WithdrawalResponse.fromEntity(e);
    }

    public void delete(UUID id, UUID userId) {
        WithdrawalEntity e = withdrawalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Retirada não encontrada"));
        if (!e.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Retirada não pertence ao utilizador");
        }
        withdrawalRepository.delete(e);
    }
}
