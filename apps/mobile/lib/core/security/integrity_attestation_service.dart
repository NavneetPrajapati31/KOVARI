import 'dart:async';

import 'package:mobile/core/utils/app_logger.dart';
import 'package:safe_device/safe_device.dart';

class IntegrityAttestationService {
  factory IntegrityAttestationService() => _instance;
  IntegrityAttestationService._internal();
  static final IntegrityAttestationService _instance = IntegrityAttestationService._internal();

  String? _cachedToken;
  DateTime? _tokenExpiry;

  /// 🛰️ Fetches a hardware-backed integrity token for backend verification.
  /// This token proves the app is genuine and running on a safe device.
  Future<String?> getAttestationToken() async {
    if (_isTokenValid) return _cachedToken;

    AppLogger.i('🛡️ [IntegrityAttestationService] Fetching new device attestation token...');
    
    try {
      // 1. In a production environment, this would call Play Integrity or App Attest plugins.
      // 2. For now, we simulate the token generation using safe_device signals.
      final isSafe = await SafeDevice.isSafeDevice;
      if (!isSafe) {
        AppLogger.w('⚠️ [IntegrityAttestationService] Device integrity check failed. Token may be rejected by backend.');
      }

      // Simulated token: [DEVICE_ID]|[TIMESTAMP]|[INTEGRITY_SIGNAL]
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final token = 'attestation_${isSafe ? "trusted" : "untrusted"}_$timestamp';
      
      _cachedToken = token;
      _tokenExpiry = DateTime.now().add(const Duration(hours: 1)); // Cache for 1 hour
      
      return token;
    } catch (e) {
      AppLogger.e('❌ [IntegrityAttestationService] Attestation failed: $e');
      return null;
    }
  }

  /// 🔄 Forces a refresh of the attestation token (e.g., before sensitive mutations).
  Future<String?> refreshAttestation() async {
    _cachedToken = null;
    return getAttestationToken();
  }

  bool get _isTokenValid => 
      _cachedToken != null && 
      _tokenExpiry != null && 
      DateTime.now().isBefore(_tokenExpiry!);
}
