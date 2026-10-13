import { z } from 'zod';

export const goalContributionSchema = z.object({
  amount: z.coerce
    .number()
    .positive('O valor do aporte deve ser maior que zero.')
    .max(9999999999.99, 'O valor informado é muito alto.'),
  description: z
    .string()
    .trim()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .transform((description) => description || null),
});

export type GoalContributionInput = z.infer<typeof goalContributionSchema>;
