package com.chefcontrol.repository;

import com.chefcontrol.entity.UserFeedbackEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserFeedbackRepository extends JpaRepository<UserFeedbackEntity, UUID> {

    List<UserFeedbackEntity> findTop50ByOrderByCreatedAtDesc();
}
