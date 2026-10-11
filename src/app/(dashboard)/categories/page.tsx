import { createClient } from '@/lib/supabase/server';
import { CategoriesManager } from '@/features/categories/components/categories-manager';

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

  return <CategoriesManager categories={categories ?? []} />;
}
