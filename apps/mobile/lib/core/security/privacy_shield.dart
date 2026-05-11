import 'dart:async';

import 'package:flutter/services.dart';
import 'package:mobile/core/utils/app_logger.dart';
import 'package:screen_protector/screen_protector.dart';

class PrivacyShield {
  factory PrivacyShield() => _instance;
  PrivacyShield._internal();
  static final PrivacyShield _instance = PrivacyShield._internal();

  Timer? _clipboardTimer;

  /// 🛡️ Enables screenshot protection (usually for sensitive screens).
  Future<void> enableScreenshotProtection() async {
    try {
      await ScreenProtector.preventScreenshotOn();
      AppLogger.i('🛡️ [PrivacyShield] Screenshot protection ENABLED.');
    } catch (e) {
      AppLogger.e('❌ [PrivacyShield] Failed to enable screenshot protection: $e');
    }
  }

  /// 🔓 Disables screenshot protection.
  Future<void> disableScreenshotProtection() async {
    try {
      await ScreenProtector.preventScreenshotOff();
      AppLogger.i('🛡️ [PrivacyShield] Screenshot protection DISABLED.');
    } catch (e) {
      AppLogger.e('❌ [PrivacyShield] Failed to disable screenshot protection: $e');
    }
  }

  /// 📋 Copies sensitive data to clipboard with auto-expiry.
  Future<void> copyToSecureClipboard(String text, {Duration expiry = const Duration(seconds: 60)}) async {
    await Clipboard.setData(ClipboardData(text: text));
    AppLogger.i('🛡️ [PrivacyShield] Secret copied to clipboard. Expiry: ${expiry.inSeconds}s');

    _clipboardTimer?.cancel();
    _clipboardTimer = Timer(expiry, () async {
      final currentData = await Clipboard.getData(Clipboard.kTextPlain);
      if (currentData?.text == text) {
        await Clipboard.setData(const ClipboardData(text: ''));
        AppLogger.i('🛡️ [PrivacyShield] Secure clipboard cleared after expiry.');
      }
    });
  }

  /// 🧼 Clears the clipboard immediately.
  Future<void> clearClipboard() async {
    await Clipboard.setData(const ClipboardData(text: ''));
    _clipboardTimer?.cancel();
  }
}
