import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../shared/models/kovari_user.dart';
import '../models/explore_state.dart';
import '../services/explore_service.dart';

class ExploreNotifier extends Notifier<ExploreState> {
  @override
  ExploreState build() {
    return ExploreState.initial();
  }

  ExploreService get _service => ref.read(exploreServiceProvider);
  KovariUser? get _user => ref.watch(authStateProvider);

  String? get _userId => _user?.id;

  void updateSearchData(SearchData searchData) {
    state = state.copyWith(searchData: searchData);
  }

  void updateFilters(ExploreFilters filters) {
    state = state.copyWith(filters: filters);
  }

  void setTravelMode(TravelMode mode) {
    state = state.copyWith(
      searchData: state.searchData.copyWith(travelMode: mode),
      hasSearched: false,
      matches: [],
      currentIndex: 0,
    );
  }

  Future<void> performSearch() async {
    if (_userId == null) {
      state = state.copyWith(error: 'Please sign in to search');
      return;
    }

    state = state.copyWith(isLoading: true, error: null, matches: [], currentIndex: 0);

    try {
      if (state.searchData.travelMode == TravelMode.solo) {
        // Step 1: Create/Update session
        await _service.createSession(state.searchData, _userId!);
        
        // Step 2: Match solo
        final matches = await _service.matchSolo(_userId!, state.filters);
        state = state.copyWith(matches: matches, hasSearched: true);
      } else {
        // Step 1: Match groups
        final matches = await _service.matchGroups(_userId!, state.searchData, state.filters);
        state = state.copyWith(matches: matches, hasSearched: true);
      }
    } catch (e) {
      state = state.copyWith(error: e.toString());
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  void nextMatch() {
    if (state.currentIndex < state.matches.length - 1) {
      state = state.copyWith(currentIndex: state.currentIndex + 1);
    } else {
      // Clear matches or show "no more results"
      state = state.copyWith(matches: [], currentIndex: 0);
    }
  }

  void previousMatch() {
    if (state.currentIndex > 0) {
      state = state.copyWith(currentIndex: state.currentIndex - 1);
    }
  }

  Future<void> handlePass(String matchId) async {
    if (_userId == null) return;
    
    try {
      await _service.skipMatch(
        skipperId: _userId!,
        skippedUserId: state.searchData.travelMode == TravelMode.solo ? matchId : null,
        skippedGroupId: state.searchData.travelMode == TravelMode.group ? matchId : null,
        destinationId: state.searchData.destination,
        isSolo: state.searchData.travelMode == TravelMode.solo,
      );
      nextMatch();
    } catch (e) {
      state = state.copyWith(error: 'Failed to pass: $e');
    }
  }

  Future<void> handleInterested(String matchId) async {
    if (_userId == null) return;

    try {
      await _service.sendInterest(
        fromUserId: _userId!,
        toUserId: state.searchData.travelMode == TravelMode.solo ? matchId : null,
        toGroupId: state.searchData.travelMode == TravelMode.group ? matchId : null,
        destinationId: state.searchData.destination,
        isSolo: state.searchData.travelMode == TravelMode.solo,
      );
      nextMatch();
    } catch (e) {
      state = state.copyWith(error: 'Failed to express interest: $e');
    }
  }

  Future<void> handleReport(String matchId, String reason) async {
    if (_userId == null) return;

    try {
      await _service.reportMatch(
        reporterId: _userId!,
        reportedUserId: state.searchData.travelMode == TravelMode.solo ? matchId : null,
        reportedGroupId: state.searchData.travelMode == TravelMode.group ? matchId : null,
        reason: reason,
        isSolo: state.searchData.travelMode == TravelMode.solo,
      );
      nextMatch();
    } catch (e) {
      state = state.copyWith(error: 'Failed to report: $e');
    }
  }
}

final exploreProvider = NotifierProvider<ExploreNotifier, ExploreState>(() {
  return ExploreNotifier();
});
