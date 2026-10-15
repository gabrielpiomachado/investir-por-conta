const localizedErrors: { patterns: string[]; message: string }[] = [
  {
    patterns: ['invalid login credentials', 'invalid_credentials'],
    message: 'E-mail ou senha incorretos.',
  },
  {
    patterns: ['user already registered', 'user already exists'],
    message: 'Já existe uma conta cadastrada com este e-mail.',
  },
  {
    patterns: [
      'password should be at least',
      'password is too weak',
      'weak_password',
    ],
    message: 'A senha não atende aos requisitos mínimos de segurança.',
  },
  {
    patterns: ['invalid email', 'email address is invalid'],
    message: 'Informe um endereço de e-mail válido.',
  },
  {
    patterns: ['email not confirmed'],
    message: 'Confirme seu e-mail antes de entrar.',
  },
  {
    patterns: ['email rate limit exceeded', 'rate limit exceeded', 'too many requests'],
    message: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  },
  {
    patterns: [
      'otp_expired',
      'token has expired',
      'expired token',
      'token is expired',
      'email link is invalid or has expired',
      'invalid token',
    ],
    message: 'Este link expirou. Solicite um novo e tente novamente.',
  },
  {
    patterns: ['missing code'],
    message: 'O código de confirmação não foi informado.',
  },
  {
    patterns: ['no token hash or type'],
    message: 'O link de confirmação está incompleto ou inválido.',
  },
];

export function getAuthErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : null;

  if (!message) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  const normalizedMessage = message.toLowerCase();
  const localizedError = localizedErrors.find(({ patterns }) =>
    patterns.some((pattern) => normalizedMessage.includes(pattern)),
  );

  return (
    localizedError?.message ??
    'Não foi possível concluir a solicitação. Tente novamente.'
  );
}
