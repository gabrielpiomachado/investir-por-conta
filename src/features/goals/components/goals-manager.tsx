'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import {
  CircleDollarSign,
  FolderOpen,
  History,
  Pencil,
  Plus,
  Target,
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
import { calculateGoalProgress } from '../lib/goal-progress';
import type { Goal } from '../lib/goal-types';
import { GoalContributionForm } from './goal-contribution-form';
import { GoalContributionHistory } from './goal-contribution-history';
import { GoalForm } from './goal-form';

type GoalsManagerProps = {
  goals: Goal[];
  availableBalance: number;
};

type GoalStatus = Goal['status'];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

function formatTargetDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`));
}

export function GoalsManager({ goals, availableBalance }: GoalsManagerProps) {
  const [activeStatus, setActiveStatus] = useState<GoalStatus>('active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const visibleGoals = goals.filter((goal) => goal.status === activeStatus);
  const activeCount = goals.filter((goal) => goal.status === 'active').length;
  const completedCount = goals.filter(
    (goal) => goal.status === 'completed',
  ).length;

  const handleDelete = async () => {
    if (!deletingGoal) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('cancel_goal', {
        p_goal_id: deletingGoal.id,
      });

      if (error) {
        throw new Error(
          error.message === 'GOAL_NOT_FOUND'
            ? 'Esta meta não está mais disponível.'
            : 'Não foi possível excluir a meta. Tente novamente.',
        );
      }

      setDeletingGoal(null);
      router.refresh();
    } catch {
      setDeleteError('Não foi possível excluir a meta. Tente novamente.');
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
          <h1 className="text-3xl font-semibold tracking-tight">
            Metas financeiras
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Acompanhe seus objetivos e o progresso de cada contribuição.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Nova meta
        </Button>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 border-y py-4">
        <div>
          <p className="text-sm text-muted-foreground">Saldo disponível</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {currencyFormatter.format(availableBalance)}
          </p>
        </div>
        <div
          role="group"
          aria-label="Filtrar metas por estado"
          className="grid w-full grid-cols-2 gap-1 rounded-lg border bg-muted p-1 sm:w-auto"
        >
          <button
            type="button"
            aria-pressed={activeStatus === 'active'}
            onClick={() => setActiveStatus('active')}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeStatus === 'active'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Target aria-hidden="true" className="size-4" />
            Ativas
            <span className="text-xs opacity-70">{activeCount}</span>
          </button>
          <button
            type="button"
            aria-pressed={activeStatus === 'completed'}
            onClick={() => setActiveStatus('completed')}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeStatus === 'completed'
                ? 'bg-background text-green-700 shadow-xs dark:text-green-400'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <CircleDollarSign aria-hidden="true" className="size-4" />
            Concluídas
            <span className="text-xs opacity-70">{completedCount}</span>
          </button>
        </div>
      </section>

      {visibleGoals.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderOpen aria-hidden="true" className="size-5" />
          </div>
          <h2 className="font-medium">
            {activeStatus === 'active'
              ? 'Nenhuma meta ativa'
              : 'Nenhuma meta concluída'}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {activeStatus === 'active'
              ? 'Crie uma meta para começar a acompanhar seu progresso.'
              : 'As metas concluídas aparecerão aqui.'}
          </p>
          {activeStatus === 'active' && (
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus aria-hidden="true" />
              Nova meta
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visibleGoals.map((goal) => {
            const progress = calculateGoalProgress(
              goal.current_amount,
              goal.target_amount,
            );
            const progressLabel = progress.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            });

            return (
              <li key={goal.id}>
                <Card className="h-full gap-0 py-0">
                  <CardHeader className="border-b py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="wrap-break-word text-base">
                          {goal.name}
                        </CardTitle>
                        <CardDescription>
                          {goal.status === 'completed' ? 'Concluída' : 'Ativa'}
                          {goal.target_date
                            ? ` · Prazo ${formatTargetDate(goal.target_date)}`
                            : ''}
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar meta ${goal.name}`}
                          title="Editar meta"
                          onClick={() => setEditingGoal(goal)}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Ver histórico de ${goal.name}`}
                          title="Ver histórico"
                          onClick={() => setHistoryGoal(goal)}
                        >
                          <History aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir meta ${goal.name}`}
                          title="Excluir meta"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingGoal(goal);
                          }}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex items-end justify-between gap-3">
                      <p className="min-w-0 wrap-break-word text-lg font-semibold tabular-nums">
                        {currencyFormatter.format(goal.current_amount)}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          de {currencyFormatter.format(goal.target_amount)}
                        </span>
                      </p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {progressLabel}%
                      </p>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Progresso de ${goal.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(progress, 100)}
                      aria-valuetext={`${progressLabel}%`}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    {goal.status === 'completed' && goal.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Concluída em{' '}
                        {dateFormatter.format(new Date(goal.completed_at))}
                      </p>
                    )}
                    <div className="flex justify-end border-t pt-3">
                      <Button
                        type="button"
                        variant={
                          goal.status === 'completed' ? 'outline' : 'default'
                        }
                        onClick={() => setContributingGoal(goal)}
                        disabled={availableBalance <= 0}
                      >
                        <CircleDollarSign aria-hidden="true" />
                        Contribuir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {(isCreateOpen || editingGoal) && (
        <GoalForm
          key={editingGoal?.id ?? 'new-goal'}
          goal={editingGoal ?? undefined}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingGoal(null);
              setIsCreateOpen(false);
            }
          }}
        />
      )}

      {contributingGoal && (
        <GoalContributionForm
          key={contributingGoal.id}
          goal={contributingGoal}
          availableBalance={availableBalance}
          open
          onOpenChange={(open) => {
            if (!open) setContributingGoal(null);
          }}
        />
      )}

      {historyGoal && (
        <GoalContributionHistory
          goal={historyGoal}
          open
          onOpenChange={(open) => {
            if (!open) setHistoryGoal(null);
          }}
        />
      )}

      <Dialog.Root
        open={Boolean(deletingGoal)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingGoal(null);
            setDeleteError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl outline-none">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Dialog.Title className="text-xl font-semibold">
                  Excluir meta?
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  As contribuições serão removidas e o valor voltará ao saldo
                  disponível.
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar confirmação"
                onClick={() => {
                  setDeletingGoal(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            {deletingGoal && (
              <p className="mb-5 font-medium">{deletingGoal.name}</p>
            )}
            {deleteError && (
              <p
                role="alert"
                className="mb-5 text-sm font-medium text-destructive"
              >
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingGoal(null)}
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
                {isDeleting ? 'Excluindo...' : 'Excluir meta'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
