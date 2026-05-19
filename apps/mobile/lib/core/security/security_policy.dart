class SecurityPolicy {
  /// 🛡️ Subjects Public Key Info (SPKI) Pins for Kovari Backend.
  /// These are hashes of the public keys, ensuring pinning survives cert rotation 
  /// as long as the same keypair is used.
  static const Map<String, List<String>> spkiPins = {
    'kovari-api.com': [
      'sha256/f7e8a9...[PRIMARY_PIN]...',
      'sha256/a1b2c3...[BACKUP_PIN_1]...',
      'sha256/d4e5f6...[BACKUP_PIN_2]...',
    ],
    // Local development usually bypasses pinning
    '172.20.10.3': [], 
    'localhost': [],
  };

  /// 🛡️ Nonce Window for Replay Protection (milliseconds)
  static const int replayWindowMs = 300000; // 5 minutes
}
