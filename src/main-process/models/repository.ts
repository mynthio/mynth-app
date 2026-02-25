import { asc, eq } from "drizzle-orm";

import { getAppDatabase } from "../db/database";
import { models } from "../db/schema";

export type ModelTableRow = typeof models.$inferSelect;
export type ModelLifecycleStatus = "active" | "deprecated" | "removed";
const MODEL_MUTABLE_FIELDS = ["isEnabled", "displayName"] as const;
type ModelMutableField = (typeof MODEL_MUTABLE_FIELDS)[number];

export interface SyncProviderModelInput {
  providerModelId: string;
  canonicalModelId: string;
  displayName: string | null;
  metadata: Record<string, unknown>;
  lifecycleStatus: Exclude<ModelLifecycleStatus, "removed">;
}

export type UpdateModelInput = Partial<Pick<ModelTableRow, ModelMutableField>>;

export function listModelsByProviderId(providerId: string): ModelTableRow[] {
  return getAppDatabase()
    .select()
    .from(models)
    .where(eq(models.providerId, providerId))
    .orderBy(asc(models.providerModelId))
    .all();
}

export function updateModel(modelId: string, input: UpdateModelInput): ModelTableRow | undefined {
  const db = getAppDatabase();

  const existing = db.select().from(models).where(eq(models.id, modelId)).get();
  if (!existing) {
    return undefined;
  }

  const updates = pickDefinedModelFields(input, MODEL_MUTABLE_FIELDS);
  if (Object.keys(updates).length === 0) {
    return existing;
  }

  db.update(models)
    .set({
      ...updates,
      updatedAt: Date.now(),
    })
    .where(eq(models.id, modelId))
    .run();

  return db.select().from(models).where(eq(models.id, modelId)).get();
}

export function syncProviderModels(
  providerId: string,
  syncedModels: SyncProviderModelInput[],
): { inserted: number; updated: number; markedRemoved: number } {
  return getAppDatabase().transaction((tx) => {
    const existingRows = tx.select().from(models).where(eq(models.providerId, providerId)).all();
    const existingByProviderModelId = new Map(
      existingRows.map((row) => [row.providerModelId, row] as const),
    );
    const seenProviderModelIds = new Set<string>();

    let inserted = 0;
    let updated = 0;
    let markedRemoved = 0;

    for (const syncedModel of syncedModels) {
      seenProviderModelIds.add(syncedModel.providerModelId);

      const existing = existingByProviderModelId.get(syncedModel.providerModelId);
      const serializedMetadata = JSON.stringify(syncedModel.metadata);

      if (!existing) {
        tx.insert(models)
          .values({
            id: buildModelId(providerId, syncedModel.providerModelId),
            providerId,
            providerModelId: syncedModel.providerModelId,
            canonicalModelId: syncedModel.canonicalModelId,
            displayName: syncedModel.displayName,
            metadata: serializedMetadata,
            lifecycleStatus: syncedModel.lifecycleStatus,
          })
          .run();
        inserted += 1;
        continue;
      }

      if (
        existing.canonicalModelId === syncedModel.canonicalModelId &&
        (existing.displayName ?? null) === (syncedModel.displayName ?? null) &&
        existing.metadata === serializedMetadata &&
        existing.lifecycleStatus === syncedModel.lifecycleStatus
      ) {
        continue;
      }

      tx.update(models)
        .set({
          canonicalModelId: syncedModel.canonicalModelId,
          displayName: syncedModel.displayName,
          metadata: serializedMetadata,
          lifecycleStatus: syncedModel.lifecycleStatus,
          updatedAt: Date.now(),
        })
        .where(eq(models.id, existing.id))
        .run();
      updated += 1;
    }

    for (const existing of existingRows) {
      if (seenProviderModelIds.has(existing.providerModelId)) {
        continue;
      }

      if (existing.lifecycleStatus === "removed") {
        continue;
      }

      tx.update(models)
        .set({
          lifecycleStatus: "removed",
          updatedAt: Date.now(),
        })
        .where(eq(models.id, existing.id))
        .run();
      markedRemoved += 1;
    }

    return { inserted, updated, markedRemoved };
  });
}

function buildModelId(providerId: string, providerModelId: string): string {
  return `${providerId}:${providerModelId}`;
}

function pickDefinedModelFields<const TKeys extends readonly ModelMutableField[]>(
  input: Partial<Pick<ModelTableRow, TKeys[number]>>,
  keys: TKeys,
): Partial<Pick<ModelTableRow, TKeys[number]>> {
  const updates: Partial<Pick<ModelTableRow, TKeys[number]>> = {};

  for (const key of keys) {
    if (input[key] !== undefined) {
      updates[key] = input[key];
    }
  }

  return updates;
}
