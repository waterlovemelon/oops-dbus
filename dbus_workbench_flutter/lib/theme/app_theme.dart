import 'package:flutter/material.dart';

class AppTheme {
  // Colors matching the Qt QML Theme
  static const _accent = Color(0xFF2979FF);
  static const _success = Color(0xFF4CAF50);
  static const _warning = Color(0xFFFFA726);
  static const _danger = Color(0xFFEF5350);
  static const _methodColor = Color(0xFF2196F3);
  static const _signalColor = Color(0xFFFF9800);
  static const _propertyColor = Color(0xFF9C27B0);

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorSchemeSeed: _accent,
      scaffoldBackgroundColor: const Color(0xFFF5F5F5),
      fontFamily: 'Noto Sans',
      cardTheme: const CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorSchemeSeed: _accent,
      scaffoldBackgroundColor: const Color(0xFF1E1E1E),
      fontFamily: 'Noto Sans',
      cardTheme: const CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      ),
    );
  }

  // Semantic colors accessible via context
  static const methodColor = _methodColor;
  static const signalColor = _signalColor;
  static const propertyColor = _propertyColor;
  static const successColor = _success;
  static const warningColor = _warning;
  static const dangerColor = _danger;
  static const accentColor = _accent;

  // Type indicator dot color
  static Color typeColor(String type) {
    switch (type) {
      case 'method': return _methodColor;
      case 'signal': return _signalColor;
      case 'property': return _propertyColor;
      default: return _accent;
    }
  }
}
