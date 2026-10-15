import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CategoryTotal } from '../lib/dashboard-metrics';
import {
  categoryChartColors,
  currencyFormatter,
  monthLabel,
} from '../lib/dashboard-formatters';

type CategoryBreakdownCardProps = {
  title: string;
  emptyMessage: string;
  month: string;
  totals: CategoryTotal[];
  categoryNames: Map<string, string>;
};

function CategoryBreakdownCard({
  title,
  emptyMessage,
  month,
  totals,
  categoryNames,
}: CategoryBreakdownCardProps) {
  const total = totals.reduce((sum, category) => sum + category.amount, 0);
  const segments = totals.reduce<
    {
      categoryId: string;
      amount: number;
      percentage: number;
      offset: number;
    }[]
  >((currentSegments, category) => {
    const previousSegment = currentSegments[currentSegments.length - 1];
    const percentage = total ? (category.amount / total) * 100 : 0;

    return [
      ...currentSegments,
      {
        ...category,
        percentage,
        offset:
          (previousSegment?.offset ?? 0) + (previousSegment?.percentage ?? 0),
      },
    ];
  }, []);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{monthLabel(month)}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <>
            <p className="mb-4 text-center text-sm font-medium tabular-nums">
              {currencyFormatter.format(total)}
              <span className="ml-2 font-normal text-muted-foreground">
                no total
              </span>
            </p>
            <div className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(0,1.2fr)] items-center gap-4">
              <div
                role="img"
                aria-label={`Gráfico de rosca de ${title.toLocaleLowerCase('pt-BR')}. Total: ${currencyFormatter.format(total)}.`}
                className="mx-auto w-full max-w-40"
              >
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="18"
                  />
                  {segments.map((segment, index) => (
                    <circle
                      key={segment.categoryId}
                      cx="60"
                      cy="60"
                      r="40"
                      fill="none"
                      stroke={
                        categoryChartColors[index % categoryChartColors.length]
                      }
                      strokeWidth="18"
                      strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
                      strokeDashoffset={-segment.offset}
                      pathLength="100"
                      transform="rotate(-90 60 60)"
                    />
                  ))}
                </svg>
              </div>
              <ul className="min-w-0 space-y-3">
                {segments.map((segment, index) => (
                  <li
                    key={segment.categoryId}
                    className="flex min-w-0 items-start gap-2 text-xs"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 size-2.5 shrink-0 rounded-sm"
                      style={{
                        backgroundColor:
                          categoryChartColors[
                            index % categoryChartColors.length
                          ],
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate font-medium">
                          {categoryNames.get(segment.categoryId) ??
                            'Categoria indisponível'}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {segment.percentage.toLocaleString('pt-BR', {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </span>
                      </div>
                      <p className="tabular-nums text-muted-foreground">
                        {currencyFormatter.format(segment.amount)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type DashboardCategoryBreakdownProps = {
  selectedMonth: string;
  incomeByCategory: CategoryTotal[];
  expensesByCategory: CategoryTotal[];
  categoryNames: Map<string, string>;
};

export function DashboardCategoryBreakdown({
  selectedMonth,
  incomeByCategory,
  expensesByCategory,
  categoryNames,
}: DashboardCategoryBreakdownProps) {
  return (
    <section
      aria-label="Gráficos por categoria"
      className="grid gap-4 lg:grid-cols-2"
    >
      <CategoryBreakdownCard
        title="Receitas por categoria"
        emptyMessage="Nenhuma receita por categoria neste mês."
        month={selectedMonth}
        totals={incomeByCategory}
        categoryNames={categoryNames}
      />
      <CategoryBreakdownCard
        title="Despesas por categoria"
        emptyMessage="Nenhuma despesa por categoria neste mês."
        month={selectedMonth}
        totals={expensesByCategory}
        categoryNames={categoryNames}
      />
    </section>
  );
}
