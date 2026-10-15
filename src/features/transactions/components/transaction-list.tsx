'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Category } from '@/features/categories';
import type { Transaction, TypeFilter } from '../types';
import {
  currencyFormatter,
  formatTransactionDate,
} from '../lib/transaction-formatters';

type TransactionListProps = {
  transactionsCount: number;
  filteredCount: number;
  pageTransactions: Transaction[];
  categories: Category[];
  type: TypeFilter;
  onOpenCreate: () => void;
  onClearFilters: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  children?: React.ReactNode;
};

export function TransactionList({
  transactionsCount,
  filteredCount,
  pageTransactions,
  categories,
  type,
  onOpenCreate,
  onClearFilters,
  onEdit,
  onDelete,
  children,
}: TransactionListProps) {
  const getTransactionName = (transaction: Transaction) =>
    transaction.description ||
    categories.find((category) => category.id === transaction.category_id)?.name ||
    'sem descrição';

  const listTitle =
    type === 'all'
      ? 'Todas as transações'
      : type === 'income'
        ? 'Receitas'
        : 'Despesas';

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">{listTitle}</CardTitle>
        <CardDescription>
          {filteredCount}{' '}
          {filteredCount === 1 ? 'transação encontrada' : 'transações encontradas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {filteredCount === 0 ? (
          <div className="m-4 flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center sm:m-6">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FolderOpen aria-hidden="true" className="size-5" />
            </div>
            <h2 className="font-medium">
              {transactionsCount === 0
                ? 'Nenhuma transação registrada'
                : 'Nenhuma transação encontrada'}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {transactionsCount === 0
                ? 'Registre sua primeira receita ou despesa para acompanhar suas finanças.'
                : 'Tente ajustar ou limpar os filtros para ver outras transações.'}
            </p>
            {transactionsCount === 0 ? (
              <Button className="mt-5" onClick={onOpenCreate}>
                <Plus aria-hidden="true" />
                Nova transação
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={onClearFilters}
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
                          <p className="wrap-break-word font-medium">
                            {transaction.description || 'Sem descrição'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatTransactionDate(transaction.transaction_date)}
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar transação ${transactionName}`}
                          onClick={() => onEdit(transaction)}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Excluir transação ${transactionName}`}
                          onClick={() => onDelete(transaction)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-190 border-collapse text-left text-sm">
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
                    <th scope="col" className="px-6 py-3 text-right font-medium">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-right font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageTransactions.map((transaction) => {
                    const isIncome = transaction.transaction_type === 'income';
                    const category = categories.find(
                      (item) => item.id === transaction.category_id,
                    );
                    const transactionName = getTransactionName(transaction);

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
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Editar transação ${transactionName}`}
                              onClick={() => onEdit(transaction)}
                            >
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Excluir transação ${transactionName}`}
                              onClick={() => onDelete(transaction)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}
