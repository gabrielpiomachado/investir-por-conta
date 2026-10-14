'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { budgetSchema } from '../schemas/budget.schema';
import type { Budget, BudgetCategory } from '../lib/budget-progress';
import { notifyBudgetActivity } from '../lib/budget-alerts';
import { cn } from '@/lib/utils';

type BudgetFormProps = {
  budget?: Budget;
  categories: BudgetCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

export function BudgetForm({
  budget,
  categories,
  open,
  onOpenChange,
}: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(budget?.category_id ?? '');
  const [period, setPeriod] = useState<Budget['period']>(
    budget?.period ?? 'monthly',
  );
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '');
  const [thresholds, setThresholds] = useState<number[]>(
    budget?.alert_thresholds ?? [80, 100],
  );
  const [newThreshold, setNewThreshold] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = Boolean(budget);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isLoading) return;
    onOpenChange(nextOpen);
  };

  const addThreshold = () => {
    const value = Number(newThreshold);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      setError('Informe um percentual inteiro entre 1% e 100%.');
      return;
    }
    if (thresholds.includes(value)) {
      setError('Esse percentual já está configurado.');
      return;
    }
    setThresholds((current) => [...current, value].sort((a, b) => a - b));
    setNewThreshold('');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = budgetSchema.safeParse({
      category_id: categoryId,
      period,
      amount,
      alert_thresholds: thresholds,
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
          'Você precisa estar autenticado para salvar um orçamento.',
        );
      }

      if (budget) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({
            period: validation.data.period,
            amount: validation.data.amount,
            alert_thresholds: validation.data.alert_thresholds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', budget.id)
          .eq('user_id', userData.user.id)
          .select('id')
          .single();

        if (updateError) {
          throw new Error('Não foi possível salvar o orçamento.');
        }
      } else {
        const { error: insertError } = await supabase.from('budgets').insert({
          user_id: userData.user.id,
          category_id: validation.data.category_id,
          period: validation.data.period,
          amount: validation.data.amount,
          alert_thresholds: validation.data.alert_thresholds,
        });

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Esta categoria já possui um orçamento.');
          }
          throw new Error('Não foi possível salvar o orçamento.');
        }
      }

      notifyBudgetActivity('reset');
      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o orçamento.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold">
                {isEditing ? 'Editar orçamento' : 'Novo orçamento'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Defina um limite para uma categoria de despesa.
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
              <Label htmlFor="budget-category">Categoria de despesa</Label>
              <select
                id="budget-category"
                className={selectClassName}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={isLoading || isEditing}
                required
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {categories
                  .filter((category) => category.category_type === 'expense')
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-amount">Limite</Label>
              <Input
                id="budget-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Periodicidade</Label>
              <div
                role="group"
                aria-label="Periodicidade do orçamento"
                className="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1"
              >
                {(['monthly', 'annual'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={period === value}
                    onClick={() => setPeriod(value)}
                    disabled={isLoading}
                    className={cn(
                      'rounded-md py-2 text-sm font-medium transition-colors',
                      period === value
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {value === 'monthly' ? 'Mensal' : 'Anual'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-alert-threshold">Alertas de consumo</Label>
              <div className="flex flex-wrap gap-2" aria-live="polite">
                {thresholds.map((threshold) => (
                  <span
                    key={threshold}
                    className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
                  >
                    {threshold}%
                    <button
                      type="button"
                      aria-label={`Remover alerta de ${threshold}%`}
                      title={`Remover alerta de ${threshold}%`}
                      disabled={isLoading}
                      onClick={() =>
                        setThresholds((current) =>
                          current.filter((value) => value !== threshold),
                        )
                      }
                      className="rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </span>
                ))}
                {thresholds.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum alerta configurado.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="budget-alert-threshold"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  placeholder="Percentual de 1 a 100"
                  value={newThreshold}
                  onChange={(event) => setNewThreshold(event.target.value)}
                  disabled={isLoading}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addThreshold();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addThreshold}
                  disabled={isLoading || !newThreshold}
                >
                  <Plus aria-hidden="true" />
                  Adicionar
                </Button>
              </div>
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
                disabled={isLoading || categories.length === 0}
              >
                {isLoading
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar alterações'
                    : 'Criar orçamento'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
