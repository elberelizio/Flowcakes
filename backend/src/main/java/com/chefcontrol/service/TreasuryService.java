package com.Flow Cakes.service;

import com.Flow Cakes.dto.*;
import com.Flow Cakes.entity.OperationalExpenseEntity;
import com.Flow Cakes.entity.PlatformAdminSettingEntity;
import com.Flow Cakes.entity.TreasuryAllocationSuggestionEntity;
import com.Flow Cakes.entity.TreasuryInvestmentEntity;
import com.Flow Cakes.repository.LandingSuggestionRepository;
import com.Flow Cakes.repository.TreasuryAllocationSuggestionRepository;
import com.Flow Cakes.repository.TreasuryInvestmentRepository;
import com.Flow Cakes.repository.LicenseTransactionRepository;
import com.Flow Cakes.repository.OperationalExpenseRepository;
import com.Flow Cakes.repository.PlatformAdminSettingRepository;
import com.Flow Cakes.repository.UserLicenseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TreasuryService {

    public static final String KEY_FEEDBACK_THRESHOLD = "feedback_alert_threshold";
    public static final String KEY_MAINTENANCE_INTERVAL = "maintenance_interval_days";
    public static final String KEY_LAST_MAINTENANCE = "last_maintenance_at";
    public static final String KEY_MAINTENANCE_CASH_BALANCE = "maintenance_cash_balance";
    public static final String KEY_MAINTENANCE_CASH_TARGET = "maintenance_cash_target";
    public static final String KEY_ACCOUNT_BALANCE = "treasury_account_balance";
    public static final String KEY_ALLOC_MAINTENANCE = "treasury_alloc_maintenance_pct";
    public static final String KEY_ALLOC_FIXED = "treasury_alloc_fixed_pct";
    public static final String KEY_ALLOC_RESERVE = "treasury_alloc_reserve_pct";
    public static final String KEY_ALLOC_PAYROLL = "treasury_alloc_payroll_pct";
    public static final String KEY_ALLOC_TOOLS = "treasury_alloc_tools_pct";
    public static final String KEY_PAYROLL_HEADCOUNT = "treasury_payroll_headcount";
    public static final String CATEGORY_SALARY = "salarios";
    public static final String ROI_LOSS = "loss";
    public static final String ROI_BREAK_EVEN = "break_even";
    public static final String ROI_PROFIT = "profit";

    private final AdminService adminService;
    private final OperationalExpenseRepository expenseRepository;
    private final UserLicenseRepository licenseRepository;
    private final LicenseTransactionRepository licenseTransactionRepository;
    private final PlatformAdminSettingRepository settingsRepository;
    private final LandingSuggestionRepository landingSuggestionRepository;
    private final TreasuryInvestmentRepository investmentRepository;
    private final TreasuryAllocationSuggestionRepository suggestionRepository;

    public TreasuryService(
            AdminService adminService,
            OperationalExpenseRepository expenseRepository,
            UserLicenseRepository licenseRepository,
            LicenseTransactionRepository licenseTransactionRepository,
            PlatformAdminSettingRepository settingsRepository,
            LandingSuggestionRepository landingSuggestionRepository,
            TreasuryInvestmentRepository investmentRepository,
            TreasuryAllocationSuggestionRepository suggestionRepository) {
        this.adminService = adminService;
        this.expenseRepository = expenseRepository;
        this.licenseRepository = licenseRepository;
        this.licenseTransactionRepository = licenseTransactionRepository;
        this.settingsRepository = settingsRepository;
        this.landingSuggestionRepository = landingSuggestionRepository;
        this.investmentRepository = investmentRepository;
        this.suggestionRepository = suggestionRepository;
    }

    public TreasurySummaryDto getSummary(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        TreasurySummaryDto dto = new TreasurySummaryDto();

        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        BigDecimal licTotal = nullToZero(licenseRepository.sumPaidLicenseRevenue());
        BigDecimal licMonth = nullToZero(licenseRepository.sumPaidLicenseRevenueSince(monthStart.atStartOfDay().toInstant(ZoneOffset.UTC)));
        BigDecimal expTotal = nullToZero(expenseRepository.sumAll());
        BigDecimal expMonth = nullToZero(expenseRepository.sumSince(monthStart));

        dto.setLicenseRevenueTotal(licTotal);
        dto.setLicenseRevenueThisMonth(licMonth);
        dto.setExpensesTotal(expTotal);
        dto.setExpensesThisMonth(expMonth);
        dto.setNetProfitTotal(licTotal.subtract(expTotal));
        dto.setNetProfitThisMonth(licMonth.subtract(expMonth));

        Map<String, BigDecimal> licByMonth = licenseRepository.findLicenseRevenueByMonth().stream()
            .collect(Collectors.toMap(
                r -> r[0].toString(),
                r -> toBigDecimal(r[1]),
                (a, b) -> a,
                LinkedHashMap::new));

        Map<String, BigDecimal> expByMonth = expenseRepository.sumByMonth().stream()
            .collect(Collectors.toMap(
                r -> r[0].toString(),
                r -> toBigDecimal(r[1]),
                (a, b) -> a,
                LinkedHashMap::new));

        Set<String> months = new TreeSet<>();
        months.addAll(licByMonth.keySet());
        months.addAll(expByMonth.keySet());

        List<TreasuryMonthRowDto> rows = new ArrayList<>();
        String bestMonth = null;
        BigDecimal bestNet = null;

        for (String month : months) {
            BigDecimal lic = licByMonth.getOrDefault(month, BigDecimal.ZERO);
            BigDecimal exp = expByMonth.getOrDefault(month, BigDecimal.ZERO);
            BigDecimal net = lic.subtract(exp);
            TreasuryMonthRowDto row = new TreasuryMonthRowDto();
            row.setMonth(month);
            row.setLicenseRevenue(lic);
            row.setExpenses(exp);
            row.setNetProfit(net);
            rows.add(row);
            if (bestNet == null || net.compareTo(bestNet) > 0) {
                bestNet = net;
                bestMonth = month;
            }
        }
        rows.sort((a, b) -> b.getMonth().compareTo(a.getMonth()));
        dto.setMonthlyRows(rows);
        dto.setBestMonth(bestMonth);
        dto.setBestMonthNetProfit(bestNet != null ? bestNet : BigDecimal.ZERO);

        BigDecimal cashBalance = getDecimalSetting(KEY_MAINTENANCE_CASH_BALANCE, BigDecimal.ZERO);
        BigDecimal cashTarget = getDecimalSetting(KEY_MAINTENANCE_CASH_TARGET, BigDecimal.valueOf(5000));
        BigDecimal salaryMonth = nullToZero(expenseRepository.sumByCategorySince(CATEGORY_SALARY, monthStart));
        BigDecimal salaryTotal = nullToZero(expenseRepository.sumByCategory(CATEGORY_SALARY));

        dto.setMaintenanceCashBalance(cashBalance);
        dto.setMaintenanceCashTarget(cashTarget);
        dto.setSalaryExpensesThisMonth(salaryMonth);
        dto.setSalaryExpensesTotal(salaryTotal);
        dto.setExpensesByCategoryThisMonth(buildCategoryBreakdown(monthStart));
        enrichPlatformTreasury(dto, monthStart, licMonth);

        return dto;
    }

    public List<TreasuryBillingEntryDto> listBilling(UUID adminUserId, Integer year, Integer month) {
        adminService.requireAdmin(adminUserId);
        List<Object[]> rows = (year != null || month != null)
            ? licenseTransactionRepository.findBillingEntriesFiltered(year, month)
            : licenseTransactionRepository.findBillingEntries();
        return rows.stream().map(this::toBillingDto).collect(Collectors.toList());
    }

    public List<TreasuryBillingPeriodDto> listBillingPeriods(UUID adminUserId, Integer year) {
        adminService.requireAdmin(adminUserId);
        return licenseTransactionRepository.findBillingTotalsByMonth(year).stream()
            .map(row -> {
                TreasuryBillingPeriodDto d = new TreasuryBillingPeriodDto();
                d.setPeriod(row[0].toString());
                d.setInvoiceCount(row[1] != null ? ((Number) row[1]).intValue() : 0);
                d.setTotalAmount(toBigDecimal(row[2]));
                return d;
            })
            .collect(Collectors.toList());
    }

    public void updateCashReserve(UUID adminUserId, TreasuryCashReserveRequest req) {
        adminService.requireAdmin(adminUserId);
        setSetting(KEY_MAINTENANCE_CASH_BALANCE, req.getBalance().toPlainString());
        setSetting(KEY_MAINTENANCE_CASH_TARGET, req.getTarget().toPlainString());
    }

    public void updateSettings(UUID adminUserId, TreasurySettingsRequest req) {
        adminService.requireAdmin(adminUserId);
        int total = req.getMaintenancePercent() + req.getFixedExpensesPercent() + req.getReservePercent()
            + req.getPayrollPercent() + req.getToolsPercent();
        if (total > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A soma das percentagens não pode exceder 100%");
        }
        setSetting(KEY_ACCOUNT_BALANCE, req.getAccountBalance().toPlainString());
        setSetting(KEY_ALLOC_MAINTENANCE, String.valueOf(req.getMaintenancePercent()));
        setSetting(KEY_ALLOC_FIXED, String.valueOf(req.getFixedExpensesPercent()));
        setSetting(KEY_ALLOC_RESERVE, String.valueOf(req.getReservePercent()));
        setSetting(KEY_ALLOC_PAYROLL, String.valueOf(req.getPayrollPercent()));
        setSetting(KEY_ALLOC_TOOLS, String.valueOf(req.getToolsPercent()));
        setSetting(KEY_PAYROLL_HEADCOUNT, String.valueOf(req.getPayrollHeadcount()));
        BigDecimal maintenanceAlloc = req.getAccountBalance()
            .multiply(BigDecimal.valueOf(req.getMaintenancePercent()))
            .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        setSetting(KEY_MAINTENANCE_CASH_BALANCE, maintenanceAlloc.toPlainString());
        setSetting(KEY_MAINTENANCE_CASH_TARGET, maintenanceAlloc.toPlainString());
    }

    public List<TreasuryInvestmentDto> listInvestments(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        return investmentRepository.findAllByOrderByInvestedAtDescCreatedAtDesc().stream()
            .map(this::toInvestmentDto)
            .collect(Collectors.toList());
    }

    public TreasuryInvestmentDto createInvestment(UUID adminUserId, TreasuryInvestmentRequest req) {
        adminService.requireAdmin(adminUserId);
        TreasuryInvestmentEntity e = new TreasuryInvestmentEntity();
        e.setAmount(req.getAmount());
        e.setInvestedAt(parseDate(req.getInvestedAt()));
        e.setNotes(req.getNotes());
        e.setCreatedBy(adminUserId);
        TreasuryInvestmentDto dto = toInvestmentDto(investmentRepository.save(e));
        refreshAllocationSuggestions(adminUserId);
        return dto;
    }

    public void deleteInvestment(UUID adminUserId, UUID investmentId) {
        adminService.requireAdmin(adminUserId);
        if (!investmentRepository.existsById(investmentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Investimento não encontrado");
        }
        investmentRepository.deleteById(investmentId);
        refreshAllocationSuggestions(adminUserId);
    }

    public List<TreasurySuggestionDto> listSuggestions(UUID adminUserId, boolean refresh) {
        adminService.requireAdmin(adminUserId);
        if (refresh) {
            refreshAllocationSuggestions(adminUserId);
        }
        return suggestionRepository.findByStatusOrderByCreatedAtDesc("pending").stream()
            .map(this::toSuggestionDto)
            .collect(Collectors.toList());
    }

    public void approveSuggestion(UUID adminUserId, UUID suggestionId, Map<String, Integer> editedAllocations) {
        adminService.requireAdmin(adminUserId);
        TreasuryAllocationSuggestionEntity s = suggestionRepository.findById(suggestionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sugestão não encontrada"));
        if (!"pending".equals(s.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sugestão já resolvida");
        }
        Map<String, Integer> alloc = editedAllocations != null && !editedAllocations.isEmpty()
            ? editedAllocations : s.getProposedAllocations();
        applyAllocations(alloc);
        s.setStatus("approved");
        s.setResolvedAt(Instant.now());
        s.setResolvedBy(adminUserId);
        suggestionRepository.save(s);
    }

    public void rejectSuggestion(UUID adminUserId, UUID suggestionId) {
        adminService.requireAdmin(adminUserId);
        TreasuryAllocationSuggestionEntity s = suggestionRepository.findById(suggestionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sugestão não encontrada"));
        s.setStatus("rejected");
        s.setResolvedAt(Instant.now());
        s.setResolvedBy(adminUserId);
        suggestionRepository.save(s);
    }

    public List<OperationalExpenseDto> listExpenses(UUID adminUserId, String category) {
        adminService.requireAdmin(adminUserId);
        List<OperationalExpenseEntity> rows = category != null && !category.isBlank()
            ? expenseRepository.findByCategoryOrderByExpenseDateDescCreatedAtDesc(category.trim())
            : expenseRepository.findAllByOrderByExpenseDateDescCreatedAtDesc();
        return rows.stream().map(this::toExpenseDto).collect(Collectors.toList());
    }

    public OperationalExpenseDto createExpense(UUID adminUserId, OperationalExpenseRequest req) {
        adminService.requireAdmin(adminUserId);
        OperationalExpenseEntity e = new OperationalExpenseEntity();
        e.setTitle(req.getTitle().trim());
        e.setCategory(req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory().trim() : "geral");
        e.setAmount(req.getAmount());
        e.setExpenseDate(parseDate(req.getExpenseDate()));
        e.setNotes(req.getNotes());
        e.setCreatedBy(adminUserId);
        return toExpenseDto(expenseRepository.save(e));
    }

    public void deleteExpense(UUID adminUserId, UUID expenseId) {
        adminService.requireAdmin(adminUserId);
        if (!expenseRepository.existsById(expenseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Despesa não encontrada");
        }
        expenseRepository.deleteById(expenseId);
    }

    public void recordMaintenance(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        setSetting(KEY_LAST_MAINTENANCE, Instant.now().toString());
    }

    public AdminAlertsDto getAlerts(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        AdminStatsResponse stats = adminService.getStats(adminUserId);
        TreasurySummaryDto treasury = getSummary(adminUserId);

        int feedbackThreshold = getIntSetting(KEY_FEEDBACK_THRESHOLD, 5);
        long feedbackCount = landingSuggestionRepository.count();
        int maintenanceDays = getIntSetting(KEY_MAINTENANCE_INTERVAL, 90);
        boolean maintenanceDue = isMaintenanceDue(maintenanceDays);

        AdminAlertsDto alerts = new AdminAlertsDto();
        alerts.setFeedbackThreshold(feedbackThreshold);
        alerts.setFeedbackCount(feedbackCount);
        alerts.setFeedbackThresholdReached(feedbackCount >= feedbackThreshold);
        alerts.setMaintenanceDue(maintenanceDue);
        alerts.setMaintenanceMessage(maintenanceDue
            ? "Manutenção da plataforma recomendada — verifique backups, actualizações e desempenho."
            : "Plataforma em dia. Próxima manutenção dentro do prazo configurado.");
        alerts.setPendingApprovals(stats.getPendingApprovals());
        alerts.setBlockedUsers(stats.getBlockedUsers());
        alerts.setUsersOnline(stats.getUsersOnline());

        List<AdminAlertItemDto> items = new ArrayList<>();
        if (maintenanceDue) {
            items.add(alert("maintenance", "warning", "Manutenção necessária", alerts.getMaintenanceMessage(), "/admin-configuracoes"));
        }
        if (feedbackCount >= feedbackThreshold) {
            items.add(alert("feedback", "info", "Sugestões dos clientes",
                feedbackCount + " pedidos de funcionalidades recebidos (limiar: " + feedbackThreshold + ").",
                "/admin-configuracoes/sugestoes"));
        }
        if (stats.getPendingApprovals() > 0) {
            items.add(alert("pending", "warning", "Aprovações pendentes",
                stats.getPendingApprovals() + " pedido(s) aguardam a sua acção.", "/admin-novos-utilizadores"));
        }
        if (treasury.getNetProfitThisMonth() != null && treasury.getNetProfitThisMonth().compareTo(BigDecimal.ZERO) < 0) {
            items.add(alert("treasury", "error", "Lucro negativo este mês",
                "Despesas operacionais superiores à receita de licenças no mês corrente.", "/tesouraria"));
        }
        if (stats.getBlockedUsers() > 0) {
            items.add(alert("blocked", "warning", "Contas bloqueadas",
                stats.getBlockedUsers() + " conta(s) bloqueada(s).", "/admin-configuracoes/acessos"));
        }
        alerts.setItems(items);
        alerts.setHealthScore(computeHealthScore(stats, treasury, maintenanceDue, feedbackCount >= feedbackThreshold));
        return alerts;
    }

    public AdminLoginSummaryDto getLoginSummary(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        AdminLoginSummaryDto dto = new AdminLoginSummaryDto();
        dto.setStats(adminService.getStats(adminUserId));
        dto.setTreasury(getSummary(adminUserId));
        dto.setAlerts(getAlerts(adminUserId));
        return dto;
    }

    private int computeHealthScore(AdminStatsResponse stats, TreasurySummaryDto treasury, boolean maintenanceDue, boolean feedbackAlert) {
        int score = 100;
        if (maintenanceDue) score -= 15;
        if (feedbackAlert) score -= 5;
        if (stats.getPendingApprovals() > 0) score -= Math.min(20, (int) stats.getPendingApprovals() * 5);
        if (stats.getBlockedUsers() > 2) score -= 10;
        if (treasury.getNetProfitThisMonth() != null && treasury.getNetProfitThisMonth().compareTo(BigDecimal.ZERO) < 0) {
            score -= 20;
        }
        return Math.max(0, Math.min(100, score));
    }

    private boolean isMaintenanceDue(int intervalDays) {
        String last = getSetting(KEY_LAST_MAINTENANCE, "");
        if (last == null || last.isBlank()) return true;
        try {
            Instant lastAt = Instant.parse(last);
            return ChronoUnit.DAYS.between(lastAt, Instant.now()) >= intervalDays;
        } catch (Exception e) {
            return true;
        }
    }

    private AdminAlertItemDto alert(String id, String type, String title, String message, String route) {
        AdminAlertItemDto a = new AdminAlertItemDto();
        a.setId(id);
        a.setType(type);
        a.setTitle(title);
        a.setMessage(message);
        a.setRoute(route);
        return a;
    }

    private void enrichPlatformTreasury(TreasurySummaryDto dto, LocalDate monthStart, BigDecimal licMonth) {
        BigDecimal accountBalance = getDecimalSetting(KEY_ACCOUNT_BALANCE, BigDecimal.valueOf(50000));
        int maintPct = getIntSetting(KEY_ALLOC_MAINTENANCE, 40);
        int fixedPct = getIntSetting(KEY_ALLOC_FIXED, 15);
        int reservePct = getIntSetting(KEY_ALLOC_RESERVE, 15);
        int payrollPct = getIntSetting(KEY_ALLOC_PAYROLL, 20);
        int toolsPct = getIntSetting(KEY_ALLOC_TOOLS, 10);
        int headcount = Math.max(1, getIntSetting(KEY_PAYROLL_HEADCOUNT, 2));
        int pctTotal = maintPct + fixedPct + reservePct + payrollPct + toolsPct;

        BigDecimal totalInvested = nullToZero(investmentRepository.sumAll());
        BigDecimal netProfit = nullToZero(dto.getNetProfitTotal());
        BigDecimal gap = totalInvested.subtract(netProfit);
        String roiStatus;
        BigDecimal amountToBreakEven;
        BigDecimal profitAbove;
        if (gap.compareTo(BigDecimal.ZERO) > 0) {
            roiStatus = ROI_LOSS;
            amountToBreakEven = gap;
            profitAbove = BigDecimal.ZERO;
        } else if (gap.compareTo(BigDecimal.ZERO) == 0) {
            roiStatus = ROI_BREAK_EVEN;
            amountToBreakEven = BigDecimal.ZERO;
            profitAbove = BigDecimal.ZERO;
        } else {
            roiStatus = ROI_PROFIT;
            amountToBreakEven = BigDecimal.ZERO;
            profitAbove = gap.negate();
        }

        List<TreasuryAllocationBucketDto> buckets = buildAllocationBuckets(
            accountBalance, monthStart, maintPct, fixedPct, reservePct, payrollPct, toolsPct);
        BigDecimal payrollBucket = buckets.stream()
            .filter(b -> "payroll".equals(b.getKey()))
            .map(TreasuryAllocationBucketDto::getAllocatedAmount)
            .findFirst()
            .orElse(BigDecimal.ZERO);
        BigDecimal perPerson = payrollBucket.divide(BigDecimal.valueOf(headcount), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal allocatedTotal = buckets.stream()
            .map(TreasuryAllocationBucketDto::getAllocatedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discretionary = accountBalance.subtract(allocatedTotal).max(BigDecimal.ZERO);

        dto.setAccountBalance(accountBalance);
        dto.setTotalInvested(totalInvested);
        dto.setRoiStatus(roiStatus);
        dto.setAmountToBreakEven(amountToBreakEven);
        dto.setProfitAboveInvestment(profitAbove);
        dto.setAllocationPercentTotal(pctTotal);
        dto.setPayrollHeadcount(headcount);
        dto.setPayrollPerPersonSuggested(perPerson);
        dto.setAllocationBuckets(buckets);
        dto.setPendingSuggestionsCount(suggestionRepository.countByStatus("pending"));
        dto.setMaintenanceCashBalance(buckets.stream()
            .filter(b -> "maintenance".equals(b.getKey()))
            .map(TreasuryAllocationBucketDto::getAllocatedAmount)
            .findFirst()
            .orElse(BigDecimal.ZERO));
        dto.setMaintenanceCashTarget(dto.getMaintenanceCashBalance());
        dto.setAvailableAfterReserve(discretionary);

        refreshAllocationSuggestionsSilently(dto, licMonth, monthStart, maintPct, fixedPct, reservePct, payrollPct, toolsPct, headcount);
    }

    private List<TreasuryAllocationBucketDto> buildAllocationBuckets(
            BigDecimal accountBalance,
            LocalDate monthStart,
            int maintPct, int fixedPct, int reservePct, int payrollPct, int toolsPct) {
        List<TreasuryAllocationBucketDto> buckets = new ArrayList<>();
        buckets.add(bucket("maintenance", maintPct, accountBalance,
            nullToZero(expenseRepository.sumByCategoriesSince(List.of("hosting", "suporte"), monthStart))));
        buckets.add(bucket("fixed", fixedPct, accountBalance,
            nullToZero(expenseRepository.sumByCategoriesSince(List.of("impostos", "geral"), monthStart))));
        buckets.add(bucket("reserve", reservePct, accountBalance, BigDecimal.ZERO));
        buckets.add(bucket("payroll", payrollPct, accountBalance,
            nullToZero(expenseRepository.sumByCategorySince(CATEGORY_SALARY, monthStart))));
        buckets.add(bucket("tools", toolsPct, accountBalance,
            nullToZero(expenseRepository.sumByCategoriesSince(List.of("marketing", "outro"), monthStart))));
        return buckets;
    }

    private TreasuryAllocationBucketDto bucket(String key, int pct, BigDecimal accountBalance, BigDecimal spent) {
        TreasuryAllocationBucketDto b = new TreasuryAllocationBucketDto();
        b.setKey(key);
        b.setPercent(pct);
        BigDecimal allocated = accountBalance
            .multiply(BigDecimal.valueOf(pct))
            .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        b.setAllocatedAmount(allocated);
        b.setSpentThisMonth(spent);
        b.setRemainingInBucket(allocated.subtract(spent).max(BigDecimal.ZERO));
        return b;
    }

    private void refreshAllocationSuggestionsSilently(
            TreasurySummaryDto dto,
            BigDecimal licMonth,
            LocalDate monthStart,
            int maintPct, int fixedPct, int reservePct, int payrollPct, int toolsPct,
            int headcount) {
        BigDecimal totalInvested = nullToZero(dto.getTotalInvested());
        BigDecimal netProfit = nullToZero(dto.getNetProfitTotal());
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0 && netProfit.compareTo(totalInvested) < 0) {
            Map<String, Integer> proposed = rebalance(Map.of(
                "maintenance", maintPct,
                "fixed", fixedPct,
                "reserve", Math.min(25, reservePct + 5),
                "payroll", Math.max(10, payrollPct - 5),
                "tools", toolsPct
            ));
            createSuggestionIfAbsent(
                "BELOW_BREAK_EVEN",
                "Ainda em prejuízo face ao investido",
                "O lucro acumulado (" + netProfit.toPlainString() + " MZN) é inferior ao capital investido ("
                    + totalInvested.toPlainString() + " MZN). Sugerimos reduzir salários e reforçar reserva.",
                proposed);
            return;
        }
        if (licMonth.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal salaryMonth = nullToZero(expenseRepository.sumByCategorySince(CATEGORY_SALARY, monthStart));
            double salaryShare = salaryMonth.divide(licMonth, 4, java.math.RoundingMode.HALF_UP).doubleValue();
            if (salaryShare > 0.35) {
                Map<String, Integer> proposed = rebalance(Map.of(
                    "maintenance", maintPct,
                    "fixed", fixedPct,
                    "reserve", reservePct,
                    "payroll", Math.max(10, payrollPct - 5),
                    "tools", toolsPct + 5
                ));
                createSuggestionIfAbsent(
                    "PAYROLL_HIGH",
                    "Salários elevados face à receita",
                    "Os salários deste mês representam mais de 35% da receita de licenças. Considere ajustar a percentagem de salários.",
                    proposed);
            }
        }
        if (ROI_PROFIT.equals(dto.getRoiStatus()) && maintPct < 40) {
            Map<String, Integer> proposed = rebalance(Map.of(
                "maintenance", 40,
                "fixed", fixedPct,
                "reserve", reservePct,
                "payroll", payrollPct,
                "tools", Math.max(5, toolsPct - 5)
            ));
            createSuggestionIfAbsent(
                "MAINTENANCE_LOW",
                "Reforçar manutenção (40%)",
                "Com lucro positivo, recomendamos alocar 40% do saldo da conta a backups e manutenção.",
                proposed);
        }
    }

    public void refreshAllocationSuggestions(UUID adminUserId) {
        adminService.requireAdmin(adminUserId);
        TreasurySummaryDto dto = getSummary(adminUserId);
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        BigDecimal licMonth = nullToZero(dto.getLicenseRevenueThisMonth());
        refreshAllocationSuggestionsSilently(dto, licMonth, monthStart,
            getIntSetting(KEY_ALLOC_MAINTENANCE, 40),
            getIntSetting(KEY_ALLOC_FIXED, 15),
            getIntSetting(KEY_ALLOC_RESERVE, 15),
            getIntSetting(KEY_ALLOC_PAYROLL, 20),
            getIntSetting(KEY_ALLOC_TOOLS, 10),
            Math.max(1, getIntSetting(KEY_PAYROLL_HEADCOUNT, 2)));
    }

    private Map<String, Integer> rebalance(Map<String, Integer> values) {
        int sum = values.values().stream().mapToInt(Integer::intValue).sum();
        if (sum <= 100) {
            return new LinkedHashMap<>(values);
        }
        Map<String, Integer> scaled = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> e : values.entrySet()) {
            scaled.put(e.getKey(), (int) Math.round(e.getValue() * 100.0 / sum));
        }
        return scaled;
    }

    private void createSuggestionIfAbsent(String type, String title, String message, Map<String, Integer> proposed) {
        if (suggestionRepository.findBySuggestionTypeAndStatus(type, "pending").isPresent()) {
            return;
        }
        TreasuryAllocationSuggestionEntity s = new TreasuryAllocationSuggestionEntity();
        s.setSuggestionType(type);
        s.setTitle(title);
        s.setMessage(message);
        s.setProposedAllocations(proposed);
        s.setStatus("pending");
        suggestionRepository.save(s);
    }

    private void applyAllocations(Map<String, Integer> alloc) {
        if (alloc == null || alloc.isEmpty()) return;
        setSetting(KEY_ALLOC_MAINTENANCE, String.valueOf(alloc.getOrDefault("maintenance", 40)));
        setSetting(KEY_ALLOC_FIXED, String.valueOf(alloc.getOrDefault("fixed", 15)));
        setSetting(KEY_ALLOC_RESERVE, String.valueOf(alloc.getOrDefault("reserve", 15)));
        setSetting(KEY_ALLOC_PAYROLL, String.valueOf(alloc.getOrDefault("payroll", 20)));
        setSetting(KEY_ALLOC_TOOLS, String.valueOf(alloc.getOrDefault("tools", 10)));
    }

    private TreasuryInvestmentDto toInvestmentDto(TreasuryInvestmentEntity e) {
        TreasuryInvestmentDto d = new TreasuryInvestmentDto();
        d.setId(e.getId().toString());
        d.setAmount(e.getAmount());
        d.setInvestedAt(e.getInvestedAt().toString());
        d.setNotes(e.getNotes());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return d;
    }

    private TreasurySuggestionDto toSuggestionDto(TreasuryAllocationSuggestionEntity s) {
        TreasurySuggestionDto d = new TreasurySuggestionDto();
        d.setId(s.getId().toString());
        d.setSuggestionType(s.getSuggestionType());
        d.setTitle(s.getTitle());
        d.setMessage(s.getMessage());
        d.setProposedAllocations(s.getProposedAllocations());
        d.setStatus(s.getStatus());
        d.setCreatedAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
        return d;
    }

    private List<TreasuryCategoryAmountDto> buildCategoryBreakdown(LocalDate monthStart) {
        return expenseRepository.sumByCategorySinceGrouped(monthStart).stream()
            .map(row -> {
                TreasuryCategoryAmountDto d = new TreasuryCategoryAmountDto();
                d.setCategory(row[0] != null ? row[0].toString() : "geral");
                d.setAmountThisMonth(toBigDecimal(row[1]));
                return d;
            })
            .collect(Collectors.toList());
    }

    private TreasuryBillingEntryDto toBillingDto(Object[] row) {
        UUID id = row[0] instanceof UUID ? (UUID) row[0] : UUID.fromString(row[0].toString());
        Instant paidAt = toInstant(row[1]);
        TreasuryBillingEntryDto d = new TreasuryBillingEntryDto();
        d.setId(id.toString());
        d.setInvoiceNumber(formatInvoiceNumber(id, paidAt));
        d.setPaidAt(paidAt.toString());
        d.setAmount(toBigDecimal(row[2]));
        d.setDurationMonths(row[3] != null ? ((Number) row[3]).intValue() : null);
        d.setPaymentReference(row[4] != null ? row[4].toString() : null);
        d.setUserId(row[5] != null ? row[5].toString() : null);
        d.setCustomerName(row[6] != null ? row[6].toString() : "—");
        d.setCustomerPhone(row[7] != null ? row[7].toString() : "—");
        return d;
    }

    private static String formatInvoiceNumber(UUID txId, Instant createdAt) {
        int year = createdAt.atZone(ZoneOffset.UTC).getYear();
        String shortId = txId.toString().replace("-", "").substring(0, 8).toUpperCase();
        return "CC-" + year + "-" + shortId;
    }

    private BigDecimal getDecimalSetting(String key, BigDecimal defaultVal) {
        String v = getSetting(key, defaultVal.toPlainString());
        try {
            return new BigDecimal(v.trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private OperationalExpenseDto toExpenseDto(OperationalExpenseEntity e) {
        OperationalExpenseDto d = new OperationalExpenseDto();
        d.setId(e.getId().toString());
        d.setTitle(e.getTitle());
        d.setCategory(e.getCategory());
        d.setAmount(e.getAmount());
        d.setExpenseDate(e.getExpenseDate().toString());
        d.setNotes(e.getNotes());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return d;
    }

    private LocalDate parseDate(String iso) {
        try {
            return LocalDate.parse(iso);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data inválida");
        }
    }

    private int getIntSetting(String key, int defaultVal) {
        String v = getSetting(key, String.valueOf(defaultVal));
        try {
            return Integer.parseInt(v.trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private String getSetting(String key, String defaultVal) {
        return settingsRepository.findById(key).map(PlatformAdminSettingEntity::getValue).orElse(defaultVal);
    }

    private void setSetting(String key, String value) {
        PlatformAdminSettingEntity e = settingsRepository.findById(key).orElseGet(() -> {
            PlatformAdminSettingEntity n = new PlatformAdminSettingEntity();
            n.setKey(key);
            return n;
        });
        e.setValue(value);
        settingsRepository.save(e);
    }

    private static BigDecimal nullToZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static Instant toInstant(Object value) {
        if (value == null) return Instant.now();
        if (value instanceof Instant i) return i;
        if (value instanceof Timestamp ts) return ts.toInstant();
        if (value instanceof OffsetDateTime odt) return odt.toInstant();
        return Instant.parse(value.toString());
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal) return (BigDecimal) v;
        if (v instanceof Number) return BigDecimal.valueOf(((Number) v).doubleValue());
        try {
            return new BigDecimal(v.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
