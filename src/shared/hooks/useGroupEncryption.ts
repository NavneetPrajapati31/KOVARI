import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  encryptGroupMessage,
  decryptGroupMessage,
  type EncryptedMessage,
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

      const response = await fetch(`/api/groups/${groupId}/encryption-key`);
      if (!response.ok) {
        if (response.status === 403)
          throw new Error("Not a member of this group");
        if (response.status === 404) throw new Error("Group not found");
        throw new Error("Failed to fetch encryption key");
      }

      const data = (await response.json()) as GroupEncryptionData;
      if (!data?.key) {
        throw new Error("Encryption key unavailable");
      }

      setGroupKey(data.key);
      setKeyFingerprint(data.fingerprint ?? null);
      return data.key;
    } catch (err) {
      console.error("Error getting group key:", err);
      console.error("Error details:", {
        groupId,
        userId: user?.id,
        error: err instanceof Error ? err.message : "Unknown error",
        errorObject: err,
      });
      setError(
        err instanceof Error ? err.message : "Failed to get encryption key",
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
    [getGroupKey],
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
    [groupKey],
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
