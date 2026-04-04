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
    final userId = _userId ?? 'dummy-user-id'; // Fallback for testing

    state = state.copyWith(
      isLoading: true,
      error: null,
      matches: [],
      currentIndex: 0,
    );

    try {
      List<dynamic> matches = [];
      if (state.searchData.travelMode == TravelMode.solo) {
        try {
          await _service.createSession(state.searchData, userId);
          matches = await _service.matchSolo(userId, state.filters);
        } catch (e) {
          // Silent fail for testing, fallback to dummy data below
        }

        if (matches.isEmpty) {
          matches = _getDummySoloMatches();
        }
      } else {
        try {
          matches = await _service.matchGroups(
            userId,
            state.searchData,
            state.filters,
          );
        } catch (e) {
          // Silent fail for testing, fallback to dummy data below
        }

        if (matches.isEmpty) {
          matches = _getDummyGroupMatches();
        }
      }
      state = state.copyWith(matches: matches, hasSearched: true);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  List<dynamic> _getDummySoloMatches() {
    return [
      {
        'user': {
          'id': 'dummy-solo-1',
          'full_name': 'Aarav Sharma',
          'age': 24,
          'avatar':
              'https://images.unsplash.com/photo-1599661046289-e31887846eac?auto=format&fit=crop&q=80&w=300',
          'bio':
              'Adventure seeker and mountain lover. Looking for someone to join me on a trek to Spiti Valley!',
          'gender': 'Male',
          'nationality': 'Indian',
          'profession': 'Software Engineer',
          'personality': 'Extrovert',
          'religion': 'Hindu',
          'interests': ['Hiking', 'Photography', 'Coding'],
          'foodPreference': 'Vegetarian',
          'smoking': 'No',
          'drinking': 'Occasionally',
        },
        'destination': 'Spiti Valley, Himachal Pradesh',
        'start_date': '2026-06-15',
        'end_date': '2026-06-25',
        'budget': 25000,
      },
      {
        'user': {
          'id': 'dummy-solo-2',
          'full_name': 'Ishita Kapur',
          'age': 22,
          'avatar': 'https://i.pravatar.cc/300?u=ishita',
          'bio':
              'Beach bum and sunset lover. Planning a relaxing trip to South Goa. Join me for some fish thali and scooty rides!',
          'gender': 'Female',
          'nationality': 'Indian',
          'profession': 'Graphic Designer',
          'personality': 'Ambivert',
          'religion': 'Sikh',
          'interests': ['Painting', 'Yoga', 'Cooking'],
          'foodPreference': 'Non-Vegetarian',
          'smoking': 'No',
          'drinking': 'No',
        },
        'destination': 'South Goa, Goa',
        'start_date': '2026-05-10',
        'end_date': '2026-05-17',
        'budget': 15000,
      },
      {
        'user': {
          'id': 'dummy-solo-3',
          'full_name': 'Kabir Varma',
          'age': 27,
          'avatar': 'https://i.pravatar.cc/300?u=kabir',
          'bio':
              'History buff and architecture enthusiast. Exploring the ruins of Hampi. Join me for a journey through time!',
          'gender': 'Male',
          'nationality': 'Indian',
          'profession': 'Architect',
          'personality': 'Introvert',
          'religion': 'Atheist',
          'interests': ['Architecture', 'Reading', 'Cycling'],
          'foodPreference': 'Anything',
          'smoking': 'Occasionally',
          'drinking': 'Yes',
        },
        'destination': 'Hampi, Karnataka',
        'start_date': '2026-08-20',
        'end_date': '2026-08-25',
        'budget': 18000,
      },
    ];
  }

  List<dynamic> _getDummyGroupMatches() {
    return [
      {
        'id': 'dummy-group-1',
        'name': 'Backpackers of Rajasthan',
        'description':
            'Exploring the royal heritage of Jaipur, Jodhpur, and Udaipur. Join us for a 10-day cultural journey!',
        'cover_image':
            'https://images.unsplash.com/photo-1599661046289-e31887846eac?auto=format&fit=crop&q=80&w=300',
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
