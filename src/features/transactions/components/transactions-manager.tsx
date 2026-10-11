'use client';

import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  FolderOpen,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { Category } from '@/features/categories/components/category-form';
import type { Database } from '@/types/database.types';
import { TransactionForm } from './transaction-form';

type Transaction = Pick<
  Database['public']['Tables']['transactions']['Row'],
  | 'id'
  | 'category_id'
  | 'transaction_type'
  | 'amount'
  | 'transaction_date'
  | 'description'
>;

type TransactionsManagerProps = {
  categories: Category[];
  transactions: Transaction[];
};

type TypeFilter = 'all' | Category['category_type'];

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

function formatTransactionDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day, 12));
}

export function TransactionsManager({
  categories,
  transactions,
}: TransactionsManagerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filterCategories =
    type === 'all'
      ? categories
      : categories.filter((category) => category.category_type === type);

  const filteredTransactions = transactions.filter((transaction) => {
    if (startDate && transaction.transaction_date < startDate) return false;
    if (endDate && transaction.transaction_date > endDate) return false;
    if (categoryId !== 'all' && transaction.category_id !== categoryId) return false;
    if (type !== 'all' && transaction.transaction_type !== type) return false;
    return true;
  });

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryId('all');
    setType('all');
  };

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Visão financeira</p>
          <h1 className="text-3xl font-semibold tracking-tight">Transações</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Consulte e organize as receitas e despesas registradas.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Nova transação
        </Button>
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
          <CardDescription>
            Combine período, categoria e tipo para encontrar transações.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="filter-start-date">De</Label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="filter-start-date"
                type="date"
                className={`${selectClassName} pl-9`}
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-end-date">Até</Label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="filter-end-date"
                type="date"
                className={`${selectClassName} pl-9`}
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-category">Categoria</Label>
            <select
              id="filter-category"
              className={selectClassName}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="all">Todas</option>
              {filterCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-type">Tipo</Label>
            <select
              id="filter-type"
              className={selectClassName}
              value={type}
              onChange={(event) => {
                const nextType = event.target.value as TypeFilter;
                setType(nextType);
                if (
                  categoryId !== 'all' &&
                  nextType !== 'all' &&
                  categories.find((category) => category.id === categoryId)
                    ?.category_type !== nextType
                ) {
                  setCategoryId('all');
                }
              }}
            >
              <option value="all">Todos</option>
              <option value="expense">Despesas</option>
              <option value="income">Receitas</option>
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="w-full lg:w-auto"
          >
            Limpar filtros
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Todas as transações</CardTitle>
          <CardDescription>
            {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1
              ? 'transação encontrada'
              : 'transações encontradas'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredTransactions.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FolderOpen aria-hidden="true" className="size-5" />
              </div>
              <h2 className="font-medium">
                {transactions.length === 0
                  ? 'Nenhuma transação registrada'
                  : 'Nenhuma transação encontrada'}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {transactions.length === 0
                  ? 'Registre sua primeira receita ou despesa para acompanhar suas finanças.'
                  : 'Tente ajustar ou limpar os filtros para ver outras transações.'}
              </p>
              {transactions.length === 0 ? (
                <Button
                  className="mt-5"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus aria-hidden="true" />
                  Nova transação
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y">
              {filteredTransactions.map((transaction) => {
                const isIncome = transaction.transaction_type === 'income';
                const category = categories.find(
                  (item) => item.id === transaction.category_id,
                );
                const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

                return (
                  <li
                    key={transaction.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                          isIncome
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {transaction.description || category?.name || 'Transação'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {transaction.description
                            ? `${category?.name ?? 'Categoria indisponível'} · `
                            : ''}
                          {formatTransactionDate(transaction.transaction_date)} ·{' '}
                          {isIncome ? 'Receita' : 'Despesa'}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`shrink-0 font-semibold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {currencyFormatter.format(transaction.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {isCreateOpen && (
        <TransactionForm
          categories={categories}
          open
          onOpenChange={setIsCreateOpen}
        />
      )}
    </div>
  );
}
