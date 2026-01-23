import { z } from "zod";

export const InputSchema = z.object({
  zip: z.string().min(5).max(10).optional(),
  address: z.string().max(200).optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

export type FormInput = {
  zip?: string;
  address?: string;
  lat?: number;
  lon?: number;
};
