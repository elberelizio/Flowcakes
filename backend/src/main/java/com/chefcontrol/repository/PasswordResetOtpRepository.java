package com.chefcontrol.repository;

import com.chefcontrol.entity.PasswordResetOtpEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtpEntity, UUID> {

    Optional<PasswordResetOtpEntity> findTopByPhoneAndOtpCodeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phone, String otpCode, Instant now);

    Optional<PasswordResetOtpEntity> findTopByPhoneAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phone, Instant now);

    Optional<PasswordResetOtpEntity> findByResetTokenAndPhoneAndUsedFalseAndResetTokenExpiresAtAfter(
            UUID resetToken, String phone, Instant now);

    List<PasswordResetOtpEntity> findByUserIdAndUsedFalse(UUID userId);

    @Modifying
    @Query("UPDATE PasswordResetOtpEntity o SET o.used = true WHERE o.userId = :userId AND o.used = false")
    void invalidateActiveForUser(@Param("userId") UUID userId);
}
