import 'package:mobile/features/home/models/home_data.dart';

class HomeState {

  HomeState({
    this.data,
    this.isLoading = false,
    this.isStale = false,
    this.error,
  });
  final HomeData? data;
  final bool isLoading;
  final bool isStale;
  final String? error;

  HomeState copyWith({
    HomeData? data,
    bool? isLoading,
    bool? isStale,
    String? error,
  }) => HomeState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      isStale: isStale ?? this.isStale,
      error: error,
    );
}
