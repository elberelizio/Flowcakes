package com.chefcontrol.repository;

import com.chefcontrol.entity.ContactMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ContactMessageRepository extends JpaRepository<ContactMessageEntity, UUID> {

    List<ContactMessageEntity> findTop100ByOrderByCreatedAtDesc();
}
