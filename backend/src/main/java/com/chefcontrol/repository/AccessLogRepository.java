package com.chefcontrol.repository;

import com.chefcontrol.entity.AccessLogEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccessLogRepository extends JpaRepository<AccessLogEntity, UUID> {

    List<AccessLogEntity> findTop100ByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(a) FROM AccessLogEntity a WHERE a.createdAt >= :since")
    long countSince(@Param("since") Instant since);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM AccessLogEntity a WHERE a.createdAt >= :since")
    long countDistinctUsersSince(@Param("since") Instant since);

    List<AccessLogEntity> findTop30ByUserIdOrderByCreatedAtDesc(UUID userId);

    List<AccessLogEntity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM AccessLogEntity a WHERE a.userId = :userId")
    long countByUserId(UUID userId);

    @Query("SELECT MIN(a.createdAt) FROM AccessLogEntity a WHERE a.userId = :userId")
    Instant findFirstLoginByUserId(UUID userId);

    @Query("SELECT MAX(a.createdAt) FROM AccessLogEntity a WHERE a.userId = :userId")
    Instant findLastLoginByUserId(UUID userId);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM AccessLogEntity a WHERE a.createdAt >= :since AND a.admin = false")
    long countDistinctNonAdminUsersSince(@Param("since") Instant since);

    @Query("SELECT COUNT(a) FROM AccessLogEntity a WHERE a.userId = :userId AND a.createdAt >= :since")
    long countByUserIdSince(@Param("userId") UUID userId, @Param("since") Instant since);

    Optional<AccessLogEntity> findFirstByUserIdAndEndedAtIsNullOrderByCreatedAtDesc(UUID userId);

    List<AccessLogEntity> findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
        UUID userId, Instant from, Instant to);
}
