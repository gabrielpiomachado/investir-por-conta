'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { notifyBudgetActivity } from '@/features/budgets/lib/budget-alerts';
import type { Database } from '@/types/database.types';
import { recurrenceSchema } from '../schemas/recurrence.schema';

type Recurrence = Database['public']['Tables']['recurring_transactions']['Row'];
type Category = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'category_type'
>;
type Frequency = 'daily' | 'weekly' | 'monthly';

function getNextRunDate(
  frequency: Frequency,
  startDate: string,
  currentNextRunDate: string,
) {
  const earliestDate =
    startDate > currentNextRunDate ? startDate : currentNextRunDate;
  const target = new Date(`${earliestDate}T00:00:00.000Z`);
  const anchor = new Date(`${startDate}T00:00:00.000Z`);

  if (frequency === 'daily') return earliestDate;

  if (frequency === 'weekly') {
    const offset = (anchor.getUTCDay() - target.getUTCDay() + 7) % 7;
    target.setUTCDate(target.getUTCDate() + offset);
    return target.toISOString().slice(0, 10);
  }

  for (let monthOffset = 0; monthOffset < 12; monthOffset += 1) {
    const month = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + monthOffset, 1),
    );
    const lastDay = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const occurrence = new Date(
      Date.UTC(
        month.getUTCFullYear(),
        month.getUTCMonth(),
        Math.min(anchor.getUTCDate(), lastDay),
      ),
    );

    if (occurrence >= target) return occurrence.toISOString().slice(0, 10);
  }

  return earliestDate;
}

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = Boolean(recurrence);
  const availableCategories = categories.filter(
    (category) => category.category_type === transactionType,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isLoading) return;
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

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para salvar uma recorrência.',
        );
      }

      const input = validation.data;
      const anchorDay = Number(input.start_date.slice(8, 10));

      if (recurrence) {
        const { data: generatedCount, error: generationError } =
          await supabase.rpc('generate_due_recurring_transactions');

        if (generationError) throw new Error(generationError.message);
        if (generatedCount > 0) notifyBudgetActivity('check');

        const { data: currentRecurrence, error: currentError } = await supabase
          .from('recurring_transactions')
          .select('next_run_date')
          .eq('id', recurrence.id)
          .eq('user_id', userData.user.id)
          .eq('is_active', true)
          .single();

        if (currentError) throw new Error(currentError.message);

        const nextRunDate = getNextRunDate(
          input.frequency,
          input.start_date,
          currentRecurrence.next_run_date,
        );
        const { error: updateError } = await supabase
          .from('recurring_transactions')
          .update({
            transaction_type: input.transaction_type,
            amount: input.amount,
            category_id: input.category_id,
            frequency: input.frequency,
            start_date: input.start_date,
            next_run_date: nextRunDate,
            monthly_anchor_day: anchorDay,
            description: input.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recurrence.id)
          .eq('user_id', userData.user.id)
          .eq('is_active', true)
          .select('id')
          .single();

        if (updateError) throw new Error(updateError.message);
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

        if (insertError) throw new Error(insertError.message);

        const { data: generatedCount, error: generationError } =
          await supabase.rpc('generate_due_recurring_transactions');

        if (generationError) throw new Error(generationError.message);
        if (generatedCount > 0) notifyBudgetActivity('check');
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a recorrência.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold">
                {isEditing ? 'Editar recorrência' : 'Nova recorrência'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {isEditing
                  ? 'As alterações serão aplicadas às próximas ocorrências.'
                  : 'Defina os dados e a frequência dos próximos lançamentos.'}
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar formulário"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

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
                    disabled={isLoading}
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
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recurrence-category">Categoria</Label>
                <select
                  id="recurrence-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={isLoading || availableCategories.length === 0}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || availableCategories.length === 0}
              >
                {isLoading
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar alterações'
                    : 'Criar recorrência'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
