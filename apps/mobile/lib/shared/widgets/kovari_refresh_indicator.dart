import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class KovariRefreshIndicator extends StatefulWidget {
  final Widget child;
  final RefreshCallback onRefresh;

  const KovariRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
  });

  @override
  State<KovariRefreshIndicator> createState() => _KovariRefreshIndicatorState();
}

class _KovariRefreshIndicatorState extends State<KovariRefreshIndicator>
    with SingleTickerProviderStateMixin {
  double _pullDistance = 0.0;
  bool _isRefreshing = false;
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool _onNotification(ScrollNotification notification) {
    if (notification is ScrollUpdateNotification) {
      if (notification.metrics.pixels < 0) {
        setState(() {
          _pullDistance = -notification.metrics.pixels;
        });
      } else if (_pullDistance != 0) {
        setState(() {
          _pullDistance = 0;
        });
      }
    } else if (notification is ScrollEndNotification) {
      if (_pullDistance > 80 && !_isRefreshing) {
        _startRefresh();
      } else {
        setState(() {
          _pullDistance = 0;
        });
      }
    }
    return false;
  }

  Future<void> _startRefresh() async {
    setState(() {
      _isRefreshing = true;
      _pullDistance = 80;
    });
    _controller.forward();

    try {
      await widget.onRefresh();
    } finally {
      if (mounted) {
        _controller.reverse();
        setState(() {
          _isRefreshing = false;
          _pullDistance = 0;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final double percentage = (_pullDistance / 80).clamp(0.0, 1.0);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        NotificationListener<ScrollNotification>(
          onNotification: _onNotification,
          child: widget.child,
        ),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 100,
            alignment: Alignment.center,
            child: Opacity(
              opacity: (_pullDistance > 10 || _isRefreshing) ? 1.0 : 0.0,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.cardDark : Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  border: Border.all(
                    color: AppColors.borderColor(
                      context,
                    ).withValues(alpha: 0.5),
                    width: 0.5,
                  ),
                ),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: _isRefreshing
                      ? const CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.primary,
                          ),
                        )
                      : CircularProgressIndicator(
                          strokeWidth: 2.5,
                          value: percentage,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.primary,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
