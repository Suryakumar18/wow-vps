import type { Model } from "mongoose";

/*
 * Shared writer for the "singleton config" collections (BestSellers, ShopByAge,
 * ShopByCategory, BentoGrid, Characters, Ralleyz). Each of those collections holds
 * a single document whose only meaningful field is an array (items / characters).
 *
 * The old routes did `Object.assign(config, body); config.save()`, which:
 *   1. let the client overwrite server-managed fields (createdAt/updatedAt/_id), and
 *   2. re-validated the WHOLE document on save — so one corrupt field (e.g. a
 *      createdAt that got stored as `{}`) made every subsequent save fail with a 500.
 *
 * This helper instead strips fields the client must not control, repairs any
 * legacy documents whose timestamps were corrupted, and writes with an atomic
 * `$set` (which only validates the fields being changed).
 */

const OMIT = new Set(["_id", "__v", "createdAt", "updatedAt"]);

export async function updateSingletonConfig<T>(model: Model<T>, body: unknown) {
  const safe: Record<string, unknown> = {};
  if (body && typeof body === "object") {
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (!OMIT.has(key)) safe[key] = value;
    }
  }

  // Repair any legacy docs whose timestamps were corrupted to `{}` (BSON "object"
  // instead of "date") by earlier writes. Runs on the raw collection so it bypasses
  // Mongoose casting/validation, and is a no-op once the data is clean.
  await model.collection.updateMany(
    { $or: [{ createdAt: { $type: "object" } }, { updatedAt: { $type: "object" } }] },
    { $set: { createdAt: new Date(), updatedAt: new Date() } }
  );

  const doc = await model.findOneAndUpdate(
    {},
    { $set: safe },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return doc;
}
