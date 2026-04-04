import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/safety_report.dart';
import '../services/safety_service.dart';

class SafetyState {
  final List<SafetyReport> reports;
  final bool isLoadingReports;
  final String? reportsError;
  final List<SafetyTarget> searchResults;
  final bool isSearchLoading;
  final String? searchError;
  final bool isSubmitting;
  final String? submissionError;
  final bool isSubmissionSuccess;

  SafetyState({
    this.reports = const [],
    this.isLoadingReports = false,
    this.reportsError,
    this.searchResults = const [],
    this.isSearchLoading = false,
    this.searchError,
    this.isSubmitting = false,
    this.submissionError,
    this.isSubmissionSuccess = false,
  });

  SafetyState copyWith({
    List<SafetyReport>? reports,
    bool? isLoadingReports,
    String? reportsError,
    List<SafetyTarget>? searchResults,
    bool? isSearchLoading,
    String? searchError,
    bool? isSubmitting,
    String? submissionError,
    bool? isSubmissionSuccess,
  }) {
    return SafetyState(
      reports: reports ?? this.reports,
      isLoadingReports: isLoadingReports ?? this.isLoadingReports,
      reportsError: reportsError ?? this.reportsError,
      searchResults: searchResults ?? this.searchResults,
      isSearchLoading: isSearchLoading ?? this.isSearchLoading,
      searchError: searchError ?? this.searchError,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: submissionError ?? this.submissionError,
      isSubmissionSuccess: isSubmissionSuccess ?? this.isSubmissionSuccess,
    );
  }
}

class SafetyNotifier extends Notifier<SafetyState> {
  @override
  SafetyState build() {
    return SafetyState();
  }

  SafetyService get _service => ref.read(safetyServiceProvider);

  Future<void> fetchMyReports() async {
    state = state.copyWith(isLoadingReports: true, reportsError: null);
    try {
      final reports = await _service.fetchMyReports();
      state = state.copyWith(reports: reports, isLoadingReports: false);
    } catch (e) {
      state = state.copyWith(
        isLoadingReports: false,
        reportsError: 'Failed to load reports: $e',
      );
    }
  }

  Future<void> searchTargets(String type, String query) async {
    if (query.isEmpty) {
      state = state.copyWith(searchResults: [], isSearchLoading: false);
      return;
    }

    state = state.copyWith(isSearchLoading: true, searchError: null);
    try {
      final targets = await _service.searchTargets(type, query);
      state = state.copyWith(searchResults: targets, isSearchLoading: false);
    } catch (e) {
      state = state.copyWith(
        isSearchLoading: false,
        searchError: 'Search failed: $e',
      );
    }
  }

  Future<void> submitReport({
    required String targetType,
    required String targetId,
    required String reason,
    String? evidenceUrl,
    String? evidencePublicId,
  }) async {
    state = state.copyWith(
      isSubmitting: true,
      submissionError: null,
      isSubmissionSuccess: false,
    );
    try {
      await _service.submitReport(
        targetType: targetType,
        targetId: targetId,
        reason: reason,
        evidenceUrl: evidenceUrl,
        evidencePublicId: evidencePublicId,
      );
      state = state.copyWith(isSubmitting: false, isSubmissionSuccess: true);
      // Refresh reports after submission
      await fetchMyReports();
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        submissionError: 'Submission failed: $e',
      );
    }
  }

  void resetSubmissionState() {
    state = state.copyWith(
      isSubmitting: false,
      submissionError: null,
      isSubmissionSuccess: false,
    );
  }
}

final safetyProvider = NotifierProvider<SafetyNotifier, SafetyState>(() {
  return SafetyNotifier();
});
