import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { clampPercentage } from '../lib/dashboard-metrics';
import { currencyFormatter } from '../lib/dashboard-formatters';
import type { DashboardGoal } from '../types';

type PrioritizedGoalItem = {
  goal: DashboardGoal;
  percentage: number;
};

type DashboardGoalsPreviewProps = {
  goals: DashboardGoal[];
  prioritizedGoals: PrioritizedGoalItem[];
};

export function DashboardGoalsPreview({
  goals,
  prioritizedGoals,
}: DashboardGoalsPreviewProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Metas ativas</CardTitle>
        <CardDescription>
          {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
        </CardDescription>
        <Link
          href="/goals"
          className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {goals.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma meta ativa cadastrada.
          </p>
        ) : (
          <ul className="divide-y">
            {prioritizedGoals.map(({ goal, percentage }) => {
              const progress = clampPercentage(percentage);

              return (
                <li
                  key={goal.id}
                  className="space-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">
                      {goal.name}
                    </p>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {percentage.toLocaleString('pt-BR', {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{currencyFormatter.format(goal.current_amount)}</span>
                    <span>
                      Meta: {currencyFormatter.format(goal.target_amount)}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Progresso da meta ${goal.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
