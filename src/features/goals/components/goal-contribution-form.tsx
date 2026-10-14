'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { Goal } from '../lib/goal-types';
import { goalContributionSchema } from '../schemas/goal-contribution.schema';

type GoalContributionFormProps = {
  goal: Goal;
  availableBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function GoalContributionForm({
  goal,
  availableBalance,
  open,
  onOpenChange,
}: GoalContributionFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isLoading) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = goalContributionSchema.safeParse({
      amount,
      description,
    });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: contributionError } = await supabase.rpc(
        'contribute_to_goal',
        {
          p_goal_id: goal.id,
          p_amount: validation.data.amount,
          p_description: validation.data.description,
        },
      );

      if (contributionError?.message === 'INSUFFICIENT_BALANCE') {
        const availableValue = contributionError.details?.match(
          /available_balance=(-?[\d.]+)/,
        )?.[1];
        const currentAvailable = availableValue
          ? Number(availableValue)
          : availableBalance;
        throw new Error(
          `Saldo insuficiente. Saldo disponível: ${currencyFormatter.format(currentAvailable)}.`,
        );
      }

      if (contributionError) {
        throw new Error(
          contributionError.message === 'GOAL_NOT_FOUND'
            ? 'Esta meta não está mais disponível.'
            : 'Não foi possível registrar o aporte. Tente novamente.',
        );
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível registrar o aporte.',
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
                Contribuir para {goal.name}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Saldo disponível: {currencyFormatter.format(availableBalance)}
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
              <Label htmlFor="goal-contribution-amount">Valor do aporte</Label>
              <Input
                id="goal-contribution-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal-contribution-description">
                Descrição (opcional)
              </Label>
              <textarea
                id="goal-contribution-description"
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  if (error) setError(null);
                }}
                maxLength={500}
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
                disabled={isLoading || availableBalance <= 0}
              >
                {isLoading ? 'Registrando...' : 'Registrar aporte'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
