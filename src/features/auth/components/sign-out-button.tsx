'use client';

import type { VariantProps } from 'class-variance-authority';
import { createClient } from '@/lib/supabase/client';
import { Button, type buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SignOutButtonProps = {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  className?: string;
};

export function SignOutButton({
  variant = 'default',
  size = 'default',
  className,
}: SignOutButtonProps = {}) {
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
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={signOut}
        disabled={isSigningOut}
      >
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
