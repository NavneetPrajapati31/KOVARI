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
 * Helper to decode a string that might be Hex or Base64
 */
const autoDecode = (str: string): CryptoJS.lib.WordArray => {
  if (!str) return CryptoJS.lib.WordArray.create();
  
  // Very basic heuristic: Hex is only 0-9a-f. 
  // Base64 often ends with = or contains +, /
  const isHex = /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;
  
  if (isHex) {
    return CryptoJS.enc.Hex.parse(str);
  }
  
  // Fallback to Base64
  try {
    return CryptoJS.enc.Base64.parse(str);
  } catch (e) {
    console.error("Failed to parse encryption metadata:", str);
    return CryptoJS.lib.WordArray.create();
  }
};

/**
 * Derive a key from a password using PBKDF2
 */
export const deriveKeyFromPassword = (
  password: string,
  salt: string
): CryptoJS.lib.WordArray => {
  if (!password || !salt) {
    console.error("Encryption error: Missing password or salt for PBKDF2");
    // Return a dummy WordArray to prevent crash, but decryption will naturally fail
    return CryptoJS.lib.WordArray.create();
  }

  // Parse the salt using autoDecode to handle both Hex and Base64
  const saltWords = autoDecode(salt);
  console.log(`🛡️ [Encryption] Derived key from password: "${password}", saltWords:`, saltWords.toString());

  return CryptoJS.PBKDF2(password, saltWords, {
    keySize: 256 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256,
  });
};

/**
 * Encrypt a message using AES-256-CBC
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
 * Decrypt a message using AES-256-CBC
 */
export const decryptMessage = (
  encryptedMessage: EncryptedMessage,
  key: string
): string => {
  if (!key) return "";
  
  console.log(`🛡️ [Encryption] Decrypting with key: "${key}", salt: "${encryptedMessage.salt}"`);
  const derivedKey = deriveKeyFromPassword(key, encryptedMessage.salt);
  
  // Decrypt using CryptoJS
  // Note: CryptoJS.AES.decrypt expects the first argument to be a CipherParams object 
  // or a WordArray representing the ciphertext.
  const ciphertext = autoDecode(encryptedMessage.encryptedContent);
  const iv = autoDecode(encryptedMessage.iv);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext } as CryptoJS.lib.CipherParams,
    derivedKey,
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  try {
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return "";
  }
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
