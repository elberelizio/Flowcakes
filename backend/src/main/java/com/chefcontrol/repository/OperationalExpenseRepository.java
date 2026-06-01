package com.chefcontrol.repository;

import com.chefcontrol.entity.OperationalExpenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface OperationalExpenseRepository extends JpaRepository<OperationalExpenseEntity, UUID> {

    List<OperationalExpenseEntity> findAllByOrderByExpenseDateDescCreatedAtDesc();

    List<OperationalExpenseEntity> findByCategoryOrderByExpenseDateDescCreatedAtDesc(String category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperationalExpenseEntity e")
    BigDecimal sumAll();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperationalExpenseEntity e WHERE e.expenseDate >= :from")
    BigDecimal sumSince(@Param("from") LocalDate from);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperationalExpenseEntity e WHERE e.category = :category")
    BigDecimal sumByCategory(@Param("category") String category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperationalExpenseEntity e WHERE e.category = :category AND e.expenseDate >= :from")
    BigDecimal sumByCategorySince(@Param("category") String category, @Param("from") LocalDate from);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperationalExpenseEntity e WHERE e.category IN :categories AND e.expenseDate >= :from")
    BigDecimal sumByCategoriesSince(@Param("categories") List<String> categories, @Param("from") LocalDate from);

    @Query(value = """
        SELECT category, COALESCE(SUM(amount), 0) AS total
        FROM operational_expenses
        WHERE expense_date >= :from
        GROUP BY category
        ORDER BY total DESC
        """, nativeQuery = true)
    List<Object[]> sumByCategorySinceGrouped(@Param("from") LocalDate from);

    @Query(value = """
        SELECT to_char(date_trunc('month', expense_date), 'YYYY-MM') AS month,
               COALESCE(SUM(amount), 0) AS total
        FROM operational_expenses
        GROUP BY date_trunc('month', expense_date)
        ORDER BY month DESC
        LIMIT 24
        """, nativeQuery = true)
    List<Object[]> sumByMonth();
}
