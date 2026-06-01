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
    @Query(value = "SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COALESCE(SUM(profit), 0) AS revenue FROM orders WHERE COALESCE(is_cancelled, false) = false GROUP BY date_trunc('month', created_at) ORDER BY month DESC LIMIT 24", nativeQuery = true)
    List<Object[]> findRevenueByMonthAllUsers();

    /** Receita por mês para um utilizador. */
    @Query(value = "SELECT to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS month, COALESCE(SUM(o.profit), 0) AS revenue FROM orders o WHERE o.user_id = :userId AND COALESCE(o.is_cancelled, false) = false GROUP BY date_trunc('month', o.created_at) ORDER BY month DESC LIMIT 24", nativeQuery = true)
    List<Object[]> findRevenueByMonthByUser(UUID userId);

    @Query(value = """
        SELECT u.id, COALESCE(u.full_name, u.phone), u.phone,
               COUNT(o.id) AS order_count,
               COALESCE(SUM(o.profit), 0) AS total_profit
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id AND COALESCE(o.is_cancelled, false) = false
        WHERE u.is_admin = false
        GROUP BY u.id, u.full_name, u.phone
        ORDER BY total_profit DESC, order_count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopUsersByProfit(@org.springframework.data.repository.query.Param("limit") int limit);
}
