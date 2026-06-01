package com.chefcontrol.repository;

import com.chefcontrol.entity.TreasuryInvestmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TreasuryInvestmentRepository extends JpaRepository<TreasuryInvestmentEntity, UUID> {

    List<TreasuryInvestmentEntity> findAllByOrderByInvestedAtDescCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM TreasuryInvestmentEntity i")
    BigDecimal sumAll();
}
