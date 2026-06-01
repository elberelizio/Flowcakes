package com.chefcontrol.repository;

import com.chefcontrol.entity.SecurityEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SecurityEventRepository extends JpaRepository<SecurityEventEntity, UUID> {

    List<SecurityEventEntity> findTop200ByOrderByCreatedAtDesc();
}
