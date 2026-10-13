'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
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
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!cancelingRecurrence) return;

    setIsCanceling(true);
    setCancelError(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para cancelar uma recorrência.',
        );
      }

      const { error: updateError } = await supabase
        .from('recurring_transactions')
        .update({ is_active: false })
        .eq('id', cancelingRecurrence.id)
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .select('id')
        .single();

      if (updateError) throw new Error(updateError.message);

      setCancelingRecurrence(null);
      router.refresh();
    } catch (err: unknown) {
      setCancelError(
        err instanceof Error
          ? err.message
          : 'Não foi possível cancelar a recorrência.',
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
                            aria-label="Cancelar recorrência"
                            title="Cancelar recorrência"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setCancelError(null);
                              setCancelingRecurrence(recurrence);
                            }}
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
                              recurrence.frequency}
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
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl outline-none">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Dialog.Title className="text-xl font-semibold">
                  Cancelar recorrência
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  As transações já geradas serão preservadas. Nenhuma nova
                  transação será criada.
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar confirmação"
                onClick={() => {
                  if (!isCanceling) setCancelingRecurrence(null);
                }}
                disabled={isCanceling}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <p className="mb-4 text-sm">
              {cancelingRecurrence?.description || 'Esta série recorrente'} será
              cancelada.
            </p>
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
                onClick={() => setCancelingRecurrence(null)}
                disabled={isCanceling}
              >
                Manter recorrência
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                disabled={isCanceling}
              >
                {isCanceling ? 'Cancelando...' : 'Confirmar cancelamento'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
