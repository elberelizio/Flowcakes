package com.chefcontrol.repository;

import com.chefcontrol.entity.UserLicenseEntity;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserLicenseRepository extends JpaRepository<UserLicenseEntity, UUID> {

    Optional<UserLicenseEntity> findByUserId(UUID userId);

    Optional<UserLicenseEntity> findByLicenseToken(String licenseToken);

    Optional<UserLicenseEntity> findByActivationToken(String activationToken);
}
