package com.chefcontrol.repository;

import com.chefcontrol.entity.AccessLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AccessLogRepository extends JpaRepository<AccessLogEntity, UUID> {

    List<AccessLogEntity> findTop100ByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(a) FROM AccessLogEntity a WHERE a.createdAt >= :since")
    long countSince(Instant since);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM AccessLogEntity a WHERE a.createdAt >= :since")
    long countDistinctUsersSince(Instant since);

    List<AccessLogEntity> findTop30ByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT COUNT(a) FROM AccessLogEntity a WHERE a.userId = :userId")
    long countByUserId(UUID userId);

    @Query("SELECT MIN(a.createdAt) FROM AccessLogEntity a WHERE a.userId = :userId")
    Instant findFirstLoginByUserId(UUID userId);

    @Query("SELECT MAX(a.createdAt) FROM AccessLogEntity a WHERE a.userId = :userId")
    Instant findLastLoginByUserId(UUID userId);
}
