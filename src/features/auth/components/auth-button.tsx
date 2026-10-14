import Link from 'next/link';
import { buttonVariants } from '../../../components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './sign-out-button';

export async function AuthButton() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex min-w-0 items-center gap-3 text-xs md:text-sm">
      <span className="max-w-32 truncate text-muted-foreground md:max-w-48">
        Olá, {user.email}
      </span>
      <SignOutButton />
    </div>
  ) : (
    <div className="flex shrink-0 gap-2">
      <Link
        href="/sign-in"
        className={buttonVariants({
          size: 'sm',
          variant: 'outline',
        })}
      >
        Entrar
      </Link>
      <Link
        href="/sign-up"
        className={buttonVariants({
          size: 'sm',
          variant: 'default',
        })}
      >
        Criar conta
      </Link>
    </div>
  );
}
