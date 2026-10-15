'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { getSafeUserErrorMessage } from '@/lib/safe-user-error';
import { notifyBudgetActivity } from '@/features/budgets/lib/budget-alerts';
import type { Database } from '@/types/database.types';
import {
  recurrenceSchema,
  type RecurrenceInput,
} from '../schemas/recurrence.schema';

type Recurrence = Database['public']['Tables']['recurring_transactions']['Row'];
type Category = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'category_type'
>;
type Frequency = 'daily' | 'weekly' | 'monthly';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

function formatDate(dateStr: string) {
  return dateFormatter.format(new Date(`${dateStr}T00:00:00Z`));
}

const frequencyLabels: Record<Frequency, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

type RecurrenceFormProps = {
  recurrence?: Recurrence;
  categories: Category[];
  defaultStartDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecurrenceForm({
  recurrence,
  categories,
  defaultStartDate,
  open,
  onOpenChange,
}: RecurrenceFormProps) {
  const [transactionType, setTransactionType] = useState<
    Category['category_type']
  >(recurrence?.transaction_type ?? 'expense');
  const [amount, setAmount] = useState(
    recurrence ? String(recurrence.amount) : '',
  );
  const [categoryId, setCategoryId] = useState(recurrence?.category_id ?? '');
  const [frequency, setFrequency] = useState<Frequency>(
    (recurrence?.frequency as Frequency | undefined) ?? 'monthly',
  );
  const [startDate, setStartDate] = useState(
    recurrence?.start_date ?? defaultStartDate,
  );
  const [description, setDescription] = useState(recurrence?.description ?? '');
  const [step, setStep] = useState<'form' | 'confirm_scope'>('form');
  const [editScope, setEditScope] = useState<'future' | 'all'>('future');
  const [pastTransactionsCount, setPastTransactionsCount] = useState<
    number | null
  >(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = Boolean(recurrence);
  const isStartDateChanged = recurrence
    ? startDate !== recurrence.start_date
    : false;
  const isFrequencyChanged = recurrence
    ? frequency !== recurrence.frequency
    : false;
  const availableCategories = categories.filter(
    (category) => category.category_type === transactionType,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (isLoading || isValidating)) return;
    if (!nextOpen) {
      setStep('form');
      setPastTransactionsCount(null);
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = recurrenceSchema.safeParse({
      transaction_type: transactionType,
      amount,
      category_id: categoryId,
      frequency,
      start_date: startDate,
      description,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    if (recurrence) {
      setIsValidating(true);
      try {
        const supabase = createClient();
        const { count, error: countError } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('recurring_transaction_id', recurrence.id);

        if (!countError && count && count > 0) {
          setPastTransactionsCount(count);
          const hasStartChanged = startDate !== recurrence.start_date;
          setEditScope(hasStartChanged ? 'all' : 'future');
          setStep('confirm_scope');
          setIsValidating(false);
          return;
        }
      } catch {
        // Fallback to direct save
      } finally {
        setIsValidating(false);
      }
    }

    await executeSave(validation.data, 'future');
  };

  const executeSave = async (
    input: RecurrenceInput,
    scope: 'future' | 'all',
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para salvar uma recorrência.',
        );
      }

      const anchorDay = Number(input.start_date.slice(8, 10));

      if (recurrence) {
        const effectiveScope =
          input.start_date !== recurrence.start_date ? 'all' : scope;

        const { error: updateError } = await supabase.rpc(
          'update_recurring_transaction',
          {
            p_recurrence_id: recurrence.id,
            p_transaction_type: input.transaction_type,
            p_amount: input.amount,
            p_category_id: input.category_id,
            p_frequency: input.frequency,
            p_start_date: input.start_date,
            p_description: input.description,
            p_scope: effectiveScope,
          },
        );

        if (updateError) {
          console.error('Erro ao atualizar recorrência:', updateError);
          throw new Error('Não foi possível salvar a recorrência.');
        }

        if (
          recurrence.transaction_type === 'expense' ||
          input.transaction_type === 'expense'
        ) {
          notifyBudgetActivity('check');
        }
      } else {
        const { error: insertError } = await supabase
          .from('recurring_transactions')
          .insert({
            user_id: userData.user.id,
            transaction_type: input.transaction_type,
            amount: input.amount,
            category_id: input.category_id,
            frequency: input.frequency,
            start_date: input.start_date,
            next_run_date: input.start_date,
            monthly_anchor_day: anchorDay,
            description: input.description,
          });

        if (insertError) {
          throw new Error('Não foi possível salvar a recorrência.');
        }

        const { data: generatedCount, error: generationError } =
          await supabase.rpc('generate_due_recurring_transactions');

        if (generationError) {
          throw new Error('Não foi possível salvar a recorrência.');
        }
        if (generatedCount > 0) notifyBudgetActivity('check');
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(
        getSafeUserErrorMessage(
          err,
          'Não foi possível salvar a recorrência.',
          [
            'Você precisa estar autenticado para salvar uma recorrência.',
            'Não foi possível salvar a recorrência.',
          ],
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold">
                {step === 'confirm_scope'
                  ? isStartDateChanged
                    ? 'Redefinir histórico da recorrência'
                    : 'Aplicar alterações'
                  : isEditing
                    ? 'Editar recorrência'
                    : 'Nova recorrência'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {step === 'confirm_scope'
                  ? isStartDateChanged
                    ? 'A data de início foi alterada. O histórico desta série será reconstruído a partir da nova data.'
                    : 'Escolha se as alterações devem afetar também as transações já geradas.'
                  : isEditing
                    ? 'Defina os novos dados para esta transação recorrente.'
                    : 'Defina os dados e a frequência dos próximos lançamentos.'}
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar formulário"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading || isValidating}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          {step === 'confirm_scope' ? (
            isStartDateChanged ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-950 dark:text-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                    />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        A data de início foi alterada de{' '}
                        <strong className="underline underline-offset-2">
                          {formatDate(recurrence!.start_date)}
                        </strong>{' '}
                        para{' '}
                        <strong className="underline underline-offset-2">
                          {formatDate(startDate)}
                        </strong>
                        .
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-amber-200/80">
                        Alterações na data de início afetam obrigatoriamente todo
                        o histórico da série. As {pastTransactionsCount}{' '}
                        {pastTransactionsCount === 1
                          ? 'transação gerada anteriormente será recalculada'
                          : 'transações geradas anteriormente serão recalculadas'}
                        : lançamentos que ficarem fora do novo cronograma serão
                        removidos e novas transações serão geradas desde{' '}
                        {formatDate(startDate)}.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Deseja prosseguir e reconstruir as transações desta recorrência a partir de {formatDate(startDate)}?
                </p>

                {error && (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('form');
                      setError(null);
                    }}
                    disabled={isLoading}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const validation = recurrenceSchema.safeParse({
                        transaction_type: transactionType,
                        amount,
                        category_id: categoryId,
                        frequency,
                        start_date: startDate,
                        description,
                      });
                      if (validation.success) {
                        executeSave(validation.data, 'all');
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : 'Confirmar e redefinir'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm">
                  Esta série recorrente já possui{' '}
                  <strong className="font-semibold text-foreground">
                    {pastTransactionsCount}{' '}
                    {pastTransactionsCount === 1
                      ? 'transação gerada anteriormente'
                      : 'transações geradas anteriormente'}
                  </strong>
                  . Como você deseja aplicar as alterações?
                </p>

                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-label="Escopo da alteração"
                >
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors ${
                      editScope === 'future'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit-scope"
                      value="future"
                      checked={editScope === 'future'}
                      onChange={() => setEditScope('future')}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-foreground">
                        Somente a partir desta edição
                      </p>
                      <p className="text-xs text-muted-foreground">
                        As {pastTransactionsCount} transações passadas serão
                        mantidas como estão. As alterações serão aplicadas apenas
                        aos próximos lançamentos.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors ${
                      editScope === 'all'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit-scope"
                      value="all"
                      checked={editScope === 'all'}
                      onChange={() => setEditScope('all')}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-foreground">
                        Todas as ocorrências (passadas e futuras)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isFrequencyChanged
                          ? `Atualiza todo o histórico desta recorrência desde o início (${formatDate(
                              recurrence!.start_date,
                            )}). As transações anteriores serão recalculadas na frequência ${
                              frequencyLabels[frequency]
                            } — gerando novos lançamentos ou excluindo os excedentes.`
                          : `Atualiza o valor, categoria, tipo e descrição das ${pastTransactionsCount} transações já registradas e aplica aos próximos lançamentos.`}
                      </p>
                    </div>
                  </label>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('form');
                      setError(null);
                    }}
                    disabled={isLoading}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const validation = recurrenceSchema.safeParse({
                        transaction_type: transactionType,
                        amount,
                        category_id: categoryId,
                        frequency,
                        start_date: startDate,
                        description,
                      });
                      if (validation.success) {
                        executeSave(validation.data, editScope);
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : 'Confirmar e salvar'}
                  </Button>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <div
                  role="group"
                  aria-label="Tipo de transação recorrente"
                  className="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1"
                >
                  {(['expense', 'income'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={transactionType === type}
                      onClick={() => {
                        setTransactionType(type);
                        const nextCategory = categories.find(
                          (category) => category.category_type === type,
                        );
                        setCategoryId(nextCategory?.id ?? '');
                      }}
                      disabled={isLoading || isValidating}
                      className={`rounded-md py-2 text-sm font-medium transition-colors ${
                        transactionType === type
                          ? type === 'income'
                            ? 'bg-background text-green-600 shadow-xs'
                            : 'bg-background text-red-600 shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type === 'income' ? 'Receita' : 'Despesa'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="recurrence-amount">Valor</Label>
                  <Input
                    id="recurrence-amount"
                    type="number"
                    min="0.01"
                    max="9999999999.99"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={isLoading || isValidating}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recurrence-category">Categoria</Label>
                  <select
                    id="recurrence-category"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    disabled={
                      isLoading ||
                      isValidating ||
                      availableCategories.length === 0
                    }
                    required
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      {availableCategories.length === 0
                        ? 'Nenhuma categoria disponível'
                        : 'Selecione uma categoria'}
                    </option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="recurrence-frequency">Frequência</Label>
                  <select
                    id="recurrence-frequency"
                    value={frequency}
                    onChange={(event) =>
                      setFrequency(event.target.value as Frequency)
                    }
                    disabled={isLoading || isValidating}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recurrence-start-date">Data de início</Label>
                  <Input
                    id="recurrence-start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    disabled={isLoading || isValidating}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recurrence-description">
                  Descrição (opcional)
                </Label>
                <Input
                  id="recurrence-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  placeholder="Ex.: mensalidade do serviço"
                  disabled={isLoading || isValidating}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading || isValidating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    isValidating ||
                    availableCategories.length === 0
                  }
                >
                  {isLoading || isValidating
                    ? 'Salvando...'
                    : isEditing
                      ? 'Salvar alterações'
                      : 'Criar recorrência'}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
