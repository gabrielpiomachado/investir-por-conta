'use client';

import { useState } from 'react';
import { ArrowDownToLine, KeyRound, ShieldAlert } from 'lucide-react';
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
import { createClient } from '@/lib/supabase/client';

type ProfileSettingsProps = {
  account: {
    id: string;
    email: string;
    createdAt: string;
  };
};

export function ProfileSettings({ account }: ProfileSettingsProps) {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePasswordUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (password !== passwordConfirmation) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error('Não foi possível alterar sua senha.');
      }

      setPassword('');
      setPasswordConfirmation('');
      setPasswordMessage('Senha alterada com sucesso.');
    } catch {
      setPasswordError('Não foi possível alterar sua senha.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch('/api/profile/export');

      if (!response.ok) {
        throw new Error(
          'Não foi possível exportar seus dados. Tente novamente.',
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `investir-por-conta-dados-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Não foi possível exportar seus dados.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Dados da conta</CardTitle>
          <CardDescription>
            Informações associadas ao seu acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">E-mail</p>
            <p className="break-all font-medium">{account.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Conta criada em</p>
            <p className="font-medium">
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                new Date(account.createdAt),
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound aria-hidden="true" className="size-4" />
            Alterar senha
          </CardTitle>
          <CardDescription>
            Escolha uma nova senha para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordUpdate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  autoComplete="new-password"
                  id="new-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  autoComplete="new-password"
                  id="confirm-password"
                  minLength={8}
                  onChange={(event) =>
                    setPasswordConfirmation(event.target.value)
                  }
                  required
                  type="password"
                  value={passwordConfirmation}
                />
              </div>
            </div>
            {passwordError && (
              <p className="text-sm text-destructive" role="alert">
                {passwordError}
              </p>
            )}
            {passwordMessage && (
              <p className="text-sm text-emerald-700" role="status">
                {passwordMessage}
              </p>
            )}
            <Button disabled={isSavingPassword} type="submit">
              {isSavingPassword ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar meus dados</CardTitle>
          <CardDescription>
            Baixe uma cópia JSON dos dados vinculados à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {exportError && (
            <p className="text-sm text-destructive" role="alert">
              {exportError}
            </p>
          )}
          <Button disabled={isExporting} onClick={handleExport} type="button">
            <ArrowDownToLine aria-hidden="true" />
            {isExporting ? 'Preparando arquivo...' : 'Baixar meus dados'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert aria-hidden="true" className="size-4" />
            Excluir minha conta
          </CardTitle>
          <CardDescription>
            A exclusão remove permanentemente seus dados e não pode ser
            desfeita.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A exclusão ficará disponível quando o envio da confirmação por
            e-mail estiver configurado.
          </p>
          <Button disabled type="button" variant="destructive">
            Excluir conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
