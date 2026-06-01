package com.chefcontrol.repository;

import com.chefcontrol.entity.UserActivityLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface UserActivityLogRepository extends JpaRepository<UserActivityLogEntity, UUID> {

    List<UserActivityLogEntity> findByAccessLogIdOrderByCreatedAtAsc(UUID accessLogId);

    List<UserActivityLogEntity> findByAccessLogIdInOrderByCreatedAtAsc(List<UUID> accessLogIds);

    List<UserActivityLogEntity> findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
        UUID userId, Instant from, Instant to);
}
