package com.chefcontrol.repository;

import com.chefcontrol.entity.ReminderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<ReminderEntity, UUID> {

    List<ReminderEntity> findAllByUserIdOrderByDeliveryDateAsc(UUID userId);

    List<ReminderEntity> findByUserIdAndDeliveryDateBetweenOrderByDeliveryDateAsc(
            UUID userId, LocalDate start, LocalDate end);

    List<ReminderEntity> findByUserIdAndDeliveryDate(UUID userId, LocalDate deliveryDate);
}
