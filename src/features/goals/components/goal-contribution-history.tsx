'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { GoalContribution, Goal } from '../lib/goal-types';

type GoalContributionHistoryProps = {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
});

export function GoalContributionHistory({
  goal,
  open,
  onOpenChange,
}: GoalContributionHistoryProps) {
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    let isCurrent = true;
    const loadContributions = async () => {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from('goal_contributions')
        .select('id, amount, description, created_at')
        .eq('goal_id', goal.id)
        .order('created_at', { ascending: false });

      if (!isCurrent) return;

      if (queryError) {
        setError('Não foi possível carregar o histórico de contribuições.');
      } else {
        setContributions(data ?? []);
      }
      setIsLoading(false);
    };

    void loadContributions();
    return () => {
      isCurrent = false;
    };
  }, [goal.id, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold">
                Histórico de contribuições
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {goal.name}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Fechar histórico"
                  title="Fechar histórico"
                >
                  <X aria-hidden="true" />
                </Button>
              }
            />
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Carregando histórico...
            </p>
          ) : error ? (
            <p
              role="alert"
              className="py-8 text-center text-sm text-destructive"
            >
              {error}
            </p>
          ) : contributions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ainda não há contribuições para esta meta.
            </p>
          ) : (
            <ul className="divide-y">
              {contributions.map((contribution) => (
                <li
                  key={contribution.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {currencyFormatter.format(contribution.amount)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(contribution.created_at))}
                    </p>
                    {contribution.description && (
                      <p className="mt-2 wrap-break-word text-sm text-muted-foreground">
                        {contribution.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
