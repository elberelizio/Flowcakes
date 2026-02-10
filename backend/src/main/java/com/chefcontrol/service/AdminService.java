package com.chefcontrol.service;

import com.chefcontrol.dto.AdminOrderResponse;
import com.chefcontrol.dto.AdminStatsResponse;
import com.chefcontrol.dto.AdminUserRow;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.entity.OrderEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.entity.UserLicenseEntity;
import com.chefcontrol.repository.OrderRepository;
import com.chefcontrol.repository.UserLicenseRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final UserLicenseRepository licenseRepository;
    private final LicenseService licenseService;
    private final OrderRepository orderRepository;

    public AdminService(UserRepository userRepository, UserLicenseRepository licenseRepository,
                        LicenseService licenseService, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.licenseRepository = licenseRepository;
        this.licenseService = licenseService;
        this.orderRepository = orderRepository;
    }

    public void requireAdmin(UUID userId) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (!user.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso reservado a administradores");
        }
    }

    public AdminStatsResponse getStats(UUID adminUserId) {
        requireAdmin(adminUserId);
        AdminStatsResponse r = new AdminStatsResponse();
        r.setTotalUsers(userRepository.count());
        java.time.Instant now = java.time.Instant.now();
        long paid = licenseRepository.findAll().stream()
            .filter(l -> "paid".equals(l.getStatus()) && (l.getValidUntil() == null || l.getValidUntil().isAfter(now)))
            .count();
        r.setLicensesPaid(paid);
        r.setLicensesPending(licenseRepository.count() - paid);
        return r;
    }

    public List<AdminUserRow> getUsers(UUID adminUserId) {
        requireAdmin(adminUserId);
        return userRepository.findAll().stream()
            .map(this::toAdminRow)
            .collect(Collectors.toList());
    }

    /** Todas as encomendas (todos os utilizadores). Para listagem admin. */
    public List<AdminOrderResponse> getOrdersForAdmin(UUID adminUserId) {
        requireAdmin(adminUserId);
        return orderRepository.findAllForAdmin().stream()
            .map(this::toAdminOrderResponse)
            .collect(Collectors.toList());
    }

    private AdminOrderResponse toAdminOrderResponse(OrderEntity o) {
        AdminOrderResponse r = new AdminOrderResponse();
        r.setId(o.getId());
        r.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        r.setClientName(o.getClientName());
        r.setCategory(o.getCategory());
        r.setSubcategory(o.getSubcategory());
        r.setProductName(o.getProductName());
        r.setSize(o.getSize());
        r.setQuantityKg(o.getQuantityKg());
        r.setUnitsPerKg(o.getUnitsPerKg());
        r.setValueCharged(o.getValueCharged());
        r.setValuePaid(o.getValuePaid());
        r.setCostTotal(o.getCostTotal());
        r.setProfit(o.getProfit());
        r.setPaymentStatus(o.getPaymentStatus());
        r.setDelivered(o.isDelivered());
        r.setIngredientIds(o.getIngredientIds());
        r.setObservations(o.getObservations());
        r.setCakeName(o.getCakeName());
        r.setCakeSize(o.getCakeSize());
        if (o.getUser() != null) {
            r.setUserPhone(o.getUser().getPhone());
            r.setUserFullName(o.getUser().getFullName());
        }
        return r;
    }

    /** Receita por mês (todos os utilizadores). Para relatório admin. */
    public List<RevenueByMonthDto> getRevenueByMonth(UUID adminUserId) {
        requireAdmin(adminUserId);
        List<Object[]> rows = orderRepository.findRevenueByMonthAllUsers();
        return rows.stream()
            .map(row -> new RevenueByMonthDto(
                row[0] != null ? row[0].toString() : null,
                row[1] instanceof BigDecimal ? (BigDecimal) row[1] : (row[1] instanceof Number ? BigDecimal.valueOf(((Number) row[1]).doubleValue()) : BigDecimal.ZERO)))
            .collect(Collectors.toList());
    }

    /**
     * Admin confirma pagamento da licença com o ID da transacção e-Mola e duração em meses.
     * Cria licença pendente se o utilizador ainda não tiver.
     */
    public AdminUserRow confirmPaymentForUser(UUID adminUserId, UUID targetUserId, String eMolaTransactionId, int durationMonths) {
        requireAdmin(adminUserId);
        UserEntity target = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (target.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrador não tem licença para confirmar");
        }
        licenseService.findByUserId(targetUserId)
            .orElseGet(() -> licenseService.createPendingLicenseForUser(targetUserId));
        licenseService.confirmPayment(targetUserId, eMolaTransactionId, durationMonths);
        return toAdminRow(target);
    }

    private AdminUserRow toAdminRow(UserEntity u) {
        AdminUserRow r = new AdminUserRow();
        r.setId(u.getId());
        r.setFullName(u.getFullName());
        r.setPhone(u.getPhone());
        r.setDocumentNumber(u.getDocumentNumber());
        r.setDocumentType(u.getDocumentType());
        r.setProvince(u.getProvince());
        r.setEmail(u.getEmail());
        r.setCreatedAt(u.getCreatedAt());
        if (u.isAdmin()) {
            r.setLicenseStatus("paid");
        } else {
            licenseRepository.findByUserId(u.getId()).ifPresent(lic -> {
                r.setLicenseStatus(lic.getStatus());
                r.setLicenseToken(lic.getLicenseToken());
                r.setLicenseActivationToken(lic.getActivationToken());
                r.setLicenseValidUntil(lic.getValidUntil());
            });
            if (r.getLicenseStatus() == null) r.setLicenseStatus("pending");
        }
        return r;
    }
}
