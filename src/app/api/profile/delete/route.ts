import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { serverEnv } from '@/lib/env.server';
import { createRequestId, logServerEvent } from '@/lib/server-logger';

const deletionRequestSchema = z.object({
  password: z.string().min(1),
});

const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  const requestId = createRequestId();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    logServerEvent('profile.delete', 'rejected', requestId);
    return Response.json(
      { error: 'Não autenticado.' },
      { status: 401, headers: noStoreHeaders },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    logServerEvent('profile.delete', 'rejected', requestId);
    return Response.json(
      { error: 'Solicitação inválida.' },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsedRequest = deletionRequestSchema.safeParse(requestBody);

  if (!parsedRequest.success) {
    logServerEvent('profile.delete', 'rejected', requestId);
    return Response.json(
      { error: 'Informe sua senha atual para confirmar a exclusão.' },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const passwordVerifier = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  const { data: verifiedData, error: verificationError } =
    await passwordVerifier.auth.signInWithPassword({
      email: data.user.email,
      password: parsedRequest.data.password,
    });

  if (verificationError) {
    const normalizedError = verificationError.message.toLowerCase();

    if (normalizedError.includes('rate limit')) {
      logServerEvent('profile.delete', 'rejected', requestId);
      return Response.json(
        { error: 'Muitas tentativas. Aguarde um pouco e tente novamente.' },
        { status: 429, headers: noStoreHeaders },
      );
    }

    if (
      normalizedError.includes('invalid login credentials') ||
      normalizedError.includes('invalid_credentials')
    ) {
      logServerEvent('profile.delete', 'rejected', requestId);
      return Response.json(
        { error: 'A senha informada está incorreta.' },
        { status: 401, headers: noStoreHeaders },
      );
    }

    logServerEvent('profile.delete', 'failure', requestId);
    return Response.json(
      { error: 'Não foi possível validar sua senha. Tente novamente.' },
      { status: 502, headers: noStoreHeaders },
    );
  }

  if (verifiedData.user?.id !== data.user.id) {
    logServerEvent('profile.delete', 'rejected', requestId);
    return Response.json(
      { error: 'A senha informada está incorreta.' },
      { status: 401, headers: noStoreHeaders },
    );
  }

  const adminClient = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  const { error: deletionError } = await adminClient.auth.admin.deleteUser(
    data.user.id,
  );

  if (deletionError) {
    logServerEvent('profile.delete', 'failure', requestId);
    return Response.json(
      { error: 'Não foi possível excluir sua conta. Tente novamente.' },
      { status: 500, headers: noStoreHeaders },
    );
  }

  logServerEvent('profile.delete', 'success', requestId);
  return Response.json(
    { success: true },
    { headers: noStoreHeaders },
  );
}
