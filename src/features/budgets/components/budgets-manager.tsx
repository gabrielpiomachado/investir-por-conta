'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { notifyBudgetActivity } from '../lib/budget-alerts';
import {
  calculateBudgetSpent,
  getPeriodBounds,
  type Budget,
  type BudgetCategory,
  type BudgetTransaction,
} from '../lib/budget-progress';
import { BudgetForm } from './budget-form';

type BudgetsManagerProps = {
  budgets: Budget[];
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  selectedMonth: string;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function monthLabel(month: string) {
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function BudgetsManager({
  budgets,
  categories,
  transactions,
  selectedMonth,
}: BudgetsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const monthBudgets = budgets.filter((budget) => budget.period === 'monthly');
  const annualBudgets = budgets.filter((budget) => budget.period === 'annual');
  const { startDate: monthStart, endDate: monthEnd } = getPeriodBounds(
    'monthly',
    selectedMonth,
  );
  const totalSpent = transactions.reduce((total, transaction) => {
    if (
      transaction.transaction_date >= monthStart &&
      transaction.transaction_date <= monthEnd
    ) {
      return total + transaction.amount;
    }
    return total;
  }, 0);

  const navigateToMonth = (month: string) => {
    router.push(`/budgets?month=${month}`);
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para excluir um orçamento.',
        );
      }

      const { error: removeError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', deletingBudget.id)
        .eq('user_id', userData.user.id)
        .select('id')
        .single();

      if (removeError) throw new Error(removeError.message);
      notifyBudgetActivity('reset');
      setDeletingBudget(null);
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'Não foi possível excluir o orçamento.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Planejamento financeiro
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Orçamentos</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Defina limites por categoria e acompanhe o consumo ao longo do
            tempo.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Novo orçamento
        </Button>
      </header>

      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Mês anterior"
          title="Mês anterior"
          onClick={() => navigateToMonth(shiftMonth(selectedMonth, -1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <h2 className="text-lg font-semibold">{monthLabel(selectedMonth)}</h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Próximo mês"
          title="Próximo mês"
          onClick={() => navigateToMonth(shiftMonth(selectedMonth, 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <section
        aria-label="Resumo do período"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card className="gap-2 py-4">
          <CardHeader className="pb-0">
            <CardDescription>Total orçado mensal</CardDescription>
            <CardTitle className="text-2xl">
              {currencyFormatter.format(
                monthBudgets.reduce((sum, budget) => sum + budget.amount, 0),
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="pb-0">
            <CardDescription>Total orçado anual</CardDescription>
            <CardTitle className="text-2xl">
              {currencyFormatter.format(
                annualBudgets.reduce((sum, budget) => sum + budget.amount, 0),
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="pb-0">
            <CardDescription>
              Total gasto em {monthLabel(selectedMonth)}
            </CardDescription>
            <CardTitle className="text-2xl">
              {currencyFormatter.format(totalSpent)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="budgets-heading">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="budgets-heading" className="text-lg font-semibold">
              Orçamentos registrados
            </h2>
            <p className="text-sm text-muted-foreground">
              O progresso anual considera os gastos de janeiro até{' '}
              {monthLabel(selectedMonth)}.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {budgets.length} {budgets.length === 1 ? 'orçamento' : 'orçamentos'}
          </span>
        </div>

        {budgets.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FolderOpen aria-hidden="true" className="size-5" />
            </div>
            <h3 className="font-medium">Nenhum orçamento registrado</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie um orçamento para acompanhar os gastos de uma categoria.
            </p>
            <Button className="mt-5" onClick={() => setIsCreateOpen(true)}>
              <Plus aria-hidden="true" />
              Criar orçamento
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map((budget) => {
              const category = categories.find(
                (item) => item.id === budget.category_id,
              );
              const spent = calculateBudgetSpent(
                budget,
                transactions,
                selectedMonth,
              );
              const percentage = (spent / budget.amount) * 100;
              const isExceeded = percentage >= 100;
              const periodLabel =
                budget.period === 'monthly'
                  ? `Em ${monthLabel(selectedMonth)}`
                  : `Acumulado até ${monthLabel(selectedMonth)}`;

              return (
                <li key={budget.id}>
                  <Card className="h-full gap-4 py-4">
                    <CardHeader className="gap-1 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">
                            {category?.name ?? 'Categoria indisponível'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Orçamento{' '}
                            {budget.period === 'monthly' ? 'mensal' : 'anual'}
                          </CardDescription>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar orçamento de ${category?.name ?? 'categoria'}`}
                            title="Editar orçamento"
                            onClick={() => setEditingBudget(budget)}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Excluir orçamento de ${category?.name ?? 'categoria'}`}
                            title="Excluir orçamento"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingBudget(budget);
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {periodLabel}
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {currencyFormatter.format(spent)}{' '}
                            <span className="text-sm font-normal text-muted-foreground">
                              / {currencyFormatter.format(budget.amount)}
                            </span>
                          </p>
                        </div>
                        <p
                          className={cn(
                            'shrink-0 text-sm font-semibold tabular-nums',
                            isExceeded ? 'text-destructive' : 'text-foreground',
                          )}
                        >
                          {isExceeded
                            ? 'Excedido'
                            : `${percentage.toFixed(0)}%`}
                        </p>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Consumo do orçamento de ${category?.name ?? 'categoria'}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(percentage, 100)}
                        className="h-2 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-[width] duration-300',
                            isExceeded ? 'bg-destructive' : 'bg-primary',
                          )}
                          style={{
                            width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                          }}
                        />
                      </div>
                      {budget.alert_thresholds.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Alertas em {budget.alert_thresholds.join('% · ')}%
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(isCreateOpen || editingBudget) && (
        <BudgetForm
          budget={editingBudget ?? undefined}
          categories={categories}
          open
          onOpenChange={(open) => {
            if (!open && editingBudget) setEditingBudget(null);
            else if (!open) setIsCreateOpen(false);
          }}
        />
      )}

      <Dialog.Root
        open={Boolean(deletingBudget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingBudget(null);
            setDeleteError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl outline-none">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Dialog.Title className="text-xl font-semibold">
                  Excluir orçamento
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Esta ação remove o limite e os alertas configurados para a
                  categoria.
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar confirmação"
                onClick={() => setDeletingBudget(null)}
                disabled={isDeleting}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            {deleteError && (
              <p
                role="alert"
                className="mb-4 text-sm font-medium text-destructive"
              >
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingBudget(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir orçamento'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
