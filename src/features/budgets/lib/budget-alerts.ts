export type BudgetAlertRefreshMode = 'check' | 'reset';

export function notifyBudgetActivity(mode: BudgetAlertRefreshMode = 'check') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<BudgetAlertRefreshMode>('budget-alert-refresh', {
      detail: mode,
    }),
  );
}
