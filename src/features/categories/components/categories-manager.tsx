'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getSafeUserErrorMessage } from '@/lib/safe-user-error';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Category, CategoryType } from '../types';
import {
  countAssociatedTransactions,
  deleteCategory,
} from '../services/category-service';
import { CategoryList } from './category-list';
import { CategoryDeleteDialog } from './category-delete-dialog';
import { CategoryForm } from './category-form';

type CategoriesManagerProps = {
  categories: Category[];
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [activeType, setActiveType] = useState<CategoryType>('expense');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [associatedCount, setAssociatedCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const visibleCategories = categories.filter(
    (category) => category.category_type === activeType,
  );

  const handleOpenDelete = async (category: Category) => {
    setDeleteError(null);
    setDeletingCategory(category);
    setIsLoadingCount(true);
    setAssociatedCount(null);

    try {
      const supabase = createClient();
      const count = await countAssociatedTransactions(supabase, category.id);
      setAssociatedCount(count);
    } catch {
      setAssociatedCount(0);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Você precisa estar autenticado para excluir uma categoria.');
      }

      await deleteCategory(supabase, deletingCategory.id, userData.user.id);

      setDeletingCategory(null);
      setAssociatedCount(null);
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(
        getSafeUserErrorMessage(
          err,
          'Não foi possível excluir a categoria.',
          [
            'Você precisa estar autenticado para excluir uma categoria.',
            'Não é permitido excluir uma categoria que possua orçamento ativo vinculado.',
            'Não é permitido excluir uma categoria que possua transações recorrentes vinculadas.',
            'Não é permitido excluir esta categoria pois outros registros dependem dela.',
          ],
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
          <p className="text-sm font-medium text-primary">Organização financeira</p>
          <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Organize suas receitas e despesas com categorias personalizadas.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Nova Categoria
        </Button>
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Suas categorias</CardTitle>
              <CardDescription className="mt-1">
                Selecione o tipo para visualizar e gerenciar suas categorias.
              </CardDescription>
            </div>
            <div
              role="group"
              aria-label="Filtrar categorias por tipo"
              className="grid w-full grid-cols-2 gap-1 rounded-lg border bg-muted p-1 sm:w-auto"
            >
              <button
                type="button"
                aria-pressed={activeType === 'expense'}
                onClick={() => setActiveType('expense')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeType === 'expense'
                    ? 'bg-background text-red-600 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <ArrowDownRight aria-hidden="true" className="size-4" />
                Despesas
                <span className="text-xs opacity-70">
                  {categories.filter((c) => c.category_type === 'expense').length}
                </span>
              </button>
              <button
                type="button"
                aria-pressed={activeType === 'income'}
                onClick={() => setActiveType('income')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeType === 'income'
                    ? 'bg-background text-green-600 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <ArrowUpRight aria-hidden="true" className="size-4" />
                Receitas
                <span className="text-xs opacity-70">
                  {categories.filter((c) => c.category_type === 'income').length}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <CategoryList
            categories={visibleCategories}
            activeType={activeType}
            onOpenCreate={() => setIsCreateOpen(true)}
            onEdit={setEditingCategory}
            onDelete={handleOpenDelete}
          />
        </CardContent>
      </Card>

      {(isCreateOpen || editingCategory) && (
        <CategoryForm
          category={editingCategory ?? undefined}
          initialCategoryType={activeType}
          open
          onOpenChange={(open) => {
            if (!open && editingCategory) {
              setEditingCategory(null);
            } else if (!open) {
              setIsCreateOpen(false);
            }
          }}
        />
      )}

      <CategoryDeleteDialog
        category={deletingCategory}
        isOpen={Boolean(deletingCategory)}
        isLoadingCount={isLoadingCount}
        isDeleting={isDeleting}
        associatedTransactionsCount={associatedCount}
        error={deleteError}
        onClose={() => {
          setDeletingCategory(null);
          setDeleteError(null);
          setAssociatedCount(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
