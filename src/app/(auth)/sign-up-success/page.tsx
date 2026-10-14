import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Cadastro realizado!
              </CardTitle>
              <CardDescription>Confirme seu e-mail para ativar sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enviamos uma mensagem para o seu e-mail. Acesse o link de
                confirmação para ativar sua conta e entrar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
