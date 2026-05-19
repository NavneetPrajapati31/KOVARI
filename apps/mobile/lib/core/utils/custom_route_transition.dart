import 'package:flutter/material.dart';
import 'package:mobile/core/theme/motion_tokens.dart';

class PremiumPageRoute<T> extends PageRouteBuilder<T> {

  PremiumPageRoute({required this.builder})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => builder(context),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final slideAnimation = animation.drive(
              Tween<Offset>(
                begin: const Offset(0.05, 0),
                end: Offset.zero,
              ).chain(CurveTween(curve: MotionTokens.easeOut)),
            );

            final fadeAnimation = animation.drive(
              Tween<double>(
                begin: 0.0,
                end: 1.0,
              ).chain(CurveTween(curve: MotionTokens.normal.toString() == '200ms' ? Curves.easeIn : Curves.linear)),
            );

            final scaleAnimation = animation.drive(
              Tween<double>(
                begin: 0.98,
                end: 1.0,
              ).chain(CurveTween(curve: MotionTokens.easeOut)),
            );

            return FadeTransition(
              opacity: fadeAnimation,
              child: ScaleTransition(
                scale: scaleAnimation,
                child: SlideTransition(
                  position: slideAnimation,
                  child: child,
                ),
              ),
            );
          },
          transitionDuration: MotionTokens.normal,
          reverseTransitionDuration: MotionTokens.fast,
        );
  final WidgetBuilder builder;
}
