import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';
import { createRequestId, logServerEvent } from '@/lib/server-logger';

const PAGE_SIZE = 1000;

type ExportTable =
  | 'categories'
  | 'transactions'
  | 'recurring_transactions'
  | 'budgets'
  | 'goals'
  | 'goal_contributions';

async function loadAllRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: ExportTable,
  userId: string,
) {
  const rows: Record<string, unknown>[] = [];

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(start, start + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = (data ??
      []) as unknown as Database['public']['Tables'][ExportTable]['Row'][];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

export async function GET() {
  const requestId = createRequestId();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    logServerEvent('profile.export', 'rejected', requestId);
    return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const userId = data.user.id;
    const [
      categories,
      transactions,
      recurringTransactions,
      budgets,
      goals,
      goalContributions,
    ] = await Promise.all([
      loadAllRows(supabase, 'categories', userId),
      loadAllRows(supabase, 'transactions', userId),
      loadAllRows(supabase, 'recurring_transactions', userId),
      loadAllRows(supabase, 'budgets', userId),
      loadAllRows(supabase, 'goals', userId),
      loadAllRows(supabase, 'goal_contributions', userId),
    ]);

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      account: {
        id: data.user.id,
        email: data.user.email ?? null,
        createdAt: data.user.created_at,
      },
      categories,
      transactions,
      recurringTransactions,
      budgets,
      goals,
      goalContributions,
    };

    const date = new Date().toISOString().slice(0, 10);
    logServerEvent('profile.export', 'success', requestId);
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="investir-por-conta-dados-${date}.json"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    logServerEvent('profile.export', 'failure', requestId);
    return Response.json(
      { error: 'Não foi possível preparar a exportação dos seus dados.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
