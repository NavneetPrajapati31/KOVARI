enum TravelMode { solo, group }

class SearchData {
  final String destination;
  final double budget;
  final DateTime startDate;
  final DateTime endDate;
  final TravelMode travelMode;
  final Map<String, dynamic>? destinationDetails;

  SearchData({
    required this.destination,
    required this.budget,
    required this.startDate,
    required this.endDate,
    required this.travelMode,
    this.destinationDetails,
  });

  SearchData copyWith({
    String? destination,
    double? budget,
    DateTime? startDate,
    DateTime? endDate,
    TravelMode? travelMode,
    Map<String, dynamic>? destinationDetails,
  }) {
    return SearchData(
      destination: destination ?? this.destination,
      budget: budget ?? this.budget,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      travelMode: travelMode ?? this.travelMode,
      destinationDetails: destinationDetails ?? this.destinationDetails,
    );
  }
}

class ExploreFilters {
  final List<int> ageRange;
  final String gender;
  final List<String> interests;
  final String travelStyle;
  final List<double> budgetRange;
  final String personality;
  final String smoking;
  final String drinking;
  final String nationality;
  final List<String> languages;

  ExploreFilters({
    required this.ageRange,
    required this.gender,
    required this.interests,
    required this.travelStyle,
    required this.budgetRange,
    required this.personality,
    required this.smoking,
    required this.drinking,
    required this.nationality,
    required this.languages,
  });

  factory ExploreFilters.initial() {
    return ExploreFilters(
      ageRange: [18, 65],
      gender: 'Any',
      interests: [],
      travelStyle: 'Any',
      budgetRange: [5000, 50000],
      personality: 'Any',
      smoking: 'No',
      drinking: 'No',
      nationality: 'Any',
      languages: [],
    );
  }

  ExploreFilters copyWith({
    List<int>? ageRange,
    String? gender,
    List<String>? interests,
    String? travelStyle,
    List<double>? budgetRange,
    String? personality,
    String? smoking,
    String? drinking,
    String? nationality,
    List<String>? languages,
  }) {
    return ExploreFilters(
      ageRange: ageRange ?? this.ageRange,
      gender: gender ?? this.gender,
      interests: interests ?? this.interests,
      travelStyle: travelStyle ?? this.travelStyle,
      budgetRange: budgetRange ?? this.budgetRange,
      personality: personality ?? this.personality,
      smoking: smoking ?? this.smoking,
      drinking: drinking ?? this.drinking,
      nationality: nationality ?? this.nationality,
      languages: languages ?? this.languages,
    );
  }
}

class ExploreState {
  final SearchData searchData;
  final ExploreFilters filters;
  final List<dynamic> matches;
  final int currentIndex;
  final bool isLoading;
  final String? error;
  final bool hasSearched;
  final DateTime? lastFetchTime;
  final int page;
  final bool hasMore;

  ExploreState({
    required this.searchData,
    required this.filters,
    required this.matches,
    required this.currentIndex,
    required this.isLoading,
    this.error,
    required this.hasSearched,
    this.lastFetchTime,
    required this.page,
    required this.hasMore,
  });

  factory ExploreState.initial() {
    return ExploreState(
      searchData: SearchData(
        destination: '',
        budget: 20000,
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 4)),
        travelMode: TravelMode.solo,
      ),
      filters: ExploreFilters.initial(),
      matches: [],
      currentIndex: 0,
      isLoading: false,
      hasSearched: false,
      lastFetchTime: null,
      page: 1,
      hasMore: true,
    );
  }

  ExploreState copyWith({
    SearchData? searchData,
    ExploreFilters? filters,
    List<dynamic>? matches,
    int? currentIndex,
    bool? isLoading,
    String? error,
    bool? hasSearched,
    DateTime? lastFetchTime,
    int? page,
    bool? hasMore,
  }) {
    return ExploreState(
      searchData: searchData ?? this.searchData,
      filters: filters ?? this.filters,
      matches: matches ?? this.matches,
      currentIndex: currentIndex ?? this.currentIndex,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      hasSearched: hasSearched ?? this.hasSearched,
      lastFetchTime: lastFetchTime ?? this.lastFetchTime,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}
