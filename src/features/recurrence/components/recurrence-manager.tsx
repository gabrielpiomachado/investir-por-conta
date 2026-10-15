'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Loader2,
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
import { getSafeUserErrorMessage } from '@/lib/safe-user-error';
import { notifyBudgetActivity } from '@/features/budgets/lib/budget-alerts';
import type { Database } from '@/types/database.types';
import { RecurrenceForm } from './recurrence-form';

type Recurrence = Database['public']['Tables']['recurring_transactions']['Row'];
type Category = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'category_type'
>;

type RecurrenceManagerProps = {
  recurrences: Recurrence[];
  categories: Category[];
  defaultStartDate: string;
};

const frequencyLabels: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function RecurrenceManager({
  recurrences,
  categories,
  defaultStartDate,
}: RecurrenceManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState<Recurrence | null>(
    null,
  );
  const [cancelingRecurrence, setCancelingRecurrence] =
    useState<Recurrence | null>(null);
  const [deleteScope, setDeleteScope] = useState<
    'keep_transactions' | 'delete_all'
  >('keep_transactions');
  const [associatedCount, setAssociatedCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const router = useRouter();

  const handleOpenDelete = async (recurrence: Recurrence) => {
    setCancelError(null);
    setCancelingRecurrence(recurrence);
    setDeleteScope('keep_transactions');
    setIsLoadingCount(true);
    setAssociatedCount(null);

    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('recurring_transaction_id', recurrence.id);

      if (error) {
        setAssociatedCount(0);
      } else {
        setAssociatedCount(count ?? 0);
      }
    } catch {
      setAssociatedCount(0);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const handleDelete = async () => {
    if (!cancelingRecurrence) return;

    setIsCanceling(true);
    setCancelError(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para excluir uma recorrência.',
        );
      }

      if (
        deleteScope === 'delete_all' &&
        associatedCount &&
        associatedCount > 0
      ) {
        const { error: deleteTxError } = await supabase
          .from('transactions')
          .delete()
          .eq('recurring_transaction_id', cancelingRecurrence.id)
          .eq('user_id', userData.user.id);

        if (deleteTxError) {
          throw new Error('Não foi possível excluir as transações geradas.');
        }

        const { error: deleteRecurrenceError } = await supabase
          .from('recurring_transactions')
          .delete()
          .eq('id', cancelingRecurrence.id)
          .eq('user_id', userData.user.id);

        if (deleteRecurrenceError) {
          await supabase
            .from('recurring_transactions')
            .update({ is_active: false })
            .eq('id', cancelingRecurrence.id)
            .eq('user_id', userData.user.id);
        }
      } else {
        const { error: updateError } = await supabase
          .from('recurring_transactions')
          .update({ is_active: false })
          .eq('id', cancelingRecurrence.id)
          .eq('user_id', userData.user.id)
          .eq('is_active', true)
          .select('id')
          .single();

        if (updateError) {
          throw new Error('Não foi possível excluir a recorrência.');
        }
      }

      if (cancelingRecurrence.transaction_type === 'expense') {
        notifyBudgetActivity('check');
      }

      setCancelingRecurrence(null);
      setAssociatedCount(null);
      router.refresh();
    } catch (err: unknown) {
      setCancelError(
        getSafeUserErrorMessage(
          err,
          'Não foi possível excluir a recorrência.',
          [
            'Você precisa estar autenticado para excluir uma recorrência.',
            'Não foi possível excluir as transações geradas.',
          ],
        ),
      );
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Planejamento financeiro
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Transações recorrentes
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Gerencie lançamentos programados para suas receitas e despesas.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Nova recorrência
        </Button>
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Suas recorrências</CardTitle>
          <CardDescription>
            As ocorrências vencidas são lançadas quando você acessa esta área ou
            o dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {recurrences.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarClock aria-hidden="true" className="size-5" />
              </div>
              <h2 className="font-medium">Nenhuma recorrência ativa</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Cadastre uma recorrência para programar seus próximos
                lançamentos.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus aria-hidden="true" />
                Nova recorrência
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recurrences.map((recurrence) => {
                const category = categories.find(
                  (item) => item.id === recurrence.category_id,
                );
                const isIncome = recurrence.transaction_type === 'income';

                return (
                  <li key={recurrence.id}>
                    <article className="flex h-full flex-col rounded-lg border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                              isIncome
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight
                                aria-hidden="true"
                                className="size-4"
                              />
                            ) : (
                              <ArrowDownRight
                                aria-hidden="true"
                                className="size-4"
                              />
                            )}
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate font-medium">
                              {recurrence.description ||
                                category?.name ||
                                'Sem descrição'}
                            </h2>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              {category?.name ?? 'Categoria indisponível'} ·{' '}
                              {isIncome ? 'Receita' : 'Despesa'}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Editar recorrência"
                            title="Editar recorrência"
                            onClick={() => setEditingRecurrence(recurrence)}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir recorrência"
                            title="Excluir recorrência"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleOpenDelete(recurrence)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      <p
                        className={`mt-4 text-xl font-semibold ${
                          isIncome
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {currencyFormatter.format(recurrence.amount)}
                      </p>
                      <div className="mt-auto grid grid-cols-2 gap-3 pt-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Frequência
                          </p>
                          <p className="mt-1 font-medium">
                            {frequencyLabels[recurrence.frequency] ??
                              'Personalizada'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Próxima ocorrência
                          </p>
                          <p className="mt-1 font-medium">
                            {dateFormatter.format(
                              new Date(`${recurrence.next_run_date}T00:00:00Z`),
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {(isCreateOpen || editingRecurrence) && (
        <RecurrenceForm
          key={editingRecurrence?.id ?? 'new-recurrence'}
          recurrence={editingRecurrence ?? undefined}
          categories={categories}
          defaultStartDate={defaultStartDate}
          open
          onOpenChange={(open) => {
            if (!open && editingRecurrence) {
              setEditingRecurrence(null);
            } else if (!open) {
              setIsCreateOpen(false);
            }
          }}
        />
      )}

      <Dialog.Root
        open={Boolean(cancelingRecurrence)}
        onOpenChange={(open) => {
          if (!open && !isCanceling) {
            setCancelingRecurrence(null);
            setCancelError(null);
            setAssociatedCount(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl outline-none">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Dialog.Title className="text-xl font-semibold">
                  Excluir recorrência
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {associatedCount && associatedCount > 0
                    ? 'Escolha como deseja proceder com as transações já geradas.'
                    : 'Nenhum lançamento futuro será gerado para esta série.'}
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar confirmação"
                onClick={() => {
                  if (!isCanceling) {
                    setCancelingRecurrence(null);
                    setCancelError(null);
                    setAssociatedCount(null);
                  }
                }}
                disabled={isCanceling}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            {isLoadingCount && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
                <span>Verificando transações geradas...</span>
              </div>
            )}

            {!isLoadingCount && associatedCount !== null && associatedCount > 0 && (
              <div className="mb-4 space-y-3">
                <p className="text-sm">
                  Esta recorrência possui{' '}
                  <strong className="font-semibold text-foreground">
                    {associatedCount}{' '}
                    {associatedCount === 1
                      ? 'transação gerada anteriormente'
                      : 'transações geradas anteriormente'}
                  </strong>
                  . O que você deseja fazer?
                </p>

                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-label="Opções de exclusão de transações geradas"
                >
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      deleteScope === 'keep_transactions'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delete-scope"
                      value="keep_transactions"
                      checked={deleteScope === 'keep_transactions'}
                      onChange={() => setDeleteScope('keep_transactions')}
                      disabled={isCanceling}
                      className="mt-1"
                    />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-medium text-foreground">
                        Manter transações geradas
                      </p>
                      <p className="text-muted-foreground">
                        Cancela a recorrência para não gerar novas transações.
                        As {associatedCount} transações já criadas serão
                        preservadas no seu histórico.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      deleteScope === 'delete_all'
                        ? 'border-destructive bg-destructive/5 ring-1 ring-destructive'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delete-scope"
                      value="delete_all"
                      checked={deleteScope === 'delete_all'}
                      onChange={() => setDeleteScope('delete_all')}
                      disabled={isCanceling}
                      className="mt-1"
                    />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-medium text-destructive">
                        Apagar recorrência e transações geradas
                      </p>
                      <p className="text-muted-foreground">
                        Exclui a recorrência e apaga permanentemente as{' '}
                        {associatedCount} transações já criadas no seu
                        histórico financeiro.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {!isLoadingCount &&
              (associatedCount === null || associatedCount === 0) && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {cancelingRecurrence?.description || 'Esta série recorrente'}{' '}
                  será excluída. Nenhuma transação foi gerada por ela ainda.
                </p>
              )}

            {cancelError && (
              <p
                role="alert"
                className="mb-4 text-sm font-medium text-destructive"
              >
                {cancelError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCancelingRecurrence(null);
                  setCancelError(null);
                  setAssociatedCount(null);
                }}
                disabled={isCanceling}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isCanceling || isLoadingCount}
              >
                {isCanceling
                  ? 'Excluindo...'
                  : deleteScope === 'delete_all' &&
                      associatedCount &&
                      associatedCount > 0
                    ? 'Excluir tudo'
                    : 'Excluir recorrência'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
