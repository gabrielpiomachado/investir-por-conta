'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getSafeUserErrorMessage } from '@/lib/safe-user-error';
import type { Category } from '@/features/categories';
import { notifyBudgetActivity } from '@/features/budgets/lib/budget-alerts';
import type { Transaction, TypeFilter } from '../types';
import { deleteTransaction } from '../services/transaction-service';
import { currencyFormatter } from '../lib/transaction-formatters';
import { TransactionSummaryCards } from './transaction-summary-cards';
import { TransactionFiltersBar } from './transaction-filters-bar';
import { TransactionList } from './transaction-list';
import { TransactionPagination } from './transaction-pagination';
import { TransactionDeleteDialog } from './transaction-delete-dialog';
import { TransactionForm } from './transaction-form';

type TransactionsManagerProps = {
  categories: Category[];
  transactions: Transaction[];
};

const TRANSACTIONS_PER_PAGE = 50;

export function TransactionsManager({
  categories,
  transactions,
}: TransactionsManagerProps) {
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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
      const category = categories.find((item) => item.id === transaction.category_id);
      const searchableValues = [
        transaction.description ?? '',
        category?.name ?? '',
        String(transaction.amount),
        transaction.amount.toFixed(2).replace('.', ','),
        currencyFormatter.format(transaction.amount),
      ];
      if (
        !searchableValues.some((val) =>
          val.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
        )
      ) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageTransactions = filteredTransactions.slice(
    (activePage - 1) * TRANSACTIONS_PER_PAGE,
    activePage * TRANSACTIONS_PER_PAGE,
  );
  const firstOnPage =
    filteredTransactions.length === 0 ? 0 : (activePage - 1) * TRANSACTIONS_PER_PAGE + 1;
  const lastOnPage = Math.min(activePage * TRANSACTIONS_PER_PAGE, filteredTransactions.length);

  const totalIncome = filteredTransactions.reduce(
    (sum, t) => (t.transaction_type === 'income' ? sum + t.amount : sum),
    0,
  );
  const totalExpenses = filteredTransactions.reduce(
    (sum, t) => (t.transaction_type === 'expense' ? sum + t.amount : sum),
    0,
  );
  const periodBalance = totalIncome - totalExpenses;

  const changeType = (nextType: TypeFilter) => {
    setCurrentPage(1);
    setType(nextType);
    if (
      categoryId !== 'all' &&
      nextType !== 'all' &&
      categories.find((c) => c.id === categoryId)?.category_type !== nextType
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
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Você precisa estar autenticado para excluir uma transação.');
      }

      await deleteTransaction(supabase, deletingTransaction.id, userData.user.id);

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

      <TransactionFiltersBar
        categories={categories}
        selectedMonth={selectedMonth}
        onMonthChange={(month) => {
          setCurrentPage(1);
          setSelectedMonth(month);
        }}
        startDate={startDate}
        onStartDateChange={(date) => {
          setCurrentPage(1);
          setStartDate(date);
        }}
        endDate={endDate}
        onEndDateChange={(date) => {
          setCurrentPage(1);
          setEndDate(date);
        }}
        categoryId={categoryId}
        onCategoryChange={(id) => {
          setCurrentPage(1);
          setCategoryId(id);
        }}
        type={type}
        onTypeChange={changeType}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setCurrentPage(1);
          setSearchQuery(query);
        }}
        onClearFilters={clearFilters}
      />

      <TransactionSummaryCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        periodBalance={periodBalance}
      />

      <TransactionList
        transactionsCount={transactions.length}
        filteredCount={filteredTransactions.length}
        pageTransactions={pageTransactions}
        categories={categories}
        type={type}
        onOpenCreate={() => setIsCreateOpen(true)}
        onClearFilters={clearFilters}
        onEdit={setEditingTransaction}
        onDelete={(transaction) => {
          setDeleteError(null);
          setDeletingTransaction(transaction);
        }}
      >
        <TransactionPagination
          activePage={activePage}
          totalPages={totalPages}
          firstOnPage={firstOnPage}
          lastOnPage={lastOnPage}
          totalCount={filteredTransactions.length}
          onPageChange={setCurrentPage}
        />
      </TransactionList>

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

      <TransactionDeleteDialog
        transaction={deletingTransaction}
        categories={categories}
        isOpen={Boolean(deletingTransaction)}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          if (!isDeleting) setDeletingTransaction(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
