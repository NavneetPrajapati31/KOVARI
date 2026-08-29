/// Converts platform deep-link [Uri]s into GoRouter locations.
String? resolveDeepLinkLocation(Uri uri) {
  if (uri.scheme == 'kovari') {
    return _resolveKovariSchemeLocation(uri);
  }

  var path = uri.path;
  if (path.isEmpty) return null;

  if (path.startsWith('/invite/')) {
    path = path.replaceFirst('/invite/', '/groups/invite/');
  }

  return uri.queryParameters.isEmpty
      ? path
      : Uri(path: path, queryParameters: uri.queryParameters).toString();
}

String? _resolveKovariSchemeLocation(Uri uri) {
  switch (uri.host) {
    case 'reset-password':
      final token = uri.queryParameters['token']?.trim();
      if (token == null || token.isEmpty) return null;
      return Uri(
        path: '/reset-password',
        queryParameters: {'token': token},
      ).toString();
    case 'invite':
      final token = uri.pathSegments.isNotEmpty
          ? uri.pathSegments.first
          : uri.path.replaceFirst('/', '').trim();
      if (token.isEmpty) return null;
      return '/groups/invite/$token';
    default:
      return null;
  }
}

/// Redacts sensitive query params before logging deep links.
String sanitizeDeepLinkForLog(Uri uri) {
  if (uri.queryParameters.containsKey('token')) {
    return uri
        .replace(
          queryParameters: {
            ...uri.queryParameters,
            'token': '[REDACTED]',
          },
        )
        .toString();
  }
  return uri.toString();
}
