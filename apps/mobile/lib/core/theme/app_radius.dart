import 'package:flutter/material.dart';

class AppRadius {
  static const double xs = 2.0;
  static const double sm = 4.0;
  static const double md = 6.0;
  static const double def = 8.0;
  static const double lg = 20.0;
  static const double xl = 24.0;

  static const BorderRadius extraSmall = BorderRadius.all(Radius.circular(xs));
  static const BorderRadius small = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius medium = BorderRadius.all(Radius.circular(md));
  static const BorderRadius defaultRadius = BorderRadius.all(
    Radius.circular(def),
  );
  static const BorderRadius large = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius extraLarge = BorderRadius.all(Radius.circular(xl));
}
