import { z } from 'zod';

export const goalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(40, 'O nome deve ter no máximo 40 caracteres.'),
  target_amount: z.coerce
    .number()
    .positive('O valor-alvo deve ser maior que zero.')
    .max(9999999999.99, 'O valor informado é muito alto.'),
  target_date: z
    .union([z.iso.date(), z.literal('')])
    .transform((date) => date || null),
});

export type GoalInput = z.infer<typeof goalSchema>;
