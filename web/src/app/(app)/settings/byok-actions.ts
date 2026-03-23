"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { userAiCredentials, users } from "@/db/schema/tables";
import {
  encryptByokSecret,
  isByokEncryptionConfigured,
} from "@/lib/crypto/byok-secret";
import {
  BYOK_DEFAULT_MODEL_HINT,
  BYOK_PRESET_IDS,
  resolveEffectiveBaseUrl,
} from "@/lib/ai/byok-presets";
import { getDefaultAiProvider } from "@/lib/ai/provider/env-config";
import { validateOpenAiCompatibleChat } from "@/lib/ai/validate-openai-compatible";
import { getAuthServer } from "@/lib/auth/server";
import { getServerDb } from "@/lib/db/server";

async function requireSessionUser() {
  const { data } = await getAuthServer().getSession();
  if (!data?.user?.email) redirect("/auth/sign-in");
  return data.user;
}

async function getAppUserIdByEmail(email: string) {
  const db = getServerDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.id ?? null;
}

const presetSchema = z.enum(BYOK_PRESET_IDS);

const formSchema = z.object({
  providerPreset: presetSchema,
  model: z.string().trim().min(1).max(256),
  customBaseUrl: z.string().trim().max(4000).optional().default(""),
  apiKey: z.string().optional().default(""),
});

export type ByokActionState = {
  error?: string;
  success?: string;
};

export async function loadByokSettingsPageData() {
  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) return null;

  const db = getServerDb();
  const [row] = await db
    .select()
    .from(userAiCredentials)
    .where(eq(userAiCredentials.userId, appUserId))
    .limit(1);

  const preset = (row?.providerPreset ?? "openai") as z.infer<typeof presetSchema>;
  const modelDefault =
    preset === "custom"
      ? "gpt-4o-mini"
      : (BYOK_DEFAULT_MODEL_HINT[preset] ?? "gpt-4o-mini");
  return {
    preset,
    model: row?.model?.trim() || modelDefault,
    customBaseUrl: row?.customBaseUrl ?? "",
    hasStoredKey: Boolean(row),
    encryptionConfigured: isByokEncryptionConfigured(),
    envHasAi: getDefaultAiProvider() !== null,
  };
}

export async function validateByokKeyAction(
  _prev: ByokActionState,
  formData: FormData,
): Promise<ByokActionState> {
  const parsed = formSchema.safeParse({
    providerPreset: formData.get("providerPreset"),
    model: formData.get("model"),
    customBaseUrl: formData.get("customBaseUrl"),
    apiKey: formData.get("apiKey"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }
  const key = parsed.data.apiKey.trim();
  if (!key) {
    return { error: "Paste an API key to validate." };
  }

  let baseUrl: string;
  try {
    baseUrl = resolveEffectiveBaseUrl(
      parsed.data.providerPreset,
      parsed.data.customBaseUrl || null,
    );
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not resolve API base URL.",
    };
  }

  const result = await validateOpenAiCompatibleChat(
    baseUrl,
    key,
    parsed.data.model,
  );
  if (!result.ok) {
    return { error: result.message };
  }
  return { success: "Key works. You can save it." };
}

export async function saveByokCredentialsAction(
  _prev: ByokActionState,
  formData: FormData,
): Promise<ByokActionState> {
  if (!isByokEncryptionConfigured()) {
    return {
      error:
        "Saving keys requires BYOK_ENCRYPTION_KEY (32+ characters) in the server environment. Ask an admin to set it in Vercel, then try again.",
    };
  }

  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const parsed = formSchema.safeParse({
    providerPreset: formData.get("providerPreset"),
    model: formData.get("model"),
    customBaseUrl: formData.get("customBaseUrl"),
    apiKey: formData.get("apiKey"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const db = getServerDb();
  const [existing] = await db
    .select()
    .from(userAiCredentials)
    .where(eq(userAiCredentials.userId, appUserId))
    .limit(1);

  const keyTrim = parsed.data.apiKey.trim();
  let encrypted: string;
  if (keyTrim) {
    try {
      encrypted = encryptByokSecret(keyTrim);
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? e.message
            : "Could not encrypt key (check BYOK_ENCRYPTION_KEY).",
      };
    }
  } else if (existing) {
    encrypted = existing.encryptedApiKey;
  } else {
    return { error: "API key is required (or save after validating a key)." };
  }

  await db
    .insert(userAiCredentials)
    .values({
      userId: appUserId,
      providerPreset: parsed.data.providerPreset,
      customBaseUrl: parsed.data.customBaseUrl || null,
      model: parsed.data.model,
      encryptedApiKey: encrypted,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userAiCredentials.userId,
      set: {
        providerPreset: parsed.data.providerPreset,
        customBaseUrl: parsed.data.customBaseUrl || null,
        model: parsed.data.model,
        encryptedApiKey: encrypted,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/settings/restormel-keys");
  return { success: "Saved. The writing agent will use this key for your account." };
}

export async function clearByokCredentialsFormAction(
  _prev: ByokActionState,
  _formData: FormData,
): Promise<ByokActionState> {
  void _prev;
  void _formData;
  return clearByokCredentialsAction();
}

export async function clearByokCredentialsAction(): Promise<ByokActionState> {
  const user = await requireSessionUser();
  const appUserId = await getAppUserIdByEmail(user.email ?? "");
  if (!appUserId) {
    return { error: "Local user profile missing; reload and try again." };
  }

  const db = getServerDb();
  await db
    .delete(userAiCredentials)
    .where(eq(userAiCredentials.userId, appUserId));

  revalidatePath("/settings/restormel-keys");
  return { success: "Removed your stored key. The app will use server environment keys if configured." };
}
