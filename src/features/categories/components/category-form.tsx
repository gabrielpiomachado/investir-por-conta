'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { categorySchema } from '../schemas/category.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

export type Category = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'category_type'
>;

type CategoryFormProps = {
  category?: Category;
  initialCategoryType: Category['category_type'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CategoryForm({
  category,
  initialCategoryType,
  open,
  onOpenChange,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [categoryType, setCategoryType] = useState<Category['category_type']>(
    category?.category_type ?? initialCategoryType,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = Boolean(category);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isLoading) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = categorySchema.safeParse({
      name,
      category_type: categoryType,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Você precisa estar autenticado para salvar uma categoria.',
        );
      }

      if (category) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ name: validation.data.name })
          .eq('id', category.id)
          .eq('user_id', userData.user.id)
          .select('id')
          .single();

        if (updateError) {
          if (updateError.code === '23505') {
            throw new Error('Você já possui uma categoria com este nome.');
          }
          throw new Error('Não foi possível salvar a categoria.');
        }
      } else {
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            name: validation.data.name,
            category_type: validation.data.category_type,
            user_id: userData.user.id,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Você já possui uma categoria com este nome.');
          }
          throw new Error('Não foi possível salvar a categoria.');
        }
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a categoria.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold">
                {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {isEditing
                  ? 'Atualize o nome da categoria.'
                  : 'Adicione uma categoria para organizar suas finanças.'}
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar formulário"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input
                id="category-name"
                placeholder="Ex: Consultoria, Supermercado"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                required
              />
            </div>

            {isEditing ? (
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <p className="text-sm text-muted-foreground">
                  {categoryType === 'income' ? 'Receita' : 'Despesa'}
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <div
                  role="group"
                  aria-label="Tipo de categoria"
                  className="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1"
                >
                  <button
                    type="button"
                    aria-pressed={categoryType === 'income'}
                    onClick={() => setCategoryType('income')}
                    disabled={isLoading}
                    className={cn(
                      'rounded-md py-1.5 text-sm font-medium transition-all',
                      categoryType === 'income'
                        ? 'bg-background font-semibold text-green-600 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    aria-pressed={categoryType === 'expense'}
                    onClick={() => setCategoryType('expense')}
                    disabled={isLoading}
                    className={cn(
                      'rounded-md py-1.5 text-sm font-medium transition-all',
                      categoryType === 'expense'
                        ? 'bg-background font-semibold text-red-600 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Despesa
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar alterações'
                    : 'Adicionar categoria'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
