package com.chefcontrol.service;

import com.chefcontrol.dto.VariableExpense;
import com.chefcontrol.dto.WithdrawalRequest;
import com.chefcontrol.dto.WithdrawalResponse;
import com.chefcontrol.dto.WithdrawalSummaryDto;
import com.chefcontrol.entity.OrderEntity;
import com.chefcontrol.entity.WithdrawalEntity;
import com.chefcontrol.repository.OrderRepository;
import com.chefcontrol.repository.WithdrawalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;
    private final OrderRepository orderRepository;

    public WithdrawalService(WithdrawalRepository withdrawalRepository, OrderRepository orderRepository) {
        this.withdrawalRepository = withdrawalRepository;
        this.orderRepository = orderRepository;
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

    public WithdrawalSummaryDto getSummary(UUID userId) {
        BigDecimal totalProfit = computeTotalProfit(userId);
        BigDecimal totalWithdrawn = getTotalWithdrawnByUserId(userId);
        BigDecimal available = totalProfit.subtract(totalWithdrawn).max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
        return new WithdrawalSummaryDto(
                totalProfit.setScale(2, RoundingMode.HALF_UP),
                totalWithdrawn.setScale(2, RoundingMode.HALF_UP),
                available);
    }

    public WithdrawalResponse create(UUID userId, WithdrawalRequest request) {
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal available = getSummary(userId).getAvailableProfit();

        if (amount.compareTo(available) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não pode retirar mais do que o lucro disponível ("
                            + available.stripTrailingZeros().toPlainString() + " MZN).");
        }

        WithdrawalEntity e = new WithdrawalEntity();
        e.setUserId(userId);
        e.setAmount(amount);
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

    private BigDecimal computeTotalProfit(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(o -> !o.isCancelled())
                .map(this::computeOrderProfit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal computeOrderProfit(OrderEntity order) {
        BigDecimal orderProfit = nz(order.getProfit());
        List<VariableExpense> variableExpenses = order.getVariableExpenses();
        if (variableExpenses != null && !variableExpenses.isEmpty()) {
            BigDecimal varTotal = sumVariableExpenses(variableExpenses);
            BigDecimal paid = nz(order.getValuePaid());
            BigDecimal charged = nz(order.getValueCharged());
            if (paid.compareTo(BigDecimal.ZERO) > 0
                    && charged.compareTo(BigDecimal.ZERO) > 0
                    && paid.compareTo(charged) < 0) {
                BigDecimal ratio = paid.divide(charged, 6, RoundingMode.HALF_UP);
                orderProfit = orderProfit.subtract(varTotal.multiply(ratio));
            } else if (paid.compareTo(charged) >= 0) {
                orderProfit = orderProfit.subtract(varTotal);
            }
        }
        return orderProfit.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal sumVariableExpenses(List<VariableExpense> expenses) {
        if (expenses == null || expenses.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return expenses.stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
