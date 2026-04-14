package com.chefcontrol.repository;

import com.chefcontrol.entity.WithdrawalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface WithdrawalRepository extends JpaRepository<WithdrawalEntity, UUID> {

    List<WithdrawalEntity> findAllByUserIdOrderByWithdrawalDateDesc(UUID userId);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalEntity w WHERE w.userId = :userId")
    java.math.BigDecimal sumAmountByUserId(UUID userId);
}
