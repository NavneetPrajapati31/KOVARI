import CryptoJS from "crypto-js";

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  salt: string;
}

export interface GroupKey {
  key: string;
  salt: string;
  createdAt: string;
}

/**
 * Generate a random encryption key
 */
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

/**
 * Generate a random salt for key derivation
 */
export const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
};

/**
 * Derive a key from a password using PBKDF2
 */
export const deriveKeyFromPassword = (
  password: string,
  salt: string
): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
};

/**
 * Encrypt a message using AES-256-GCM
 */
export const encryptMessage = (
  message: string,
  key: string
): EncryptedMessage => {
  const salt = generateSalt();
  const derivedKey = deriveKeyFromPassword(key, salt);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  const encrypted = CryptoJS.AES.encrypt(message, derivedKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encryptedContent: encrypted.toString(),
    iv: iv.toString(),
    salt: salt,
  };
};

/**
 * Decrypt a message using AES-256-GCM
 */
export const decryptMessage = (
  encryptedMessage: EncryptedMessage,
  key: string
): string => {
  const derivedKey = deriveKeyFromPassword(key, encryptedMessage.salt);

  const decrypted = CryptoJS.AES.decrypt(
    encryptedMessage.encryptedContent,
    derivedKey,
    {
      iv: CryptoJS.enc.Hex.parse(encryptedMessage.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
};

/**
 * Generate a group encryption key
 */
export const generateGroupKey = (): GroupKey => {
  return {
    key: generateEncryptionKey(),
    salt: generateSalt(),
    createdAt: new Date().toISOString(),
  };
};

/**
 * Encrypt a message for a specific group
 */
export const encryptGroupMessage = (
  message: string,
  groupKey: string
): EncryptedMessage => {
  return encryptMessage(message, groupKey);
};

/**
 * Decrypt a message for a specific group
 */
export const decryptGroupMessage = (
  encryptedMessage: EncryptedMessage,
  groupKey: string
): string => {
  return decryptMessage(encryptedMessage, groupKey);
};

/**
 * Hash a string for secure comparison
 */
export const hashString = (str: string): string => {
  return CryptoJS.SHA256(str).toString();
};

/**
 * Generate a fingerprint for key verification
 */
export const generateKeyFingerprint = (key: string): string => {
  return CryptoJS.SHA256(key).toString().substring(0, 16);
};
