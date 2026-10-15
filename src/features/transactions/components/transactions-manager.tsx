'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
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
import { Label } from '@/components/ui/label';
import type { Category } from '@/features/categories/components/category-form';
import { createClient } from '@/lib/supabase/client';
import { getSafeUserErrorMessage } from '@/lib/safe-user-error';
import { notifyBudgetActivity } from '@/features/budgets/lib/budget-alerts';
import { TransactionForm, type TransactionRecord } from './transaction-form';

type Transaction = TransactionRecord;

type TransactionsManagerProps = {
  categories: Category[];
  transactions: Transaction[];
};

type TypeFilter = 'all' | Category['category_type'];

const TRANSACTIONS_PER_PAGE = 50;

const selectClassName =
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');
const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatTransactionDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day, 12));
}

function formatMonth(month: string) {
  const label = monthFormatter.format(new Date(`${month}-01T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}

function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

function formatFilterDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day, 12));
}

type TransactionActionsProps = {
  transactionName: string;
  onEdit: () => void;
  onDelete: () => void;
};

function TransactionActions({
  transactionName,
  onEdit,
  onDelete,
}: TransactionActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Editar transação ${transactionName}`}
        onClick={onEdit}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Excluir transação ${transactionName}`}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

export function TransactionsManager({
  categories,
  transactions,
}: TransactionsManagerProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const filterCategories =
    type === 'all'
      ? categories
      : categories.filter((category) => category.category_type === type);

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR');
  const hasCustomPeriod = Boolean(startDate || endDate);

  const filteredTransactions = transactions.filter((transaction) => {
    if (hasCustomPeriod) {
      if (startDate && transaction.transaction_date < startDate) return false;
      if (endDate && transaction.transaction_date > endDate) return false;
    } else if (!transaction.transaction_date.startsWith(selectedMonth)) {
      return false;
    }
    if (categoryId !== 'all' && transaction.category_id !== categoryId) return false;
    if (type !== 'all' && transaction.transaction_type !== type) return false;
    if (normalizedSearch) {
      const category = categories.find(
        (item) => item.id === transaction.category_id,
      );
      const searchableValues = [
        transaction.description ?? '',
        category?.name ?? '',
        String(transaction.amount),
        transaction.amount.toFixed(2).replace('.', ','),
        currencyFormatter.format(transaction.amount),
      ];
      if (
        !searchableValues.some((value) =>
          value.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
        )
      ) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(
    filteredTransactions.length / TRANSACTIONS_PER_PAGE,
  );
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageTransactions = filteredTransactions.slice(
    (activePage - 1) * TRANSACTIONS_PER_PAGE,
    activePage * TRANSACTIONS_PER_PAGE,
  );
  const firstTransactionOnPage =
    filteredTransactions.length === 0
      ? 0
      : (activePage - 1) * TRANSACTIONS_PER_PAGE + 1;
  const lastTransactionOnPage = Math.min(
    activePage * TRANSACTIONS_PER_PAGE,
    filteredTransactions.length,
  );

  const totalIncome = filteredTransactions.reduce(
    (sum, transaction) =>
      transaction.transaction_type === 'income'
        ? sum + transaction.amount
        : sum,
    0,
  );
  const totalExpenses = filteredTransactions.reduce(
    (sum, transaction) =>
      transaction.transaction_type === 'expense'
        ? sum + transaction.amount
        : sum,
    0,
  );
  const periodBalance = totalIncome - totalExpenses;
  const hasCustomFilters =
    hasCustomPeriod ||
    categoryId !== 'all' ||
    type !== 'all' ||
    Boolean(normalizedSearch);

  const changeType = (nextType: TypeFilter) => {
    setCurrentPage(1);
    setType(nextType);
    if (
      categoryId !== 'all' &&
      nextType !== 'all' &&
      categories.find((category) => category.id === categoryId)
        ?.category_type !== nextType
    ) {
      setCategoryId('all');
    }
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setStartDate('');
    setEndDate('');
    setCategoryId('all');
    setType('all');
    setSearchQuery('');
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para excluir uma transação.',
        );
      }

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deletingTransaction.id)
        .eq('user_id', userData.user.id)
        .select('id')
        .single();

      if (deleteError) {
        throw new Error('Não foi possível excluir a transação.');
      }

      if (deletingTransaction.transaction_type === 'expense') {
        notifyBudgetActivity('check');
      }

      setDeletingTransaction(null);
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(
        getSafeUserErrorMessage(
          err,
          'Não foi possível excluir a transação.',
          ['Você precisa estar autenticado para excluir uma transação.'],
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getTransactionName = (transaction: Transaction) =>
    transaction.description ||
    categories.find((category) => category.id === transaction.category_id)
      ?.name ||
    'sem descrição';

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
        <CardHeader className={isFilterOpen ? 'border-b py-4' : 'py-4'}>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription>
                Combine período, tipo e categoria para encontrar transações.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant={isFilterOpen ? 'secondary' : 'outline'}
              aria-expanded={isFilterOpen}
              aria-controls="transaction-filters"
              onClick={() => setIsFilterOpen((open) => !open)}
            >
              <SlidersHorizontal aria-hidden="true" />
              {isFilterOpen ? 'Ocultar filtros' : 'Filtrar'}
            </Button>
          </div>
        </CardHeader>
        {isFilterOpen && (
          <CardContent
            id="transaction-filters"
            className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end"
          >
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
                  onChange={(event) => {
                    setCurrentPage(1);
                    setStartDate(event.target.value);
                  }}
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
                  onChange={(event) => {
                    setCurrentPage(1);
                    setEndDate(event.target.value);
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filter-category">Categoria</Label>
              <select
                id="filter-category"
                className={selectClassName}
                value={categoryId}
                onChange={(event) => {
                  setCurrentPage(1);
                  setCategoryId(event.target.value);
                }}
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
                onChange={(event) => changeType(event.target.value as TypeFilter)}
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
        )}
      </Card>

      <section
        aria-label="Período e filtros aplicados"
        className="flex min-h-10 flex-wrap items-center gap-2"
      >
        {hasCustomFilters ? (
          <>
            {hasCustomPeriod && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCurrentPage(1);
                  setStartDate('');
                  setEndDate('');
                }}
                aria-label="Remover filtro de período"
              >
                <X aria-hidden="true" />
                Período:{' '}
                {startDate && endDate
                  ? `${formatFilterDate(startDate)} – ${formatFilterDate(endDate)}`
                  : startDate
                    ? `a partir de ${formatFilterDate(startDate)}`
                    : `até ${formatFilterDate(endDate)}`}
              </Button>
            )}
            {categoryId !== 'all' && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCurrentPage(1);
                  setCategoryId('all');
                }}
                aria-label="Remover filtro de categoria"
              >
                <X aria-hidden="true" />
                Categoria: {categories.find((item) => item.id === categoryId)?.name}
              </Button>
            )}
            {type !== 'all' && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => changeType('all')}
                aria-label="Remover filtro de tipo"
              >
                <X aria-hidden="true" />
                {type === 'income' ? 'Receitas' : 'Despesas'}
              </Button>
            )}
            {normalizedSearch && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCurrentPage(1);
                  setSearchQuery('');
                }}
                aria-label="Remover filtro de pesquisa"
              >
                <X aria-hidden="true" />
                Pesquisa: {searchQuery.trim()}
              </Button>
            )}
          </>
        ) : (
          <div className="flex w-full items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Mês anterior"
              onClick={() => {
                setCurrentPage(1);
                setSelectedMonth((month) => shiftMonth(month, -1));
              }}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <p className="min-w-40 text-center font-medium">
              {formatMonth(selectedMonth)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Próximo mês"
              onClick={() => {
                setCurrentPage(1);
                setSelectedMonth((month) => shiftMonth(month, 1));
              }}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </section>

      <section
        aria-label="Resumo do período"
        className="grid gap-4 sm:grid-cols-3"
      >
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

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="transaction-search">Pesquisar</Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="transaction-search"
              type="search"
              className={`${selectClassName} pl-9`}
              placeholder="Descrição, valor ou categoria"
              value={searchQuery}
              onChange={(event) => {
                setCurrentPage(1);
                setSearchQuery(event.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">
            {type === 'all'
              ? 'Todas as transações'
              : type === 'income'
                ? 'Receitas'
                : 'Despesas'}
          </CardTitle>
          <CardDescription>
            {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1
              ? 'transação encontrada'
              : 'transações encontradas'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="m-4 flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center sm:m-6">
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
            <>
              <ul className="divide-y sm:hidden">
                {pageTransactions.map((transaction) => {
                  const isIncome = transaction.transaction_type === 'income';
                  const category = categories.find(
                    (item) => item.id === transaction.category_id,
                  );
                  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
                  const transactionName = getTransactionName(transaction);

                  return (
                    <li key={transaction.id} className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                              isIncome
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            <Icon aria-hidden="true" className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="break-words font-medium">
                              {transaction.description || 'Sem descrição'}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatTransactionDate(
                                transaction.transaction_date,
                              )}
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
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t pt-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {category?.name ?? 'Categoria indisponível'}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {isIncome ? 'Receita' : 'Despesa'}
                          </p>
                        </div>
                        <TransactionActions
                          transactionName={transactionName}
                          onEdit={() => setEditingTransaction(transaction)}
                          onDelete={() => {
                            setDeleteError(null);
                            setDeletingTransaction(transaction);
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground">
                      <th scope="col" className="px-6 py-3 font-medium">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium">
                        Descrição
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium">
                        Categoria
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right font-medium"
                      >
                        Valor
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right font-medium"
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pageTransactions.map((transaction) => {
                      const isIncome =
                        transaction.transaction_type === 'income';
                      const category = categories.find(
                        (item) => item.id === transaction.category_id,
                      );

                      return (
                        <tr key={transaction.id} className="hover:bg-muted/20">
                          <td className="whitespace-nowrap px-6 py-4">
                            {formatTransactionDate(transaction.transaction_date)}
                          </td>
                          <td className="max-w-64 px-6 py-4">
                            <span className="block truncate font-medium">
                              {transaction.description || 'Sem descrição'}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {isIncome ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className="max-w-48 truncate px-6 py-4">
                            {category?.name ?? 'Categoria indisponível'}
                          </td>
                          <td
                            className={`whitespace-nowrap px-6 py-4 text-right font-semibold ${
                              isIncome ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isIncome ? '+' : '−'}
                            {currencyFormatter.format(transaction.amount)}
                          </td>
                          <td className="px-6 py-3">
                            <TransactionActions
                              transactionName={getTransactionName(transaction)}
                              onEdit={() => setEditingTransaction(transaction)}
                              onDelete={() => {
                                setDeleteError(null);
                                setDeletingTransaction(transaction);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <nav
                  aria-label="Paginação das transações"
                  className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <p className="text-sm text-muted-foreground">
                    Exibindo {firstTransactionOnPage}–{lastTransactionOnPage}{' '}
                    de {filteredTransactions.length} transações
                  </p>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Página anterior"
                      onClick={() => setCurrentPage(activePage - 1)}
                      disabled={activePage <= 1}
                    >
                      <ChevronLeft aria-hidden="true" />
                      Anterior
                    </Button>
                    <span
                      aria-live="polite"
                      className="text-sm font-medium tabular-nums"
                    >
                      Página {activePage} de {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Próxima página"
                      onClick={() => setCurrentPage(activePage + 1)}
                      disabled={activePage >= totalPages}
                    >
                      Próxima
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {(isCreateOpen || editingTransaction) && (
        <TransactionForm
          key={editingTransaction?.id ?? 'new-transaction'}
          categories={categories}
          transaction={editingTransaction ?? undefined}
          open
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingTransaction(null);
            }
          }}
        />
      )}

      <Dialog.Root
        open={Boolean(deletingTransaction)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingTransaction(null);
            setDeleteError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl outline-none">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Dialog.Title className="text-xl font-semibold">
                  Excluir transação?
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Tem certeza de que deseja excluir{' '}
                  <span className="font-medium text-foreground">
                    {deletingTransaction
                      ? getTransactionName(deletingTransaction)
                      : ''}
                  </span>
                  ? Esta ação não pode ser desfeita.
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar confirmação"
                onClick={() => {
                  if (!isDeleting) setDeletingTransaction(null);
                }}
                disabled={isDeleting}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            {deleteError && (
              <p
                role="alert"
                className="mb-4 text-sm font-medium text-destructive"
              >
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingTransaction(null)}
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
                {isDeleting ? 'Excluindo...' : 'Excluir transação'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
