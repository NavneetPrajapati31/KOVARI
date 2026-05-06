import 'dart:async';
import 'package:flutter/material.dart';

class ScrollPreloader extends StatefulWidget {
  final Widget child;
  final VoidCallback onIdle;
  final Duration idleDuration;

  const ScrollPreloader({
    super.key,
    required this.child,
    required this.onIdle,
    this.idleDuration = const Duration(milliseconds: 300),
  });

  @override
  State<ScrollPreloader> createState() => _ScrollPreloaderState();
}

class _ScrollPreloaderState extends State<ScrollPreloader> {
  Timer? _debounceTimer;

  void _onScrollNotification(ScrollNotification notification) {
    if (notification is ScrollUpdateNotification) {
      _debounceTimer?.cancel();
    } else if (notification is ScrollEndNotification) {
      _debounceTimer?.cancel();
      _debounceTimer = Timer(widget.idleDuration, () {
        if (mounted) widget.onIdle();
      });
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        _onScrollNotification(notification);
        return false;
      },
      child: widget.child,
    );
  }
}
