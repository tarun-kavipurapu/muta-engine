import { z } from "zod";

export const addItemOrUpdateItemQuantityValidator = z.object({
  quantity: z.number().int().positive().optional(),
});
