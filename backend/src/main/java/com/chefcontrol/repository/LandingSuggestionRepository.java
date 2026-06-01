package com.chefcontrol.repository;

import com.chefcontrol.entity.LandingSuggestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface LandingSuggestionRepository extends JpaRepository<LandingSuggestionEntity, UUID> {
    @Query(value = "SELECT * FROM landing_suggestions ORDER BY created_at DESC LIMIT 100", nativeQuery = true)
    List<LandingSuggestionEntity> findTop100ByOrderByCreatedAtDesc();
}
