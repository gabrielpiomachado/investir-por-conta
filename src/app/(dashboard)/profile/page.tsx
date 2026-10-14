import { ProfileSettings } from '@/features/profile/components/profile-settings';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect('/sign-in');
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Configurações da conta
        </p>
        <h1 className="text-3xl font-semibold">Perfil</h1>
      </header>
      <ProfileSettings
        account={{
          id: data.user.id,
          email: data.user.email ?? '',
          createdAt: data.user.created_at,
        }}
      />
    </div>
  );
}
