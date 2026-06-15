package com.chefcontrol.service;

import com.chefcontrol.entity.MpesaPaymentEntity;
import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.repository.MpesaPaymentRepository;
import com.chefcontrol.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Relembra administradores a cada minuto sobre pagamentos manuais pendentes de validação.
 */
@Service
public class PendingPaymentReminderService {

    private static final Logger log = LoggerFactory.getLogger(PendingPaymentReminderService.class);

    private final MpesaPaymentRepository mpesaPaymentRepository;
    private final UserRepository userRepository;
    private final SystemNotificationService systemNotificationService;

    public PendingPaymentReminderService(
            MpesaPaymentRepository mpesaPaymentRepository,
            UserRepository userRepository,
            SystemNotificationService systemNotificationService) {
        this.mpesaPaymentRepository = mpesaPaymentRepository;
        this.userRepository = userRepository;
        this.systemNotificationService = systemNotificationService;
    }

    @Scheduled(fixedRate = 60_000, initialDelay = 15_000)
    public void remindAdminsOfPendingPayments() {
        List<MpesaPaymentEntity> pending = mpesaPaymentRepository
            .findByStatusAndThirdPartyIdStartingWithOrderByCreatedAtDesc("pending", "SIM-");
        if (pending.isEmpty()) {
            return;
        }
        for (MpesaPaymentEntity payment : pending) {
            try {
                systemNotificationService.upsertPaymentPendingAdminReminder(
                    payment,
                    resolveUserLabel(payment.getUserId()));
            } catch (Exception e) {
                log.warn("Falha ao relembrar pagamento pendente {}: {}", payment.getId(), e.getMessage());
            }
        }
    }

    private String resolveUserLabel(java.util.UUID userId) {
        return userRepository.findById(userId)
            .map(u -> {
                if (u.getFullName() != null && !u.getFullName().isBlank()) {
                    return u.getFullName().trim();
                }
                return u.getPhone() != null ? u.getPhone() : "—";
            })
            .orElse("—");
    }

    static long minutesWaiting(MpesaPaymentEntity payment) {
        Instant created = payment.getCreatedAt() != null ? payment.getCreatedAt() : Instant.now();
        return Math.max(0, Duration.between(created, Instant.now()).toMinutes());
    }
}
