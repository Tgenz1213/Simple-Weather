import { z } from "zod";

/**
 * InputSchema - validates user input for location lookup.
 * - `zip`: 5-10 characters
 * - `address`: up to 200 characters
 * - `lat`/`lon`: optional numeric coordinates
 */
export const InputSchema = z.object({
  zip: z.string().min(5).max(10).optional(),
  address: z.string().max(200).optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

/**
 * FormInput - typed input shape used by UI and API calls.
 */
export type FormInput = {
  zip?: string;
  address?: string;
  lat?: number;
  lon?: number;
};
