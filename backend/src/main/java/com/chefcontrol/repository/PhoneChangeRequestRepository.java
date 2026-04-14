package com.chefcontrol.repository;

import com.chefcontrol.entity.PhoneChangeRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PhoneChangeRequestRepository extends JpaRepository<PhoneChangeRequestEntity, UUID> {

    Optional<PhoneChangeRequestEntity> findTopByUserIdAndNewPhoneAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(UUID userId, String newPhone, Instant now);
}

