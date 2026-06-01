package com.chefcontrol.repository;

import com.chefcontrol.entity.SystemNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SystemNotificationRepository extends JpaRepository<SystemNotificationEntity, UUID> {

    List<SystemNotificationEntity> findAllByOrderByCreatedAtDesc();

    @Query("""
        SELECT n FROM SystemNotificationEntity n
        WHERE n.active = true
          AND n.audience = 'users'
          AND (n.expiresAt IS NULL OR n.expiresAt > :now)
          AND (n.maintenanceEndAt IS NULL OR n.maintenanceEndAt >= :now)
        ORDER BY n.createdAt DESC
        """)
    List<SystemNotificationEntity> findVisibleForUsers(@Param("now") Instant now);

    List<SystemNotificationEntity> findByAudienceOrderByCreatedAtDesc(String audience);
}
