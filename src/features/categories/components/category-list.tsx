'use client';

import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Category, CategoryType } from '../types';

type CategoryListProps = {
  categories: Category[];
  activeType: CategoryType;
  onOpenCreate: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryList({
  categories,
  activeType,
  onOpenCreate,
  onEdit,
  onDelete,
}: CategoryListProps) {
  const isIncome = activeType === 'income';
  const typeLabel = isIncome ? 'receitas' : 'despesas';

  if (categories.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
        <div
          className={cn(
            'mb-4 flex size-12 items-center justify-center rounded-full',
            isIncome
              ? 'bg-green-500/10 text-green-600'
              : 'bg-red-500/10 text-red-600',
          )}
        >
          <FolderOpen aria-hidden="true" className="size-5" />
        </div>
        <h2 className="font-medium">Nenhuma categoria de {typeLabel}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Adicione sua primeira categoria para manter suas finanças organizadas.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={onOpenCreate}
        >
          <Plus aria-hidden="true" />
          Nova Categoria
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <li key={category.id}>
          <div className="flex min-h-20 items-center justify-between gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/40">
            <div className="min-w-0">
              <p className="truncate font-medium">{category.name}</p>
              <p
                className={cn(
                  'mt-1 text-xs font-medium',
                  isIncome ? 'text-green-600' : 'text-red-600',
                )}
              >
                {isIncome ? 'Receita' : 'Despesa'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Editar categoria ${category.name}`}
                title="Editar categoria"
                onClick={() => onEdit(category)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Excluir categoria ${category.name}`}
                title="Excluir categoria"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(category)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
