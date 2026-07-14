import { z } from 'zod';

export const cardStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const createCardSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  status: cardStatusEnum.optional(),
});

export const updateCardTitleSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
});

export const updateCardStatusSchema = z.object({
  status: cardStatusEnum,
  position: z.number().finite().optional(),
});

export const reorderSchema = z.object({
  cards: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: cardStatusEnum,
        position: z.number().finite(),
      })
    )
    .min(1, 'At least one card is required to reorder'),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid card id'),
});
