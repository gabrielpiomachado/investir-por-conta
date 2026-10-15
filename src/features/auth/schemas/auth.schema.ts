import { z } from 'zod';

export const signUpSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Informe seu e-mail.')
      .email('Informe um e-mail válido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    repeatPassword: z
      .string()
      .min(1, 'Confirme sua senha.'),
    hasAcceptedLegal: z
      .boolean()
      .refine((accepted) => accepted === true, {
        message:
          'Você precisa aceitar os Termos de Uso e a Política de Privacidade.',
      }),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: 'As senhas não coincidem.',
    path: ['repeatPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(1, 'Informe sua senha.'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .email('Informe um e-mail válido.'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
