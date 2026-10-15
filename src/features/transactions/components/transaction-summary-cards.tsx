import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { currencyFormatter } from '../lib/transaction-formatters';

type TransactionSummaryCardsProps = {
  totalIncome: number;
  totalExpenses: number;
  periodBalance: number;
};

export function TransactionSummaryCards({
  totalIncome,
  totalExpenses,
  periodBalance,
}: TransactionSummaryCardsProps) {
  return (
    <section aria-label="Resumo do período" className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Receitas</CardDescription>
          <CardTitle className="text-xl text-green-600">
            {currencyFormatter.format(totalIncome)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Despesas</CardDescription>
          <CardTitle className="text-xl text-red-600">
            {currencyFormatter.format(totalExpenses)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Balanço do período</CardDescription>
          <CardTitle
            className={`text-xl ${
              periodBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {currencyFormatter.format(periodBalance)}
          </CardTitle>
        </CardHeader>
      </Card>
    </section>
  );
}
