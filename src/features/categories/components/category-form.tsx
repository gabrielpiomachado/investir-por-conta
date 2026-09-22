'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { categorySchema } from '../schemas/category.schema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function CategoryForm() {
  const [name, setName] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validation = categorySchema.safeParse({
      name,
      category_type: categoryType,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? 'Dados inválidos.';
      setError(firstError);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error('Você precisa estar autenticado para criar uma categoria.');
      }

      const { error: insertError } = await supabase.from('categories').insert({
        name: validation.data.name,
        category_type: validation.data.category_type,
        user_id: userData.user.id,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Você já possui uma categoria com este nome.');
        }
        throw new Error(insertError.message);
      }

      setName('');
      setSuccess('Categoria criada com sucesso!');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar categoria.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Nova Categoria</CardTitle>
        <CardDescription>
          Adicione uma nova categoria de receita ou despesa para organizar suas finanças.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input
                id="category-name"
                placeholder="Ex: Consultoria, Supermercado"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                  if (success) setSuccess(null);
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipo</Label>
              <div
                role="group"
                aria-label="Tipo de categoria"
                className="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCategoryType('income');
                    if (success) setSuccess(null);
                  }}
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
                  onClick={() => {
                    setCategoryType('expense');
                    if (success) setSuccess(null);
                  }}
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
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {success && <p className="text-sm font-medium text-green-600">{success}</p>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adicionando...' : 'Adicionar categoria'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
