import { z } from "zod";
import { logger } from "@/lib/api/logger";
import { 
  GoSoloMatchSchema, 
  GoGroupMatchSchema, 
  GoSoloResponseSchema, 
  GoGroupResponseSchema, 
  GoErrorResponseSchema 
} from "./matchSchemas";

/**
 * 🛡️ Match Service Validator (v2 Hardened)
 */
export function validateGoMatchResponse(data: any): boolean {
  if (!data) return false;
  
  // Rule: Must be wrapped in { success, matches/groups }
  const soloRes = GoSoloResponseSchema.safeParse(data);
  if (soloRes.success) return true;

  const groupRes = GoGroupResponseSchema.safeParse(data);
  if (groupRes.success) return true;

  const errorRes = GoErrorResponseSchema.safeParse(data);
  if (errorRes.success) return true;

  return false;
}

/**
 * ⚡ Safe Batch Validation with Adaptive Threshold
 */
export function safeBatchValidate<T>(
  items: any[], 
  schema: z.ZodSchema<T>,
  requestId: string
): { 
  validItems: T[], 
  droppedCount: number, 
  state: 'clean' | 'filtered' | 'degraded'
} {
  const totalCount = items.length;
  if (totalCount === 0) return { validItems: [], droppedCount: 0, state: 'clean' };

  const validItems: T[] = [];
  let droppedCount = 0;

  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) {
      validItems.push(result.data);
    } else {
      droppedCount++;
      // Safe Logging: Log reasons only, no raw PII
      logger.warn(requestId, "Contract violation on item", {
        reason: result.error.flatten().fieldErrors,
        droppedIndex: totalCount - items.indexOf(item) - 1 // approximate
      });
    }
  }

  const validCount = validItems.length;
  const validityRatio = validCount / totalCount;

  // 🏛️ ADAPTIVE THRESHOLD LOGIC
  // In production or test environments, we enforce strict thresholds (minimum 30% validity ratio).
  // In local development, we are more relaxed (only degrade if we have zero valid matches).
  const isProdOrTest = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test";
  const isDegraded = isProdOrTest
    ? validityRatio < 0.3
    : validCount === 0;

  return {
    validItems,
    droppedCount,
    state: isDegraded ? 'degraded' : (droppedCount > 0 ? 'filtered' : 'clean')
  };
}
