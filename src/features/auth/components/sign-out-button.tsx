'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError('Não foi possível encerrar sua sessão. Tente novamente.');
        return;
      }

      router.push('/sign-in');
    } catch {
      setError('Não foi possível encerrar sua sessão. Tente novamente.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div>
      <Button onClick={signOut} disabled={isSigningOut}>
        {isSigningOut ? 'Saindo...' : 'Sair'}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
