'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { goalSchema } from '../schemas/goal.schema';
import type { Goal } from '../lib/goal-types';

type GoalFormProps = {
  goal?: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GoalForm({ goal, open, onOpenChange }: GoalFormProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(
    goal ? String(goal.target_amount) : '',
  );
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = Boolean(goal);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isLoading) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = goalSchema.safeParse({
      name,
      target_amount: targetAmount,
      target_date: targetDate,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const result = goal
        ? await supabase.rpc('update_goal', {
            p_goal_id: goal.id,
            p_name: validation.data.name,
            p_target_amount: validation.data.target_amount,
            p_target_date: validation.data.target_date,
          })
        : await supabase.rpc('create_goal', {
            p_name: validation.data.name,
            p_target_amount: validation.data.target_amount,
            p_target_date: validation.data.target_date,
          });

      if (result.error) throw new Error(result.error.message);

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível salvar a meta.',
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
                {isEditing ? 'Editar meta' : 'Nova meta'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {isEditing
                  ? 'Atualize os dados da sua meta.'
                  : 'Defina um objetivo para acompanhar seu progresso.'}
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
              <Label htmlFor="goal-name">Nome</Label>
              <Input
                id="goal-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
                maxLength={40}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal-target-amount">Valor-alvo</Label>
              <Input
                id="goal-target-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                placeholder="0,00"
                value={targetAmount}
                onChange={(event) => {
                  setTargetAmount(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal-target-date">Data-alvo (opcional)</Label>
              <Input
                id="goal-target-date"
                type="date"
                value={targetDate}
                onChange={(event) => {
                  setTargetDate(event.target.value);
                  if (error) setError(null);
                }}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar alterações'
                    : 'Criar meta'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
