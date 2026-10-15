'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import {
  ArrowDownRight,
  ArrowUpRight,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
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
import { CategoryForm, type Category } from './category-form';

type CategoriesManagerProps = {
  categories: Category[];
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [activeType, setActiveType] =
    useState<Category['category_type']>('expense');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const visibleCategories = categories.filter(
    (category) => category.category_type === activeType,
  );
  const isIncome = activeType === 'income';
  const typeLabel = isIncome ? 'Receitas' : 'Despesas';

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para excluir uma categoria.',
        );
      }

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id)
        .eq('user_id', userData.user.id)
        .select('id')
        .single();

      if (deleteError) {
        throw new Error('Não foi possível excluir a categoria.');
      }

      setDeletingCategory(null);
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(
        getSafeUserErrorMessage(
          err,
          'Não foi possível excluir a categoria.',
          ['Você precisa estar autenticado para excluir uma categoria.'],
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
          <p className="text-sm font-medium text-primary">
            Organização financeira
          </p>
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
                  {
                    categories.filter(
                      (category) => category.category_type === 'expense',
                    ).length
                  }
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
                  {
                    categories.filter(
                      (category) => category.category_type === 'income',
                    ).length
                  }
                </span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {visibleCategories.length === 0 ? (
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
              <h2 className="font-medium">
                Nenhuma categoria de {typeLabel.toLowerCase()}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Adicione sua primeira categoria para manter suas finanças
                organizadas.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus aria-hidden="true" />
                Nova Categoria
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCategories.map((category) => (
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
                        onClick={() => setEditingCategory(category)}
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
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingCategory(category);
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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

      <Dialog.Root
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingCategory(null);
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
                  Excluir Categoria
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Tem certeza de que deseja excluir{' '}
                  <span className="font-medium text-foreground">
                    {deletingCategory?.name}
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
                  if (!isDeleting) setDeletingCategory(null);
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
                onClick={() => setDeletingCategory(null)}
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
                {isDeleting ? 'Excluindo...' : 'Excluir categoria'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
