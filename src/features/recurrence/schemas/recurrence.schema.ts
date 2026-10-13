import { z } from 'zod';

export const recurrenceSchema = z.object({
  transaction_type: z.enum(['income', 'expense']),
  amount: z.coerce
    .number()
    .positive('O valor deve ser maior que zero.')
    .max(9999999999.99, 'O valor informado é muito alto.'),
  category_id: z.uuid('Selecione uma categoria válida.'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  start_date: z.iso.date('Informe uma data válida.'),
  description: z
    .string()
    .trim()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .transform((description) => description || null),
});

export type RecurrenceInput = z.infer<typeof recurrenceSchema>;
