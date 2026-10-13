import { z } from 'zod';

export const budgetSchema = z.object({
  category_id: z.uuid('Selecione uma categoria válida.'),
  period: z.enum(['monthly', 'annual']),
  amount: z.coerce
    .number()
    .positive('O limite deve ser maior que zero.')
    .max(9999999999.99, 'O limite informado é muito alto.'),
  alert_thresholds: z
    .array(z.number().int().min(1).max(100))
    .refine(
      (thresholds) => new Set(thresholds).size === thresholds.length,
      'Os percentuais de alerta não podem se repetir.',
    ),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
