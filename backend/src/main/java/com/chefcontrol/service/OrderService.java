package com.chefcontrol.service;

import com.chefcontrol.dto.OrderRequest;
import com.chefcontrol.dto.OrderResponse;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.entity.OrderEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.OrderRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

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
        
        // Mapear despesas variáveis
        order.setVariableExpenses(request.getVariableExpenses());
    }
}
