package com.chefcontrol.repository;

import com.chefcontrol.entity.UserLicenseEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserLicenseRepository extends JpaRepository<UserLicenseEntity, UUID> {

    Optional<UserLicenseEntity> findByUserId(UUID userId);

    Optional<UserLicenseEntity> findByLicenseToken(String licenseToken);

    Optional<UserLicenseEntity> findByActivationToken(String activationToken);

    /** Pendentes a aguardar aprovação (não rejeitados). */
    long countByStatusAndRejectedAtIsNull(String status);

    @Query("SELECT l FROM UserLicenseEntity l WHERE l.userId IN (SELECT u.id FROM UserEntity u WHERE u.admin = false) AND l.status IN ('paid','trial') AND l.validUntil IS NOT NULL AND l.validUntil > :now AND l.validUntil <= :until")
    List<UserLicenseEntity> findNonAdminPaidExpiringBetween(@Param("now") Instant now, @Param("until") Instant until);
}
