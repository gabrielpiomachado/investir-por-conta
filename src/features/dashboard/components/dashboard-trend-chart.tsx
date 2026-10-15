import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  currencyFormatter,
  formatMonthTick,
  monthLabel,
} from '../lib/dashboard-formatters';

type TrendItem = {
  month: string;
  income: number;
  expenses: number;
};

type DashboardTrendChartProps = {
  trend: TrendItem[];
  selectedMonth: string;
};

export function DashboardTrendChart({
  trend,
  selectedMonth,
}: DashboardTrendChartProps) {
  const maxTrendValue = Math.max(
    0,
    ...trend.flatMap(({ income, expenses }) => [income, expenses]),
  );

  return (
    <Card className="gap-0 py-0 xl:col-span-3">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Receitas vs. despesas</CardTitle>
        <CardDescription>
          Últimos seis meses até {monthLabel(selectedMonth)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-emerald-600" /> Receitas
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-rose-600" /> Despesas
          </span>
        </div>
        <div
          role="img"
          aria-label={`Gráfico de receitas e despesas dos últimos seis meses até ${monthLabel(selectedMonth)}`}
          className="grid grid-cols-6 gap-2"
        >
          {trend.map((item) => {
            const incomeHeight = maxTrendValue
              ? (item.income / maxTrendValue) * 100
              : 0;
            const expensesHeight = maxTrendValue
              ? (item.expenses / maxTrendValue) * 100
              : 0;

            return (
              <div key={item.month} className="min-w-0 text-center">
                <div className="flex h-36 items-end justify-center gap-1 border-b border-border px-1">
                  <span
                    aria-hidden="true"
                    title={`Receitas ${currencyFormatter.format(item.income)}`}
                    className="w-3 rounded-t-sm bg-emerald-600 sm:w-5"
                    style={{ height: `${incomeHeight}%` }}
                  />
                  <span
                    aria-hidden="true"
                    title={`Despesas ${currencyFormatter.format(item.expenses)}`}
                    className="w-3 rounded-t-sm bg-rose-600 sm:w-5"
                    style={{ height: `${expensesHeight}%` }}
                  />
                </div>
                <span className="mt-2 block truncate text-xs capitalize text-muted-foreground">
                  {formatMonthTick(item.month)}
                </span>
              </div>
            );
          })}
        </div>
        {maxTrendValue === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sem movimentações no período.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
