import 'dart:convert';
import 'dart:typed_data';
import 'package:cryptography/cryptography.dart';
import 'package:mobile/core/utils/app_logger.dart';

class EncryptionService {
  static final EncryptionService _instance = EncryptionService._internal();
  factory EncryptionService() => _instance;
  EncryptionService._internal();

  final _aes = AesCbc.with256bits(macAlgorithm: MacAlgorithm.empty);

  /// Derives a key from a password using PBKDF2 (Matches CryptoJS implementation)
  Future<SecretKey> _deriveKey(String password, List<int> salt) async {
    final pbkdf2 = Pbkdf2(
      macAlgorithm: Hmac.sha256(),
      iterations: 10000,
      bits: 256,
    );
    return pbkdf2.deriveKeyFromPassword(password: password, nonce: salt);
  }

  /// Encrypts a message using AES-CBC (Matches apps/web utils/encryption.ts)
  Future<Map<String, String>> encryptMessage(String message, String key) async {
    try {
      final salt = SecretKeyData.random(length: 16).bytes;
      print(
        '🛡️ [EncryptionService] Encrypting with key: "$key", salt: "${hexEncode(salt)}"',
      );
      final derivedKey = await _deriveKey(key, salt);
      final iv = SecretKeyData.random(length: 16).bytes;

      final secretBox = await _aes.encrypt(
        utf8.encode(message),
        secretKey: derivedKey,
        nonce: iv,
      );

      return {
        'encryptedContent': base64.encode(secretBox.cipherText),
        'encryption_iv': hexEncode(iv),
        'encryption_salt': hexEncode(salt),
      };
    } catch (e) {
      AppLogger.e('🛡️ [EncryptionService] Encryption failed', error: e);
      rethrow;
    }
  }

  /// Decrypts a message using AES-CBC
  Future<String> decryptMessage({
    required String encryptedContent,
    required String iv,
    required String salt,
    required String key,
  }) async {
    try {
      final saltBytes = hexDecode(salt);
      final ivBytes = hexDecode(iv);
      print(
        '🛡️ [EncryptionService] Decrypting with key: "$key", salt: "$salt"',
      );
      final derivedKey = await _deriveKey(key, saltBytes);

      final decrypted = await _aes.decrypt(
        SecretBox(
          base64.decode(encryptedContent),
          nonce: ivBytes,
          mac: Mac.empty,
        ),
        secretKey: derivedKey,
      );

      return utf8.decode(decrypted);
    } catch (e) {
      AppLogger.e('🛡️ [EncryptionService] Decryption failed', error: e);
      return '[Failed to decrypt]';
    }
  }

  // --- Helpers ---

  String hexEncode(List<int> bytes) {
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  List<int> hexDecode(String hex) {
    final result = <int>[];
    for (var i = 0; i < hex.length; i += 2) {
      result.add(int.parse(hex.substring(i, i + 2), radix: 16));
    }
    return result;
  }
}
