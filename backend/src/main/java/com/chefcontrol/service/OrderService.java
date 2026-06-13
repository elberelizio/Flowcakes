package com.chefcontrol.service;

import com.chefcontrol.dto.OrderCloseRequest;
import com.chefcontrol.dto.OrderRequest;
import com.chefcontrol.dto.OrderResponse;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.dto.VariableExpense;
import com.chefcontrol.entity.OrderEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.OrderRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Set<String> VALID_CLOSURE_REASONS = Set.of(
            "CLIENT_WITHDREW", "CANNOT_PRODUCE", "REFUSED_AT_DELIVERY", "REGISTRATION_ERROR", "OTHER");
    private static final Set<String> VALID_PRODUCTION_STAGES = Set.of("NOT_STARTED", "PRODUCED", "DELIVERED");
    private static final Set<String> VALID_REFUND_TYPES = Set.of("NONE", "FULL", "PARTIAL");

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    public List<OrderResponse> findAllByUserId(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public OrderResponse findById(UUID orderId, UUID userId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Pedido não pertence ao utilizador");
        }
        return OrderResponse.fromEntity(order);
    }

    public OrderResponse create(UUID userId, OrderRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        OrderEntity order = new OrderEntity();
        mapRequestToEntity(request, order);
        order.setUser(user);
        int nextNo = orderRepository.findMaxOrderNoByUserId(userId).orElse(0) + 1;
        order.setOrderNo(nextNo);
        order = orderRepository.save(order);
        return OrderResponse.fromEntity(order);
    }

    public OrderResponse update(UUID orderId, UUID userId, OrderRequest request) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Pedido não pertence ao utilizador");
        }
        mapRequestToEntity(request, order);
        order = orderRepository.save(order);
        return OrderResponse.fromEntity(order);
    }

    public void delete(UUID orderId, UUID userId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Pedido não pertence ao utilizador");
        }
        orderRepository.delete(order);
    }

    public OrderResponse closeOrder(UUID orderId, UUID userId, OrderCloseRequest request) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Pedido não pertence ao utilizador");
        }
        if (order.isCancelled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Encomenda já está cancelada");
        }
        if (order.isDelivered()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não pode cancelar uma encomenda já entregue. Registe o pagamento em falta em Gestão de dívidas.");
        }

        String reason = normalizeCode(request.getClosureReason());
        String stage = normalizeCode(request.getProductionStage());
        String refundType = normalizeCode(request.getRefundType());
        if (!VALID_CLOSURE_REASONS.contains(reason)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Motivo de encerramento inválido");
        }
        if (!VALID_PRODUCTION_STAGES.contains(stage)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de produção inválido");
        }
        if (!VALID_REFUND_TYPES.contains(refundType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de devolução inválido");
        }

        BigDecimal previousPaid = nz(order.getValuePaid());
        BigDecimal originalCharged = nz(order.getValueCharged());
        BigDecimal newPaid;
        BigDecimal refundAmount;

        switch (refundType) {
            case "FULL" -> {
                newPaid = BigDecimal.ZERO;
                refundAmount = previousPaid;
            }
            case "PARTIAL" -> {
                if (request.getValuePaidAfterClose() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Indique quanto ficou registado como pago após o acordo");
                }
                newPaid = request.getValuePaidAfterClose().setScale(2, RoundingMode.HALF_UP);
                if (newPaid.compareTo(previousPaid) > 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "O valor retido não pode ser superior ao que o cliente já pagou");
                }
                refundAmount = previousPaid.subtract(newPaid);
            }
            default -> {
                newPaid = previousPaid;
                refundAmount = BigDecimal.ZERO;
            }
        }

        if (request.getRefundAmount() != null) {
            refundAmount = request.getRefundAmount().setScale(2, RoundingMode.HALF_UP);
        }
        if (newPaid.compareTo(originalCharged) > 0) {
            newPaid = originalCharged;
        }

        // Valor cobrado passa a reflectir o acordo final (evita dívida fantasma do preço original).
        BigDecimal effectiveCharged = newPaid;

        BigDecimal varTotal = sumVariableExpenses(order.getVariableExpenses());
        BigDecimal costTotal = nz(order.getCostTotal());
        BigDecimal profit = newPaid.subtract(costTotal).subtract(varTotal).setScale(2, RoundingMode.HALF_UP);

        BigDecimal lossAmount;
        if (request.getLossAmount() != null) {
            lossAmount = request.getLossAmount().setScale(2, RoundingMode.HALF_UP);
        } else if ("NOT_STARTED".equals(stage) && costTotal.compareTo(BigDecimal.ZERO) == 0) {
            lossAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            BigDecimal suggested = costTotal.add(varTotal).subtract(newPaid);
            lossAmount = suggested.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }

        order.setValuePaid(newPaid);
        order.setValueCharged(effectiveCharged);
        order.setPaymentStatus(resolvePaymentStatus(newPaid, effectiveCharged));
        order.setProfit(profit);
        order.setCancelled(true);
        order.setOrderStatus("cancelled");
        order.setClosedAt(Instant.now());
        order.setClosureReason(reason);
        order.setClosureNote(buildClosureNote(request.getClosureNote(), originalCharged, effectiveCharged));
        order.setProductionStage(stage);
        order.setRefundType(refundType);
        order.setRefundAmount(refundAmount.max(BigDecimal.ZERO));
        order.setLossAmount(lossAmount);

        return OrderResponse.fromEntity(orderRepository.save(order));
    }

    private static String resolvePaymentStatus(BigDecimal paid, BigDecimal charged) {
        if (paid.compareTo(charged) >= 0) return "pago";
        if (paid.compareTo(BigDecimal.ZERO) > 0) return "parcial";
        return "pendente";
    }

    private static BigDecimal sumVariableExpenses(List<VariableExpense> expenses) {
        if (expenses == null || expenses.isEmpty()) return BigDecimal.ZERO;
        return expenses.stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static String normalizeCode(String raw) {
        return raw != null ? raw.trim().toUpperCase() : "";
    }

    private static String trimNote(String note) {
        if (note == null) return null;
        String t = note.trim();
        return t.isEmpty() ? null : t;
    }

    private static String buildClosureNote(String userNote, BigDecimal originalCharged, BigDecimal effectiveCharged) {
        StringBuilder sb = new StringBuilder();
        if (originalCharged.compareTo(effectiveCharged) != 0) {
            sb.append("Valor acordado antes do cancelamento: ")
                    .append(originalCharged.stripTrailingZeros().toPlainString())
                    .append(" MZN.");
        }
        String trimmed = trimNote(userNote);
        if (trimmed != null) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(trimmed);
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    public List<RevenueByMonthDto> getRevenueByMonth(UUID userId) {
        List<Object[]> rows = orderRepository.findRevenueByMonthByUser(userId);
        return rows.stream()
                .map(row -> new RevenueByMonthDto(
                        row[0] != null ? row[0].toString() : null,
                        row[1] instanceof BigDecimal ? (BigDecimal) row[1] : (row[1] instanceof Number ? BigDecimal.valueOf(((Number) row[1]).doubleValue()) : BigDecimal.ZERO)))
                .collect(Collectors.toList());
    }

    private void mapRequestToEntity(OrderRequest request, OrderEntity order) {
        order.setClientName(request.getClientName());
        order.setCategory(request.getCategory());
        order.setSubcategory(request.getSubcategory());
        order.setProductName(request.getProductName());
        order.setSize(request.getSize());
        order.setQuantityKg(request.getQuantityKg());
        order.setUnitsPerKg(request.getUnitsPerKg());
        order.setValueCharged(request.getValueCharged() != null ? request.getValueCharged() : BigDecimal.ZERO);
        order.setValuePaid(request.getValuePaid() != null ? request.getValuePaid() : BigDecimal.ZERO);
        order.setCostTotal(request.getCostTotal() != null ? request.getCostTotal() : BigDecimal.ZERO);
        order.setProfit(request.getProfit() != null ? request.getProfit() : BigDecimal.ZERO);
        order.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "pendente");
        order.setDelivered(request.isDelivered());
        order.setIngredientIds(request.getIngredientIds());
        order.setObservations(request.getObservations());
        order.setCakeName(request.getCakeName());
        order.setCakeSize(request.getCakeSize());
        order.setDeliveryDate(request.getDeliveryDate());
        order.setClientAddress(request.getClientAddress());
        order.setPickupAddress(request.getPickupAddress());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setHasDelivery(request.isHasDelivery());
        order.setDeliveryCost(request.getDeliveryCost() != null ? request.getDeliveryCost() : BigDecimal.ZERO);
        order.setOrderStatus(request.getOrderStatus() != null ? request.getOrderStatus() : "ordered");
        
        // Se isCancelled foi explicitamente definido no request, usar esse valor
        // Caso contrário, inferir do orderStatus
        if (request.getIsCancelled() != null) {
            order.setCancelled(request.getIsCancelled());
        } else {
            order.setCancelled(request.getOrderStatus() != null && request.getOrderStatus().equals("cancelled"));
        }
        
        applyVariableExpenses(request, order);
    }

    /**
     * Despesas extras pertencem à encomenda (coluna variable_expenses JSONB).
     * Se o pedido não envia a lista, preserva o que já está na BD.
     * Encomendas entregues ou canceladas não podem ter despesas alteradas.
     */
    private void applyVariableExpenses(OrderRequest request, OrderEntity order) {
        List<VariableExpense> incoming = request.getVariableExpenses();
        if (incoming == null) {
            return;
        }

        if (order.isDelivered() || order.isCancelled()) {
            if (!variableExpensesEqual(incoming, order.getVariableExpenses())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Não pode alterar despesas extras de uma encomenda entregue ou cancelada.");
            }
            return;
        }

        order.setVariableExpenses(incoming);
        recalculateProfitFromExtras(order);
    }

    private static void recalculateProfitFromExtras(OrderEntity order) {
        BigDecimal valuePaid = nz(order.getValuePaid());
        BigDecimal valueCharged = nz(order.getValueCharged());
        BigDecimal costTotal = nz(order.getCostTotal());
        BigDecimal varTotal = sumVariableExpenses(order.getVariableExpenses());

        BigDecimal profit;
        if (valuePaid.compareTo(BigDecimal.ZERO) <= 0) {
            profit = BigDecimal.ZERO;
        } else if (valueCharged.compareTo(BigDecimal.ZERO) <= 0) {
            profit = valuePaid.subtract(costTotal).subtract(varTotal);
        } else if (valuePaid.compareTo(valueCharged) >= 0) {
            // Pagamento total ou a mais (gorjeta) — lucro com base no valor recebido
            profit = valuePaid.subtract(costTotal).subtract(varTotal);
        } else {
            BigDecimal ratio = valuePaid.divide(valueCharged, 6, RoundingMode.HALF_UP);
            BigDecimal margin = valueCharged.subtract(costTotal);
            profit = margin.multiply(ratio).subtract(varTotal.multiply(ratio));
        }
        order.setProfit(profit.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
    }

    private static boolean variableExpensesEqual(List<VariableExpense> a, List<VariableExpense> b) {
        List<VariableExpense> normA = normalizeVariableExpenses(a);
        List<VariableExpense> normB = normalizeVariableExpenses(b);
        if (normA.size() != normB.size()) {
            return false;
        }
        for (int i = 0; i < normA.size(); i++) {
            VariableExpense ea = normA.get(i);
            VariableExpense eb = normB.get(i);
            String nameA = ea.getName() != null ? ea.getName() : "";
            String nameB = eb.getName() != null ? eb.getName() : "";
            if (!nameA.equals(nameB)) {
                return false;
            }
            if (nz(ea.getAmount()).compareTo(nz(eb.getAmount())) != 0) {
                return false;
            }
        }
        return true;
    }

    private static List<VariableExpense> normalizeVariableExpenses(List<VariableExpense> list) {
        if (list == null || list.isEmpty()) {
            return List.of();
        }
        List<VariableExpense> normalized = new ArrayList<>();
        for (VariableExpense expense : list) {
            if (expense == null) {
                continue;
            }
            String name = expense.getName() != null ? expense.getName().trim() : "";
            BigDecimal amount = nz(expense.getAmount()).setScale(2, RoundingMode.HALF_UP);
            normalized.add(new VariableExpense(name, amount));
        }
        return normalized;
    }
}
