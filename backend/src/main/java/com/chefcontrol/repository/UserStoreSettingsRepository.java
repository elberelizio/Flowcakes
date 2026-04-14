package com.chefcontrol.repository;

import com.chefcontrol.entity.UserStoreSettingsEntity;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStoreSettingsRepository extends JpaRepository<UserStoreSettingsEntity, UUID> {

    Optional<UserStoreSettingsEntity> findByUserId(UUID userId);

    Optional<UserStoreSettingsEntity> findByStoreSlug(String storeSlug);

    boolean existsByStoreSlugAndUserIdNot(String storeSlug, UUID userId);
}
