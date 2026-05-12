enum SocketState {
  disconnected,
  connecting,
  authenticating,
  connected,
  recovering,
  degraded,
  rateLimited,
  error;

  bool get isConnected => this == SocketState.connected;
  bool get isConnecting => this == SocketState.connecting || this == SocketState.authenticating;
  bool get isRecovering => this == SocketState.recovering;
  bool get isDisconnected => this == SocketState.disconnected || this == SocketState.error;
}
