import '../models/home_data.dart';

class HomeState {
  final HomeData? data;
  final bool isLoading;
  final bool isStale;
  final String? error;

  HomeState({
    this.data,
    this.isLoading = false,
    this.isStale = false,
    this.error,
  });

  HomeState copyWith({
    HomeData? data,
    bool? isLoading,
    bool? isStale,
    String? error,
  }) {
    return HomeState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      isStale: isStale ?? this.isStale,
      error: error,
    );
  }
}
