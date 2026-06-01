package com.chefcontrol.repository;

import com.chefcontrol.entity.UserNotificationDismissalEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserNotificationDismissalRepository extends JpaRepository<UserNotificationDismissalEntity, UserNotificationDismissalEntity.Pk> {

    List<UserNotificationDismissalEntity> findByUserId(UUID userId);

    boolean existsByUserIdAndNotificationId(UUID userId, UUID notificationId);
}
