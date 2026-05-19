class ApiResponse<T> {

  ApiResponse({this.data, this.error});
  final T? data;
  final String? error;

  bool get isSuccess => error == null;
}
