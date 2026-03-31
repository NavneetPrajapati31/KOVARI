import 'package:dio/dio.dart';

class ApiErrorHandler {
  static String extractError(dynamic error) {
    if (error is DioException) {
      // Check if response contains the error JSON body: { "error": "..." }
      final responseData = error.response?.data;
      if (responseData is Map<String, dynamic> &&
          responseData.containsKey('error')) {
        final errorField = responseData['error'];
        if (errorField is String) {
          return errorField;
        }
        // If the error is an object (e.g. Zod validation errors), convert to string instead of crashing
        return errorField.toString();
      }

      // Default error messages based on DioException type
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Please try again.';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          if (statusCode == 401) return 'Unauthorized. Please login again.';
          if (statusCode == 403) return 'Access denied.';
          if (statusCode == 404) return 'Resource not found.';
          if (statusCode != null && statusCode >= 500) {
            return 'Server error occurred.';
          }
          return 'An unexpected error occurred (${statusCode ?? "unknown"}).';
        case DioExceptionType.cancel:
          return 'Request was cancelled.';
        case DioExceptionType.connectionError:
          return 'No internet connection. Please check your network.';
        default:
          return 'Something went wrong. Please try again.';
      }
    }
    return error?.toString() ?? 'An unknown error occurred.';
  }
}
