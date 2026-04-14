package com.chefcontrol.repository;

import com.chefcontrol.entity.SystemNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SystemNotificationRepository extends JpaRepository<SystemNotificationEntity, UUID> {

    List<SystemNotificationEntity> findAllByOrderByCreatedAtDesc();

    List<SystemNotificationEntity> findByActiveTrueAndExpiresAtIsNullOrExpiresAtAfterOrderByCreatedAtDesc(Instant now);
}
