import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(40, 'O nome deve ter no máximo 40 caracteres.'),
  category_type: z.enum(['income', 'expense']),
});

export type CategoryInput = z.infer<typeof categorySchema>;
