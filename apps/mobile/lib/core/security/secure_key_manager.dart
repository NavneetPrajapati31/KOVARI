import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:uuid/uuid.dart';

class SecureKeyManager {
  factory SecureKeyManager() => _instance;
  SecureKeyManager._internal();
  static const String _keyDeviceTrustId = 'device_trust_id';
  static const String _keyIdentitySecret = 'identity_secret';

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static final SecureKeyManager _instance = SecureKeyManager._internal();

  String? _cachedTrustId;

  /// 🔐 Initializes the sovereign identity for this installation.
  Future<void> init() async {
    try {
      var trustId = await _storage.read(key: _keyDeviceTrustId);
      var secret = await _storage.read(key: _keyIdentitySecret);

      if (trustId == null || secret == null) {
        AppLogger.i(
          '🛡️ [SecureKeyManager] Generating new sovereign identity...',
        );

        // 1. Generate Installation UUID
        trustId = const Uuid().v4();

        // 2. Generate 256-bit Identity Secret
        final random = Random.secure();
        final secretBytes = Uint8List.fromList(List.generate(32, (_) => random.nextInt(256)));
        secret = base64Encode(secretBytes);

        await _storage.write(key: _keyDeviceTrustId, value: trustId);
        await _storage.write(key: _keyIdentitySecret, value: secret);
      }

      _cachedTrustId = trustId;
      AppLogger.i(
        '🛡️ [SecureKeyManager] Identity active: ${_cachedTrustId!.substring(0, 8)}...',
      );
    } catch (e) {
      AppLogger.e('❌ [SecureKeyManager] Failed to initialize identity: $e');
      rethrow;
    }
  }

  /// 🆔 Returns the privacy-preserving installation-scoped identity.
  String get deviceTrustId => _cachedTrustId ?? 'anonymous';

  /// 🖋️ Signs a payload using the hardware-backed identity secret.
  Future<String> signPayload(String payload) async {
    if (!_isInitialized) await init();

    try {
      final secret = await _storage.read(key: _keyIdentitySecret);
      if (secret == null) throw Exception('Identity secret not found');

      final algorithm = Hmac.sha256();
      final secretKey = SecretKey(base64Decode(secret));

      final mac = await algorithm.calculateMac(
        utf8.encode(payload),
        secretKey: secretKey,
      );

      return base64Encode(mac.bytes);
    } catch (e) {
      AppLogger.e('❌ [SecureKeyManager] Signing failed: $e');
      return '';
    }
  }

  /// 🔄 Rotates the identity secret (High-risk action).
  Future<void> rotateIdentity() async {
    AppLogger.w('⚠️ [SecureKeyManager] Rotating sovereign identity secret...');
    final random = Random.secure();
    final secretBytes = Uint8List.fromList(List.generate(32, (_) => random.nextInt(256)));
    await _storage.write(
      key: _keyIdentitySecret,
      value: base64Encode(secretBytes),
    );
  }

  bool get _isInitialized => _cachedTrustId != null;
}
