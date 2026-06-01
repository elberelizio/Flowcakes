package com.chefcontrol.repository;

import com.chefcontrol.entity.TreasuryAllocationSuggestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TreasuryAllocationSuggestionRepository extends JpaRepository<TreasuryAllocationSuggestionEntity, UUID> {

    List<TreasuryAllocationSuggestionEntity> findByStatusOrderByCreatedAtDesc(String status);

    Optional<TreasuryAllocationSuggestionEntity> findBySuggestionTypeAndStatus(String suggestionType, String status);

    long countByStatus(String status);
}
