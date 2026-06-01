package com.chefcontrol.service;

import com.chefcontrol.config.SessionConfig;
import com.chefcontrol.dto.AccessLogDto;
import com.chefcontrol.dto.AccessLogUsersPageDto;
import com.chefcontrol.dto.AdminOrderResponse;
import com.chefcontrol.dto.AdminRankingRowDto;
import com.chefcontrol.dto.AdminStatsResponse;
import com.chefcontrol.dto.AdminUserDetailDto;
import com.chefcontrol.dto.AdminUpdateUserRequest;
import com.chefcontrol.dto.AdminUserRow;
import com.chefcontrol.dto.BlockedAccountRowDto;
import com.chefcontrol.dto.RevenueByMonthDto;
import com.chefcontrol.dto.SecurityEventDto;
import com.chefcontrol.dto.SimulatedPaymentPendingDto;
import com.chefcontrol.dto.UserActivityHistoryPageDto;
import com.chefcontrol.dto.UserSessionDetailDto;
import com.chefcontrol.entity.MpesaPaymentEntity;
import com.chefcontrol.entity.OrderEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.entity.UserLicenseEntity;
import com.chefcontrol.repository.MpesaPaymentRepository;
import com.chefcontrol.repository.OrderRepository;
import com.chefcontrol.repository.UserLicenseRepository;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final UserLicenseRepository licenseRepository;
    private final LicenseService licenseService;
    private final OrderRepository orderRepository;
    private final AccessLogService accessLogService;
    private final UserActivityService userActivityService;
    private final MpesaPaymentRepository mpesaPaymentRepository;
    private final SecurityEventService securityEventService;
    private final AccountSecurityService accountSecurityService;

    public AdminService(UserRepository userRepository, UserLicenseRepository licenseRepository,
                        LicenseService licenseService, OrderRepository orderRepository,
                        AccessLogService accessLogService, UserActivityService userActivityService,
                        MpesaPaymentRepository mpesaPaymentRepository,
                        SecurityEventService securityEventService,
                        AccountSecurityService accountSecurityService) {
        this.userRepository = userRepository;
        this.licenseRepository = licenseRepository;
        this.licenseService = licenseService;
        this.orderRepository = orderRepository;
        this.accessLogService = accessLogService;
        this.userActivityService = userActivityService;
        this.mpesaPaymentRepository = mpesaPaymentRepository;
        this.securityEventService = securityEventService;
        this.accountSecurityService = accountSecurityService;
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
        long paidCommercial = licenseRepository.findAll().stream()
            .filter(l -> LicenseService.STATUS_PAID.equals(l.getStatus())
                && (l.getValidUntil() == null || l.getValidUntil().isAfter(now)))
            .count();
        long trialActive = licenseRepository.findAll().stream()
            .filter(l -> LicenseService.STATUS_TRIAL.equals(l.getStatus())
                && l.getValidUntil() != null && l.getValidUntil().isAfter(now))
            .count();
        r.setLicensesPaid(paidCommercial);
        r.setLicensesTrial(trialActive);
        r.setLicensesPending(licenseRepository.countByStatusAndRejectedAtIsNull(LicenseService.STATUS_PENDING));
        r.setLoginsToday(accessLogService.countLoginsToday());
        r.setUniqueUsersToday(accessLogService.countUniqueUsersToday());

        r.setUsersOnline(countNonAdminUsersOnline());

        r.setBlockedUsers(userRepository.countByBlockedTrue());
        long simPending = mpesaPaymentRepository
            .findByStatusAndThirdPartyIdStartingWithOrderByCreatedAtDesc("pending", "SIM-").size();
        r.setPendingApprovals(r.getLicensesPending() + simPending);

        Instant monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        BigDecimal licMonth = licenseRepository.sumPaidLicenseRevenueSince(monthStart);
        BigDecimal licTotal = licenseRepository.sumPaidLicenseRevenue();
        r.setLicenseRevenueThisMonth(licMonth != null ? licMonth : BigDecimal.ZERO);
        r.setLicenseRevenueTotal(licTotal != null ? licTotal : BigDecimal.ZERO);

        List<Object[]> topRows = orderRepository.findTopUsersByProfit(1);
        if (!topRows.isEmpty()) {
            Object[] row = topRows.get(0);
            r.setTopProfitUserName(row[1] != null ? row[1].toString() : "—");
            r.setTopProfitAmount(toBigDecimal(row[4]));
        } else {
            r.setTopProfitUserName(null);
            r.setTopProfitAmount(BigDecimal.ZERO);
        }

        Instant since30 = LocalDate.now().minusDays(30).atStartOfDay().toInstant(ZoneOffset.UTC);
        long logins30 = accessLogService.countLoginsSince(since30);
        long activeUsers30 = accessLogService.countDistinctNonAdminUsersSince(since30);
        r.setAvgLoginsPerUser30d(activeUsers30 > 0
            ? BigDecimal.valueOf(logins30).divide(BigDecimal.valueOf(activeUsers30), 1, RoundingMode.HALF_UP).doubleValue()
            : 0);

        r.setTotalOrders(orderRepository.countNonCancelled());

        return r;
    }

    public List<AdminRankingRowDto> getRanking(UUID adminUserId, int limit) {
        requireAdmin(adminUserId);
        int cap = limit > 0 ? Math.min(limit, 20) : 10;
        Instant since30 = LocalDate.now().minusDays(30).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<Object[]> rows = orderRepository.findTopUsersByProfit(cap);
        List<AdminRankingRowDto> result = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            UUID uid = row[0] instanceof UUID ? (UUID) row[0] : UUID.fromString(row[0].toString());
            AdminRankingRowDto dto = new AdminRankingRowDto();
            dto.setRank(rank++);
            dto.setUserId(uid.toString());
            dto.setFullName(row[1] != null ? row[1].toString() : "—");
            dto.setPhone(row[2] != null ? row[2].toString() : "");
            dto.setOrderCount(row[3] instanceof Number ? ((Number) row[3]).longValue() : 0);
            dto.setTotalProfit(toBigDecimal(row[4]));
            dto.setLoginCount(accessLogService.countByUserIdSince(uid, since30));
            licenseRepository.findByUserId(uid).ifPresent(lic -> dto.setLicenseStatus(lic.getStatus()));
            if (dto.getLicenseStatus() == null) dto.setLicenseStatus("pending");
            result.add(dto);
        }
        return result;
    }

    public List<RevenueByMonthDto> getLicenseRevenueByMonth(UUID adminUserId) {
        requireAdmin(adminUserId);
        return licenseRepository.findLicenseRevenueByMonth().stream()
            .map(row -> new RevenueByMonthDto(
                row[0] != null ? row[0].toString() : null,
                toBigDecimal(row[1])))
            .collect(Collectors.toList());
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal) return (BigDecimal) v;
        if (v instanceof Number) return BigDecimal.valueOf(((Number) v).doubleValue());
        try {
            return new BigDecimal(v.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public List<AccessLogDto> getAccessLogs(UUID adminUserId, int limit) {
        requireAdmin(adminUserId);
        return accessLogService.getRecentLogs(limit > 0 ? Math.min(limit, 200) : 100);
    }

    public AccessLogUsersPageDto getAccessLogUsersPage(
            UUID adminUserId, String search, int page, int size) {
        requireAdmin(adminUserId);
        return accessLogService.getUserSummariesPage(search, page, size);
    }

    public List<SecurityEventDto> getSecurityEvents(UUID adminUserId, int limit) {
        requireAdmin(adminUserId);
        return securityEventService.getRecentEvents(limit);
    }

    public List<BlockedAccountRowDto> getBlockedAccounts(UUID adminUserId) {
        requireAdmin(adminUserId);
        return securityEventService.getBlockedAccounts();
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

    public List<SimulatedPaymentPendingDto> listPendingSimulatedPayments(UUID adminUserId) {
        requireAdmin(adminUserId);
        return mpesaPaymentRepository.findByStatusAndThirdPartyIdStartingWithOrderByCreatedAtDesc("pending", "SIM-").stream()
            .map(this::toSimulatedPendingDto)
            .collect(Collectors.toList());
    }

    /**
     * Aprova licença a partir de um pagamento M-Pesa simulado (third_party_id SIM-...), sem callback Vodacom.
     */
    public void approveSimulatedPayment(UUID adminUserId, UUID paymentId) {
        requireAdmin(adminUserId);
        MpesaPaymentEntity p = mpesaPaymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado"));
        if (!"pending".equals(p.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pagamento não está pendente");
        }
        if (p.getThirdPartyId() == null || !p.getThirdPartyId().startsWith("SIM-")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este pagamento não é um pedido simulado");
        }
        String tx = p.getTransactionId();
        if (tx == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Referência de pagamento simulado em falta");
        }
        String txNorm = tx.trim().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (txNorm.length() != 18) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Referência de pagamento simulado inválida");
        }
        UserEntity target = userRepository.findById(p.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (target.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrador não tem licença para confirmar");
        }
        licenseService.findByUserId(p.getUserId())
            .orElseGet(() -> licenseService.createPendingLicenseForUser(p.getUserId()));
        licenseService.confirmPayment(p.getUserId(), txNorm, p.getDurationMonths());
        p.setStatus("completed");
        p.setCompletedAt(Instant.now());
        mpesaPaymentRepository.save(p);
    }

    private SimulatedPaymentPendingDto toSimulatedPendingDto(MpesaPaymentEntity p) {
        SimulatedPaymentPendingDto d = new SimulatedPaymentPendingDto();
        d.setPaymentId(p.getId().toString());
        d.setUserId(p.getUserId().toString());
        userRepository.findById(p.getUserId()).ifPresent(u -> {
            d.setUserFullName(u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getPhone());
            d.setUserPhone(u.getPhone());
        });
        if (d.getUserFullName() == null) d.setUserFullName("—");
        if (d.getUserPhone() == null) d.setUserPhone("");
        d.setAmount(p.getAmount());
        d.setDurationMonths(p.getDurationMonths());
        d.setTransactionRef(p.getTransactionId());
        d.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        d.setSimulationChannel(p.getSimulationChannel());
        return d;
    }

    public AdminUserDetailDto getUserDetail(UUID adminUserId, UUID targetUserId) {
        requireAdmin(adminUserId);
        UserEntity u = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        AdminUserDetailDto d = new AdminUserDetailDto();
        d.setId(u.getId().toString());
        d.setFullName(u.getFullName());
        d.setPhone(u.getPhone());
        d.setDocumentType(u.getDocumentType());
        d.setDocumentNumber(u.getDocumentNumber());
        d.setProvince(u.getProvince());
        d.setEmail(u.getEmail());
        d.setCreatedAt(u.getCreatedAt());
        d.setBlocked(u.isBlocked());
        d.setTotalLogins(accessLogService.countByUserId(targetUserId));
        d.setFirstLoginAt(accessLogService.getFirstLoginByUserId(targetUserId));
        d.setLastLoginAt(accessLogService.getLastLoginByUserId(targetUserId));
        if (u.isAdmin()) {
            d.setLicenseStatus("paid");
        } else {
            licenseRepository.findByUserId(targetUserId).ifPresent(lic -> {
                d.setLicenseStatus(lic.getStatus());
                d.setLicenseToken(lic.getLicenseToken());
                d.setLicenseActivationToken(lic.getActivationToken());
                d.setLicenseValidUntil(lic.getValidUntil());
                d.setLicensePaidAt(lic.getPaidAt());
                d.setLicensePaymentReference(lic.getPaymentReference());
                d.setLicenseCreatedAt(lic.getCreatedAt());
            });
            if (d.getLicenseStatus() == null) d.setLicenseStatus("pending");
        }
        return d;
    }

    public AdminUserDetailDto updateUser(UUID adminUserId, UUID targetUserId, AdminUpdateUserRequest req) {
        requireAdmin(adminUserId);
        UserEntity u = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (u.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível editar perfil de administrador");
        }
        if (req.getFullName() != null) u.setFullName(req.getFullName().trim().isEmpty() ? null : req.getFullName().trim());
        if (req.getPhone() != null && !req.getPhone().trim().isEmpty()) {
            String phone = req.getPhone().trim();
            if (userRepository.findByPhone(phone).filter(ex -> !ex.getId().equals(targetUserId)).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe outro utilizador com este telefone");
            }
            u.setPhone(phone);
        }
        if (req.getDocumentType() != null) u.setDocumentType(req.getDocumentType().trim().isEmpty() ? null : req.getDocumentType().trim());
        if (req.getDocumentNumber() != null) u.setDocumentNumber(req.getDocumentNumber().trim().isEmpty() ? null : req.getDocumentNumber().trim());
        if (req.getProvince() != null) u.setProvince(req.getProvince().trim().isEmpty() ? null : req.getProvince().trim());
        if (req.getEmail() != null) u.setEmail(req.getEmail().trim().isEmpty() ? null : req.getEmail().trim());
        u = userRepository.save(u);
        return getUserDetail(adminUserId, targetUserId);
    }

    public List<AccessLogDto> getUserAccessLogs(UUID adminUserId, UUID targetUserId, int limit) {
        requireAdmin(adminUserId);
        return accessLogService.getLogsByUserId(targetUserId, limit > 0 ? Math.min(limit, 100) : 30);
    }

    public List<UserSessionDetailDto> getUserSessions(UUID adminUserId, UUID targetUserId, int limit) {
        requireAdmin(adminUserId);
        userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        return userActivityService.getSessionsForUser(targetUserId, limit);
    }

    public UserActivityHistoryPageDto getUserActivityHistory(
        UUID adminUserId,
        UUID targetUserId,
        LocalDate from,
        LocalDate to,
        String activityType,
        int page,
        int size
    ) {
        requireAdmin(adminUserId);
        userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        return userActivityService.getActivityHistory(targetUserId, from, to, activityType, page, size);
    }

    public AdminUserRow blockUser(UUID adminUserId, UUID targetUserId) {
        requireAdmin(adminUserId);
        UserEntity u = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (u.isAdmin()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível bloquear administrador");
        u.setBlocked(true);
        u.setBlockReason(SecurityEventService.BLOCK_REASON_MANUAL);
        userRepository.save(u);
        return toAdminRow(u);
    }

    public AdminUserRow unblockUser(UUID adminUserId, UUID targetUserId, String ipAddress, String userAgent) {
        requireAdmin(adminUserId);
        if (!userRepository.existsById(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado");
        }
        accountSecurityService.unblockByAdmin(targetUserId, adminUserId, ipAddress, userAgent);
        UserEntity u = userRepository.findById(targetUserId).orElseThrow();
        return toAdminRow(u);
    }

    /** Rejeita utilizador pendente. Vai para lista de rejeitados; pode ser aprovado depois com ID de pagamento. */
    public AdminUserRow rejectUser(UUID adminUserId, UUID targetUserId) {
        requireAdmin(adminUserId);
        UserEntity u = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (u.isAdmin()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrador não pode ser rejeitado");
        licenseService.rejectPendingLicense(targetUserId);
        return toAdminRow(u);
    }

    public AdminUserRow extendLicenseForUser(UUID adminUserId, UUID targetUserId, int months) {
        requireAdmin(adminUserId);
        UserEntity u = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        if (u.isAdmin()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrador não tem licença para estender");
        licenseService.findByUserId(targetUserId)
            .orElseGet(() -> licenseService.createPendingLicenseForUser(targetUserId));
        licenseService.extendLicense(targetUserId, months);
        return toAdminRow(u);
    }

    private long countNonAdminUsersOnline() {
        return SessionConfig.getActiveUserIds().stream()
            .filter(id -> userRepository.findById(id).map(u -> !u.isAdmin()).orElse(false))
            .distinct()
            .count();
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
        r.setBlocked(u.isBlocked());
        r.setAdmin(u.isAdmin());
        if (u.isAdmin()) {
            r.setLicenseStatus("paid");
        } else {
            licenseRepository.findByUserId(u.getId()).ifPresent(lic -> {
                r.setLicenseStatus(lic.getStatus());
                r.setLicenseToken(lic.getLicenseToken());
                r.setLicenseActivationToken(lic.getActivationToken());
                r.setLicenseValidUntil(lic.getValidUntil());
                r.setLicensePaidAt(lic.getPaidAt());
                r.setLicenseAmount(lic.getAmount());
                r.setLicensePaymentReference(lic.getPaymentReference());
                r.setLicenseRejectedAt(lic.getRejectedAt());
            });
            if (r.getLicenseStatus() == null) r.setLicenseStatus("pending");
        }
        return r;
    }
}
