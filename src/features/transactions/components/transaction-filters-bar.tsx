'use client';

import { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
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
import type { Category } from '@/features/categories';
import type { TypeFilter } from '../types';
import {
  formatFilterDate,
  formatMonth,
  shiftMonth,
} from '../lib/transaction-formatters';

const selectClassName =
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

type TransactionFiltersBarProps = {
  categories: Category[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  type: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
};

export function TransactionFiltersBar({
  categories,
  selectedMonth,
  onMonthChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  categoryId,
  onCategoryChange,
  type,
  onTypeChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: TransactionFiltersBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterCategories =
    type === 'all'
      ? categories
      : categories.filter((category) => category.category_type === type);

  const hasCustomPeriod = Boolean(startDate || endDate);
  const hasActiveBadges = hasCustomPeriod || categoryId !== 'all' || type !== 'all';

  return (
    <div className="space-y-4">
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
                  onChange={(event) => onStartDateChange(event.target.value)}
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
                  onChange={(event) => onEndDateChange(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="filter-category">Categoria</Label>
              <select
                id="filter-category"
                className={selectClassName}
                value={categoryId}
                onChange={(event) => onCategoryChange(event.target.value)}
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
                onChange={(event) => onTypeChange(event.target.value as TypeFilter)}
              >
                <option value="all">Todos</option>
                <option value="expense">Despesas</option>
                <option value="income">Receitas</option>
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onClearFilters}
              className="w-full lg:w-auto"
            >
              Limpar filtros
            </Button>
          </CardContent>
        )}
      </Card>

      <section
        aria-label="Período e filtros aplicados"
        className="flex flex-col items-center gap-3"
      >
        {!hasCustomPeriod && (
          <div className="flex w-full items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Mês anterior"
              onClick={() => onMonthChange(shiftMonth(selectedMonth, -1))}
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
              onClick={() => onMonthChange(shiftMonth(selectedMonth, 1))}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}

        {hasActiveBadges && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasCustomPeriod && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onStartDateChange('');
                  onEndDateChange('');
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
                onClick={() => onCategoryChange('all')}
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
                onClick={() => onTypeChange('all')}
                aria-label="Remover filtro de tipo"
              >
                <X aria-hidden="true" />
                {type === 'income' ? 'Receitas' : 'Despesas'}
              </Button>
            )}
          </div>
        )}
      </section>

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
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
