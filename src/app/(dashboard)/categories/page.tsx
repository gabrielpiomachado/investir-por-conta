import { createClient } from '@/lib/supabase/server';
import { CategoryForm } from '@/features/categories/components/category-form';

function formatCategoryType(type: 'income' | 'expense') {
  return type === 'income' ? 'Receita' : 'Despesa';
}

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Faça login para visualizar suas categorias.
        </p>
      </div>
    );
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, category_type')
    .eq('user_id', user.id)
    .order('category_type', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <p className="mt-4 text-sm text-red-500">
          Não foi possível carregar suas categorias.
        </p>
      </div>
    );
  }

  const incomeCategories =
    categories?.filter((category) => category.category_type === 'income') ?? [];
  const expenseCategories =
    categories?.filter((category) => category.category_type === 'expense') ??
    [];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Categorias</h1>
      </div>

      <CategoryForm />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-green-600">Receitas</h2>

          {incomeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria de receita cadastrada.
            </p>
          ) : (
            <ul className="space-y-2">
              {incomeCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span>{category.name}</span>
                  <span className="text-xs uppercase text-green-600">
                    {formatCategoryType(category.category_type)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-red-600">Despesas</h2>

          {expenseCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria de despesa cadastrada.
            </p>
          ) : (
            <ul className="space-y-2">
              {expenseCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span>{category.name}</span>
                  <span className="text-xs uppercase text-red-600">
                    {formatCategoryType(category.category_type)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
