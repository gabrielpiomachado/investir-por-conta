import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { currencyFormatter, monthLabel } from '../lib/dashboard-formatters';

type SummaryCardProps = {
  title: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'positive' | 'negative';
};

function SummaryCard({
  title,
  value,
  detail,
  tone = 'default',
}: SummaryCardProps) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="pb-0">
        <CardDescription>{title}</CardDescription>
        <CardTitle
          className={`text-2xl tabular-nums ${
            tone === 'positive'
              ? 'text-emerald-700 dark:text-emerald-400'
              : tone === 'negative'
                ? 'text-destructive'
                : ''
          }`}
        >
          {value}
        </CardTitle>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </CardHeader>
    </Card>
  );
}

type DashboardSummaryCardsProps = {
  balance: number;
  income: number;
  expenses: number;
  variation: number | null;
  selectedMonth: string;
};

export function DashboardSummaryCards({
  balance,
  income,
  expenses,
  variation,
  selectedMonth,
}: DashboardSummaryCardsProps) {
  const variationValue =
    variation === null
      ? '—'
      : `${variation > 0 ? '+' : ''}${variation.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

  const variationDetail =
    variation === null
      ? 'Sem base de comparação'
      : 'Resultado líquido vs. mês anterior';

  const variationTone =
    variation === null
      ? 'default'
      : variation >= 0
        ? 'positive'
        : 'negative';

  return (
    <section
      aria-label="Resumo financeiro"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <SummaryCard
        title="Saldo consolidado"
        value={currencyFormatter.format(balance)}
      />
      <SummaryCard
        title="Receitas"
        value={currencyFormatter.format(income)}
        detail={monthLabel(selectedMonth)}
        tone="positive"
      />
      <SummaryCard
        title="Despesas"
        value={currencyFormatter.format(expenses)}
        detail={monthLabel(selectedMonth)}
        tone="negative"
      />
      <SummaryCard
        title="Variação mensal"
        value={variationValue}
        detail={variationDetail}
        tone={variationTone}
      />
    </section>
  );
}
