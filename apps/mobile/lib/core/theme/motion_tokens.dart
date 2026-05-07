import 'package:flutter/material.dart';

class MotionTokens {
  // Durations
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);

  // Curves
  static const Curve easeOut = Curves.easeOutCubic;
  static const Curve easeInOut = Curves.easeInOutCubic;
  
  // Custom Spring for "Premium" feel (Instagram/Bumble style)
  static const Curve spring = ElasticOutCurve(0.8);
  
  // Standard bouncy curve for cards/modals
  static const Curve interactive = Curves.easeOutBack;
}
