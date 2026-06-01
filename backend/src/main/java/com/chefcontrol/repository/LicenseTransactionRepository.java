package com.chefcontrol.repository;

import com.chefcontrol.entity.LicenseTransactionEntity;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LicenseTransactionRepository extends JpaRepository<LicenseTransactionEntity, UUID> {

    List<LicenseTransactionEntity> findByUserLicenseIdOrderByCreatedAtDesc(UUID userLicenseId);

    boolean existsByUserLicenseId(UUID userLicenseId);

    @Query("SELECT COUNT(e) > 0 FROM LicenseTransactionEntity e WHERE e.eMolaTransactionId = :id")
    boolean existsByEMolaTransactionId(@Param("id") String eMolaTransactionId);

    /** Faturamento: pagamentos de licença confirmados (transacções e-Mola). */
    @Query(value = """
        SELECT t.id, t.created_at, t.amount, t.duration_months, t.e_mola_transaction_id,
               u.id, u.full_name, u.phone
        FROM license_transactions t
        INNER JOIN user_licenses l ON l.id = t.user_license_id
        INNER JOIN users u ON u.id = l.user_id
        WHERE u.is_admin = false
        ORDER BY t.created_at DESC
        LIMIT 200
        """, nativeQuery = true)
    List<Object[]> findBillingEntries();

    @Query(value = """
        SELECT t.id, t.created_at, t.amount, t.duration_months, t.e_mola_transaction_id,
               u.id, u.full_name, u.phone
        FROM license_transactions t
        INNER JOIN user_licenses l ON l.id = t.user_license_id
        INNER JOIN users u ON u.id = l.user_id
        WHERE u.is_admin = false
          AND (:year IS NULL OR EXTRACT(YEAR FROM t.created_at AT TIME ZONE 'UTC') = :year)
          AND (:month IS NULL OR EXTRACT(MONTH FROM t.created_at AT TIME ZONE 'UTC') = :month)
        ORDER BY t.created_at DESC
        LIMIT 500
        """, nativeQuery = true)
    List<Object[]> findBillingEntriesFiltered(@Param("year") Integer year, @Param("month") Integer month);

    @Query(value = """
        SELECT to_char(date_trunc('month', t.created_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS period,
               COUNT(*)::int,
               COALESCE(SUM(t.amount), 0)
        FROM license_transactions t
        INNER JOIN user_licenses l ON l.id = t.user_license_id
        INNER JOIN users u ON u.id = l.user_id
        WHERE u.is_admin = false
          AND (:year IS NULL OR EXTRACT(YEAR FROM t.created_at AT TIME ZONE 'UTC') = :year)
        GROUP BY date_trunc('month', t.created_at AT TIME ZONE 'UTC')
        ORDER BY period DESC
        """, nativeQuery = true)
    List<Object[]> findBillingTotalsByMonth(@Param("year") Integer year);
}
