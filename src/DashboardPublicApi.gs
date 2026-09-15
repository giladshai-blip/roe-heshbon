/**
 * Financial Dashboard — clear manual entry points
 * DEV release: dev-2.0.0
 *
 * These are the canonical functions Gilad should run from Apps Script.
 * Legacy V5.x names remain behind this layer only for compatibility with the current Core.
 */

function installFinancialDashboard() {
  return installDashboardV56();
}

function refreshFinancialDashboard() {
  return refreshDashboardV56();
}

function clearFinancialDashboard() {
  return clearDashboardV56();
}

function testFinancialDashboard() {
  return runDashboardSelfTestV5100();
}
