class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic originalError;

  ApiException(this.message, {this.statusCode, this.originalError});

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}

class UnauthorizedException extends ApiException {
  UnauthorizedException([super.message = 'Unauthorized']) : super(statusCode: 401);
}

class NotFoundException extends ApiException {
  NotFoundException([super.message = 'Not found']) : super(statusCode: 404);
}

class NetworkException extends ApiException {
  NetworkException([super.message = 'Network connection issue']);
}
