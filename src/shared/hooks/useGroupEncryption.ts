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

      // Check if there's already a group key for this group (shared by all members)
      const { data: existingGroupKey, error: fetchGroupKeyError } =
        await supabase
          .from("group_encryption_keys")
          .select("*")
          .eq("group_id", groupId)
          .limit(1)
          .single();

      if (fetchGroupKeyError && fetchGroupKeyError.code !== "PGRST116") {
        console.error(
          "[Encryption] Error fetching group key:",
          fetchGroupKeyError
        );
        throw fetchGroupKeyError;
      }

      if (existingGroupKey) {
        // Use the existing group key
        setGroupKey(existingGroupKey.encryption_key);
        setKeyFingerprint(existingGroupKey.key_fingerprint);
        console.log(
          "[Encryption] Loaded existing group key:",
          existingGroupKey.encryption_key
        );
        return existingGroupKey.encryption_key;
      }

      // Check if user is a member of the group before creating a key
      const { data: membership, error: membershipError } = await supabase
        .from("group_memberships")
        .select("status")
        .eq("group_id", groupId)
        .eq("user_id", userRow.id)
        .eq("status", "accepted")
        .single();

      if (membershipError || !membership) {
        console.error(
          "[Encryption] User is not a member of this group:",
          membershipError
        );
        throw new Error("Not a member of this group");
      }

      // Generate new shared key for this group
      const newKeyData = generateGroupKey();
      const fingerprint = generateKeyFingerprint(newKeyData.key);

      // Store the shared group key
      const insertPayload = {
        group_id: groupId,
        user_id: userRow.id, // The user who creates the key
        encryption_key: newKeyData.key,
        key_fingerprint: fingerprint,
        created_at: newKeyData.createdAt,
      };

      console.log("[Encryption] Attempting to insert new group key:", {
        groupId,
        userId: userRow.id,
        hasKey: !!newKeyData.key,
        hasFingerprint: !!fingerprint,
      });

      const { data: insertData, error: insertError } = await supabase
        .from("group_encryption_keys")
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error("[Encryption] Error inserting new group key:", {
          error: insertError,
          payload: insertPayload,
          errorCode: insertError.code,
          errorMessage: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        throw insertError;
      }

      console.log(
        "[Encryption] Successfully inserted new group key:",
        insertData
      );

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
