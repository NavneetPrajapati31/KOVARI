import '../../core/config/env.dart';

class UrlUtils {
  /// Transforms a relative or null URL into a full valid URI using the API base URL.
  /// Returns null if the URL is empty or null.
  static String? getFullImageUrl(String? url) {
    if (url == null || url.isEmpty) {
      return null;
    }

    // If it's already a full URL, return it
    if (url.startsWith('http')) {
      return url;
    }

    // Prepend API base URL for relative paths
    // Ensure we don't have double slashes
    final baseUrl = Env.apiBaseUrl.endsWith('/')
        ? Env.apiBaseUrl.substring(0, Env.apiBaseUrl.length - 1)
        : Env.apiBaseUrl;
    
    final path = url.startsWith('/') ? url : '/$url';
    
    return '$baseUrl$path';
  }
}
