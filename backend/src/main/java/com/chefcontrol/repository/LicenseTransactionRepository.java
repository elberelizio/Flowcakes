package com.chefcontrol.repository;

import com.chefcontrol.entity.LicenseTransactionEntity;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LicenseTransactionRepository extends JpaRepository<LicenseTransactionEntity, UUID> {

    List<LicenseTransactionEntity> findByUserLicenseIdOrderByCreatedAtDesc(UUID userLicenseId);

    @Query("SELECT COUNT(e) > 0 FROM LicenseTransactionEntity e WHERE e.eMolaTransactionId = :id")
    boolean existsByEMolaTransactionId(@Param("id") String eMolaTransactionId);
}
