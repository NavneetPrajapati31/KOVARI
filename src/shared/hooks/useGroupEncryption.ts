import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import {
  generateGroupKey,
  encryptGroupMessage,
  decryptGroupMessage,
  generateKeyFingerprint,
  type EncryptedMessage,
  type GroupKey,
} from "@/shared/utils/encryption";

export interface GroupEncryptionData {
  groupId: string;
  key: string;
  fingerprint: string;
  createdAt: string;
}

export const useGroupEncryption = (groupId: string) => {
  const { user } = useUser();
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [keyFingerprint, setKeyFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get or create group encryption key
  const getGroupKey = useCallback(async () => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Get user's internal ID first
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userRow) {
        console.error("[Encryption] User not found in database:", userError);
        throw new Error("User not found in database");
      }

      // Check if we have a stored key for this group
      const { data: existingKey, error: fetchError } = await supabase
        .from("group_encryption_keys")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userRow.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[Encryption] Error fetching group key:", fetchError);
        throw fetchError;
      }

      if (existingKey) {
        setGroupKey(existingKey.encryption_key);
        setKeyFingerprint(existingKey.key_fingerprint);
        console.log(
          "[Encryption] Loaded group key:",
          existingKey.encryption_key
        );
        return existingKey.encryption_key;
      }

      // Generate new key for this group
      const newKeyData = generateGroupKey();
      const fingerprint = generateKeyFingerprint(newKeyData.key);

      // Store the key
      const { error: insertError } = await supabase
        .from("group_encryption_keys")
        .insert({
          group_id: groupId,
          user_id: userRow.id,
          encryption_key: newKeyData.key,
          key_fingerprint: fingerprint,
          created_at: newKeyData.createdAt,
        });

      if (insertError) {
        console.error(
          "[Encryption] Error inserting new group key:",
          insertError
        );
        throw insertError;
      }

      setGroupKey(newKeyData.key);
      setKeyFingerprint(fingerprint);
      console.log(
        "[Encryption] Generated and stored new group key:",
        newKeyData.key
      );
      return newKeyData.key;
    } catch (err) {
      console.error("Error getting group key:", err);
      console.error("Error details:", {
        groupId,
        userId: user?.id,
        error: err instanceof Error ? err.message : "Unknown error",
        errorObject: err,
      });
      setError(
        err instanceof Error ? err.message : "Failed to get encryption key"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  // Encrypt a message
  const encryptMessage = useCallback(
    async (message: string): Promise<EncryptedMessage | null> => {
      const key = await getGroupKey();
      if (!key) {
        setError("No encryption key available");
        return null;
      }

      try {
        return encryptGroupMessage(message, key);
      } catch (err) {
        console.error("Error encrypting message:", err);
        setError("Failed to encrypt message");
        return null;
      }
    },
    [getGroupKey]
  );

  // Decrypt a message
  const decryptMessage = useCallback(
    (encryptedMessage: EncryptedMessage): string | null => {
      if (!groupKey) {
        setError("No encryption key available");
        return null;
      }

      try {
        return decryptGroupMessage(encryptedMessage, groupKey);
      } catch (err) {
        console.error("Error decrypting message:", err);
        setError("Failed to decrypt message");
        return null;
      }
    },
    [groupKey]
  );

  // Initialize encryption
  useEffect(() => {
    if (user && groupId) {
      getGroupKey();
    }
  }, [getGroupKey, user, groupId]);

  return {
    groupKey,
    keyFingerprint,
    loading,
    error,
    encryptMessage,
    decryptMessage,
    refreshKey: getGroupKey,
    isEncryptionAvailable: !loading && !error && !!groupKey,
  };
};
