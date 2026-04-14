package com.chefcontrol.repository;

import com.chefcontrol.entity.OrderEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    @Query("SELECT o FROM OrderEntity o LEFT JOIN FETCH o.user ORDER BY o.createdAt DESC")
    List<OrderEntity> findAllForAdmin();

    List<OrderEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT COALESCE(MAX(o.orderNo), 0) FROM OrderEntity o WHERE o.user.id = :userId")
    Optional<Integer> findMaxOrderNoByUserId(UUID userId);

    List<OrderEntity> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(UUID userId, Instant from, Instant to);

    /** Receita total por mês (todos os utilizadores). Para relatório admin. */
    @Query(value = "SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COALESCE(SUM(profit), 0) AS revenue FROM orders GROUP BY date_trunc('month', created_at) ORDER BY month DESC LIMIT 24", nativeQuery = true)
    List<Object[]> findRevenueByMonthAllUsers();

    /** Receita por mês para um utilizador. */
    @Query(value = "SELECT to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS month, COALESCE(SUM(o.profit), 0) AS revenue FROM orders o WHERE o.user_id = :userId GROUP BY date_trunc('month', o.created_at) ORDER BY month DESC LIMIT 24", nativeQuery = true)
    List<Object[]> findRevenueByMonthByUser(UUID userId);
}
