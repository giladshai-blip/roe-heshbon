/**
 * ============================================================
 * רואה חשבון — Hotfix V5.6.1
 * ============================================================
 * תיקון חירום ל-Core V5.6:
 * - שחזור כיוון עסקה לפי tx.isIncome של RiseUp.
 * - מניעת שימוש בסימן amount כדי לקבוע הכנסה/הוצאה.
 * - Health Check בטוח להרצה מהעורך ללא SpreadsheetApp.getUi().alert.
 * - פונקציית סנכרון בטוחה נפרדת כדי לא להפעיל את syncRiseUpV5 הבעייתית.
 * - התקנת טריגר שעתי חדש ל-syncRiseUpV561.
 *
 * אין לשמור PAT בקוד. ה-PAT נשאר ב-Script Properties.
 * ============================================================
 */

function healthCheckV561() {
  const h = healthCheckV56_();
  Logger.log(h.summary);
  try {
    getSpreadsheet_().toast(h.summary, 'Health Check V5.6.1', 10);
  } catch (e) {
    Logger.log('Toast unavailable: ' + String(e.message || e));
  }
  return h;
}

function syncRiseUpV561() {
  const startedAt = new Date();
  const startMs = Date.now();
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(10000)) {
    logSync_({
      action: 'RiseUp Sync V5.6.1',
      status: 'SKIPPED',
      records: 0,
      message: 'סנכרון אחר כבר פעיל',
      syncState: 'LOCKED'
    });
    return null;
  }

  const metrics = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    duplicates: 0,
    months: [],
    tokenRef: '',
    riseupLastUpdatedAt: '',
    budgetUpdated: false,
    balanceBefore: '',
    balanceAfter: ''
  };

  try {
    validateRequiredSheets_();
    const pat = getRiseupPat_();
    metrics.balanceBefore = getAutomaticBankBalance_();
    metrics.months = getSyncMonths_();

    let all = [];

    metrics.months.forEach(function(month) {
      const r = riseupGet_(
        '/api/external/transactions?cashflowMonth=' + encodeURIComponent(month),
        pat
      );

      if (r && r._meta && r._meta.tokenRef) {
        metrics.tokenRef = r._meta.tokenRef;
      }

      const txs = r && Array.isArray(r.transactions) ? r.transactions : [];
      all = all.concat(txs);
    });

    const txr = upsertTransactionsV561_(all);
    Object.assign(metrics, txr);

    const currentMonth = formatMonth_(new Date());
    const budget = riseupGet_(
      '/api/external/budget/' + encodeURIComponent(currentMonth),
      pat
    );

    if (budget && budget._meta && budget._meta.tokenRef) {
      metrics.tokenRef = budget._meta.tokenRef;
    }

    if (budget && budget.lastUpdatedAt) {
      metrics.riseupLastUpdatedAt = new Date(budget.lastUpdatedAt);
    }

    metrics.budgetUpdated = syncBudget_(currentMonth, budget);

    setConfigParam_('תאריך רענון אחרון', new Date(), '', 'RiseUp Sync V5.6.1');
    setConfigParam_('מצב hash', metrics.budgetUpdated ? 'UPDATED' : 'SKIPPED_UNCHANGED', '', 'Budget hash');
    setConfigParam_('גרסת מערכת', 'V5.6.1', '', 'Core V5.6 + direction hotfix');

    applyModelIntegrityFixes_();
    ensureAutomaticBankBalanceFormula_();
    SpreadsheetApp.flush();

    metrics.balanceAfter = getAutomaticBankBalance_();
    const health = healthCheckV56_();

    logSync_({
      time: startedAt,
      action: 'RiseUp Sync V5.6.1',
      status: health.ok ? 'SUCCESS' : 'WARNING',
      records: all.length,
      message:
        'תיקון direction לפי isIncome | חודשים: ' +
        metrics.months.join(', ') +
        ' | חדשות: ' + metrics.inserted +
        ' | עודכנו: ' + metrics.updated +
        ' | ללא שינוי: ' + metrics.unchanged +
        ' | כפילויות API: ' + metrics.duplicates,
      tokenRef: metrics.tokenRef,
      riseupLastUpdatedAt: metrics.riseupLastUpdatedAt,
      syncState: metrics.budgetUpdated ? 'UPDATED' : 'SKIPPED_UNCHANGED',
      durationMs: Date.now() - startMs,
      inserted: metrics.inserted,
      updated: metrics.updated,
      duplicates: metrics.duplicates,
      balanceBefore: metrics.balanceBefore,
      balanceAfter: metrics.balanceAfter,
      health: health.summary
    });

    try {
      getSpreadsheet_().toast(
        'V5.6.1: עודכנו ' + metrics.updated + ' עסקאות | ' + (health.ok ? '🟢 תקין' : '🔴 דורש בדיקה'),
        'רואה חשבון',
        10
      );
    } catch (e) {}

    return { success: health.ok, metrics: metrics, health: health };

  } catch (e) {
    logSync_({
      time: startedAt,
      action: 'RiseUp Sync V5.6.1',
      status: 'ERROR',
      records: 0,
      message: String(e.message || e),
      durationMs: Date.now() - startMs,
      health: 'ERROR'
    });
    throw e;

  } finally {
    lock.releaseLock();
  }
}

