import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class KovariIcons {
  static const String _homeSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="{fill}" stroke="{color}" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
</svg>
''';

  static const String _searchSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="{fill}" stroke="{color}" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="11" cy="11" r="8"/>
  <path d="m21 21-4.3-4.3"/>
</svg>
''';

  static const String _sendSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="{fill}" stroke="{color}" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
  <path d="m22 2-7 20-4-9-9-4Z"/>
  <path d="M22 2 11 13"/>
</svg>
''';

  static const String _usersSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="{fill}" stroke="{color}" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</svg>
''';

  static String getHome({
    bool isFilled = false,
    double strokeWidth = 2,
    String color = 'currentColor',
  }) {
    return _homeSvg
        .replaceAll('{fill}', isFilled ? color : 'none')
        .replaceAll('{strokeWidth}', strokeWidth.toString())
        .replaceAll('{color}', color);
  }

  static String getSearch({
    bool isFilled = false,
    double strokeWidth = 2,
    String color = 'currentColor',
  }) {
    return _searchSvg
        .replaceAll('{fill}', isFilled ? color : 'none')
        .replaceAll('{strokeWidth}', strokeWidth.toString())
        .replaceAll('{color}', color);
  }

  static String getSend({
    bool isFilled = false,
    double strokeWidth = 2,
    String color = 'currentColor',
  }) {
    return _sendSvg
        .replaceAll('{fill}', isFilled ? color : 'none')
        .replaceAll('{strokeWidth}', strokeWidth.toString())
        .replaceAll('{color}', color);
  }

  static String getUsers({
    bool isFilled = false,
    double strokeWidth = 2,
    String color = 'currentColor',
  }) {
    return _usersSvg
        .replaceAll('{fill}', isFilled ? color : 'none')
        .replaceAll('{strokeWidth}', strokeWidth.toString())
        .replaceAll('{color}', color);
  }
}

class KovariIcon extends StatelessWidget {
  final String svgString;
  final double size;
  final Color color;

  const KovariIcon({
    super.key,
    required this.svgString,
    this.size = 24,
    this.color = Colors.black,
  });

  @override
  Widget build(BuildContext context) {
    // Convert Color to hex string for SVG replacement
    final hexColor =
        '#${color.toARGB32().toRadixString(16).padLeft(8, '0').substring(2)}';
    final processedSvg = svgString.replaceAll('currentColor', hexColor);

    return SvgPicture.string(processedSvg, width: size, height: size);
  }
}
