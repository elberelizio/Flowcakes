package com.chefcontrol.repository;

import com.chefcontrol.entity.MpesaPaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MpesaPaymentRepository extends JpaRepository<MpesaPaymentEntity, UUID> {

    Optional<MpesaPaymentEntity> findByThirdPartyId(String thirdPartyId);

    Optional<MpesaPaymentEntity> findByConversationId(String conversationId);

    List<MpesaPaymentEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<MpesaPaymentEntity> findFirstByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, String status);

    List<MpesaPaymentEntity> findByStatusAndThirdPartyIdStartingWithOrderByCreatedAtDesc(String status, String prefix);
}