function runV561Now() {
  const r = syncRiseUpV561();
  if (!r) return null;
  Logger.log(r.health.summary);
  return r;
}

function installHourlyTriggerV561() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    const fn = t.getHandlerFunction();
    if (fn === 'syncRiseUpV5' || fn === 'syncRiseUpV561') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp
    .newTrigger('syncRiseUpV561')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('Hourly trigger installed for syncRiseUpV561');
}

function upsertTransactionsV561_(transactions) {
  const sh = getSheet_('TRANSACTIONS');
  const lr = sh.getLastRow();
  const width = V56.TRANSACTION_HEADERS.length;
  const existing = lr > 1 ? sh.getRange(2, 1, lr - 1, width).getValues() : [];
  const index = {};

  existing.forEach(function(r, i) {
    const key = String(r[0] || '').trim() || transactionFingerprintFromRow_(r);
    if (key) index[key] = i;
  });

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let duplicates = 0;
  const seenApi = {};
  const now = new Date();
  const append = [];

  transactions.forEach(function(tx) {
    const row = normalizeTransactionV561_(tx, now);
    const key = String(row[0] || '').trim() || transactionFingerprintFromRow_(row);
    if (!key) return;

    if (seenApi[key]) {
      duplicates++;
      return;
    }
    seenApi[key] = true;

    if (index[key] === undefined) {
      row[20] = now;
      append.push(row);
      index[key] = existing.length + append.length - 1;
      inserted++;
      return;
    }

    const i = index[key];
    const old = existing[i];
    row[20] = validFirstSeenV561_(old[20]) ? old[20] : (old[19] || now);

    if (rowsEquivalent_(old, row, 19)) {
      unchanged++;
    } else {
      existing[i] = row;
      sh.getRange(i + 2, 1, 1, width).setValues([row]);
      updated++;
    }
  });

  if (append.length) {
    sh.getRange(sh.getLastRow() + 1, 1, append.length, width).setValues(append);
  }

  return {
    inserted: inserted,
    updated: updated,
    unchanged: unchanged,
    duplicates: duplicates
  };
}

function normalizeTransactionV561_(tx, now) {
  const isIncome = tx.isIncome === true;
  const amount = Math.abs(Number(tx.amount || tx.transactionAmount || 0) || 0);

  const totalInstallments = tx.totalNumberOfInstallments != null
    ? tx.totalNumberOfInstallments
    : tx.totalNumberOfPayments != null
      ? tx.totalNumberOfPayments
      : tx.totalInstallments != null
        ? tx.totalInstallments
        : '';

  return [
    tx.transactionId || tx.id || '',
    parseDateSafe_(tx.transactionDate || tx.date || tx.actualDate),
    tx.cashflowDate || tx.cashflowMonth || '',
    tx.businessName || tx.description || '',
    tx.categoryLabel || tx.category || '',
    amount,
    isIncome ? 'הכנסה' : 'הוצאה',
    tx.sourceType || tx.accountType || '',
    tx.source || '',
    tx.accountNickname || tx.accountName || '',
    tx.accountNumberHash || '',
    parseDateSafe_(tx.billingDate || tx.chargeDate),
    tx.isInstallment === true,
    tx.installmentNumber != null ? tx.installmentNumber : '',
    totalInstallments,
    tx.isPostponed === true,
    tx.commitmentId || '',
    tx.actualType || '',
    tx.categoryType || '',
    now,
    ''
  ];
}

function validFirstSeenV561_(v) {
  if (v instanceof Date) return !isNaN(v.getTime());
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return !isNaN(d.getTime());
  }
  return false;
}
