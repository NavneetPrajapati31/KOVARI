import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../shared/models/kovari_user.dart';
import '../models/explore_state.dart';
import '../services/explore_service.dart';
import '../services/match_service.dart';
class ExploreNotifier extends Notifier<ExploreState> {
  @override
  ExploreState build() {
    return ExploreState.initial();
  }

  ExploreService get _service => ref.read(exploreServiceProvider);
  MatchService get _matchService => ref.read(matchServiceProvider);
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

  Future<void> performSearch({bool isRefresh = false, bool isLoadMore = false}) async {
    final userId = _userId ?? 'dummy-user-id';

    if (!isRefresh && !isLoadMore) {
      if (state.lastFetchTime != null && state.searchData.travelMode == TravelMode.solo) {
        if (DateTime.now().difference(state.lastFetchTime!).inSeconds < 30) {
          return; // Cache valid
        }
      }
    }

    if (isLoadMore) {
      if (!state.hasMore || state.searchData.travelMode != TravelMode.solo) return;
    } else {
      state = state.copyWith(
        isLoading: true,
        error: null,
        matches: [],
        currentIndex: 0,
        page: 1,
        hasMore: true,
      );
    }

    try {
      List<dynamic> matches = List.from(state.matches);
      bool newHasMore = state.hasMore;
      int newPage = state.page;

      if (state.searchData.travelMode == TravelMode.solo) {
        try {
          if (!isLoadMore) {
            await _service.createSession(state.searchData, userId);
          }
          final fetchPage = isLoadMore ? state.page + 1 : 1;
          final result = await _matchService.getMatches(page: fetchPage);
          final fetchedMatches = result.matches.toList();
          fetchedMatches.sort((a, b) => (b.score ?? 0).compareTo(a.score ?? 0));

          if (isLoadMore) {
            matches.addAll(fetchedMatches);
          } else {
            matches = fetchedMatches;
          }
          newHasMore = result.hasMore;
          newPage = fetchPage;
        } catch (e) {
          // ignore: avoid_print
          print('Match fetching error: $e');
        }
      } else {
        try {
          final result = await _service.matchGroups(
            userId,
            state.searchData,
            state.filters,
          );
          matches = result.matches;
          newHasMore = result.hasMore;
        } catch (e) {
          // ignore: empty_catches
        }

        if (matches.isEmpty) {
          matches = _getDummyGroupMatches();
        }
      }
      
      state = state.copyWith(
        matches: matches,
        hasSearched: true,
        page: newPage,
        hasMore: newHasMore,
        lastFetchTime: isLoadMore ? state.lastFetchTime : DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }


  List<dynamic> _getDummyGroupMatches() {
    return [
      {
        'id': 'dummy-group-1',
        'name': 'Backpackers of Rajasthan',
        'description':
            'Exploring the royal heritage of Jaipur, Jodhpur, and Udaipur. Join us for a 10-day cultural journey!',
        'cover_image':
            'https://images.pexels.com/photos/36020918/pexels-photo-36020918.jpeg',
        'memberCount': 5,
        'creator': {'name': 'Priya Singh'},
        'destination': 'Rajasthan, India',
        'startDate': '2026-07-01',
        'endDate': '2026-07-10',
        'budget': 35000,
        'tags': ['Culture', 'History', 'Backpacking'],
        'languages': ['Hindi', 'English'],
        'smokingPolicy': 'Non-smoking preferred',
        'drinkingPolicy': "I'm okay with drinking",
      },
      {
        'id': 'dummy-group-2',
        'name': 'Pondicherry Foodies',
        'description':
            'A culinary tour of the French Quarter and Auroville. Cafe hopping and beach walks!',
        'cover_image':
            'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=300',
        'memberCount': 3,
        'creator': {'name': 'Rohan Das'},
        'destination': 'Pondicherry, India',
        'startDate': '2026-09-12',
        'endDate': '2026-09-15',
        'budget': 12000,
        'tags': ['Food', 'Beach', 'Photography'],
        'languages': ['English', 'Tamil', 'French'],
        'smokingPolicy': 'No smoking',
        'drinkingPolicy': 'Social drinking okay',
      },
    ];
  }

  void nextMatch() {
    if (state.currentIndex < state.matches.length - 1) {
      state = state.copyWith(currentIndex: state.currentIndex + 1);
      
      if (state.searchData.travelMode == TravelMode.solo &&
          state.currentIndex >= state.matches.length - 3 &&
          state.hasMore) {
        performSearch(isLoadMore: true);
      }
    } else {
      if (state.searchData.travelMode == TravelMode.solo && state.hasMore) {
        performSearch(isLoadMore: true);
      } else {
        // Clear matches or show "no more results"
        state = state.copyWith(matches: [], currentIndex: 0);
      }
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
        skippedUserId: state.searchData.travelMode == TravelMode.solo
            ? matchId
            : null,
        skippedGroupId: state.searchData.travelMode == TravelMode.group
            ? matchId
            : null,
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
        toUserId: state.searchData.travelMode == TravelMode.solo
            ? matchId
            : null,
        toGroupId: state.searchData.travelMode == TravelMode.group
            ? matchId
            : null,
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
        reportedUserId: state.searchData.travelMode == TravelMode.solo
            ? matchId
            : null,
        reportedGroupId: state.searchData.travelMode == TravelMode.group
            ? matchId
            : null,
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
