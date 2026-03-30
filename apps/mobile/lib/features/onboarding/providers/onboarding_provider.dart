import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/profile_service.dart';
import '../../../services/api/api_client.dart';

class OnboardingState {
  final int currentStep;
  final String firstName;
  final String lastName;
  final String username;
  final bool? isUsernameAvailable;
  final bool isUsernameChecking;
  final String? profilePicUrl;
  final String bio;
  final String? gender;
  final DateTime? birthday;
  final String? location;
  final String? nationality;
  final String? jobType;
  final List<String> languages;
  final List<String> interests;
  final String? religion;
  final String? smoking;
  final String? drinking;
  final String? personality;
  final String? foodPreference;
  final bool policyAccepted;
  final bool isSubmitting;
  final String? errorMessage;

  OnboardingState({
    this.currentStep = 1,
    this.firstName = '',
    this.lastName = '',
    this.username = '',
    this.isUsernameAvailable,
    this.isUsernameChecking = false,
    this.profilePicUrl,
    this.bio = '',
    this.gender,
    this.birthday,
    this.location,
    this.nationality,
    this.jobType,
    this.languages = const [],
    this.interests = const [],
    this.religion,
    this.smoking,
    this.drinking,
    this.personality,
    this.foodPreference,
    this.policyAccepted = false,
    this.isSubmitting = false,
    this.errorMessage,
  });

  OnboardingState copyWith({
    int? currentStep,
    String? firstName,
    String? lastName,
    String? username,
    bool? isUsernameAvailable,
    bool? isUsernameChecking,
    String? profilePicUrl,
    String? bio,
    String? gender,
    DateTime? birthday,
    String? location,
    String? nationality,
    String? jobType,
    List<String>? languages,
    List<String>? interests,
    String? religion,
    String? smoking,
    String? drinking,
    String? personality,
    String? foodPreference,
    bool? policyAccepted,
    bool? isSubmitting,
    String? errorMessage,
  }) {
    return OnboardingState(
      currentStep: currentStep ?? this.currentStep,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      username: username ?? this.username,
      isUsernameAvailable: isUsernameAvailable ?? this.isUsernameAvailable,
      isUsernameChecking: isUsernameChecking ?? this.isUsernameChecking,
      profilePicUrl: profilePicUrl ?? this.profilePicUrl,
      bio: bio ?? this.bio,
      gender: gender ?? this.gender,
      birthday: birthday ?? this.birthday,
      location: location ?? this.location,
      nationality: nationality ?? this.nationality,
      jobType: jobType ?? this.jobType,
      languages: languages ?? this.languages,
      interests: interests ?? this.interests,
      religion: religion ?? this.religion,
      smoking: smoking ?? this.smoking,
      drinking: drinking ?? this.drinking,
      personality: personality ?? this.personality,
      foodPreference: foodPreference ?? this.foodPreference,
      policyAccepted: policyAccepted ?? this.policyAccepted,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class OnboardingNotifier extends Notifier<OnboardingState> {
  late final ProfileService _profileService;
  Timer? _debounceTimer;

  @override
  OnboardingState build() {
    final apiClient = ApiClientFactory.create(forceReal: true);
    _profileService = ProfileService(apiClient);

    ref.onDispose(() {
      _debounceTimer?.cancel();
    });

    return OnboardingState();
  }

  void setStep(int step) => state = state.copyWith(currentStep: step);

  void updateIdentity({String? first, String? last, String? user}) {
    state = state.copyWith(
      firstName: first ?? state.firstName,
      lastName: last ?? state.lastName,
      username: user ?? state.username,
      isUsernameAvailable: user != null ? null : state.isUsernameAvailable,
    );

    if (user != null && user.length >= 3) {
      _debounceUsernameCheck(user);
    }
  }

  void _debounceUsernameCheck(String username) {
    _debounceTimer?.cancel();
    state = state.copyWith(isUsernameChecking: true);
    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      final available = await _profileService.checkUsernameAvailable(username);
      state = state.copyWith(
        isUsernameAvailable: available,
        isUsernameChecking: false,
      );
    });
  }

  void updateMediaBio({String? url, String? bio}) {
    state = state.copyWith(
      profilePicUrl: url ?? state.profilePicUrl,
      bio: bio ?? state.bio,
    );
  }

  void updateGenderBirth({String? gender, DateTime? birthday}) {
    state = state.copyWith(
      gender: gender ?? state.gender,
      birthday: birthday ?? state.birthday,
    );
  }

  void updateLocationJob({String? loc, String? nation, String? job}) {
    state = state.copyWith(
      location: loc ?? state.location,
      nationality: nation ?? state.nationality,
      jobType: job ?? state.jobType,
    );
  }

  void toggleLanguage(String lang) {
    final list = List<String>.from(state.languages);
    if (list.contains(lang)) {
      list.remove(lang);
    } else {
      list.add(lang);
    }
    state = state.copyWith(languages: list);
  }

  void toggleInterest(String interest) {
    final list = List<String>.from(state.interests);
    if (list.contains(interest)) {
      list.remove(interest);
    } else {
      list.add(interest);
    }
    state = state.copyWith(interests: list);
  }

  void updateLifestyle({
    String? religion,
    String? smoking,
    String? drinking,
    String? personality,
    String? food,
  }) {
    state = state.copyWith(
      religion: religion ?? state.religion,
      smoking: smoking ?? state.smoking,
      drinking: drinking ?? state.drinking,
      personality: personality ?? state.personality,
      foodPreference: food ?? state.foodPreference,
    );
  }

  void setPolicyAccepted(bool accepted) =>
      state = state.copyWith(policyAccepted: accepted);

  Future<bool> submit() async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      // Workaround: Bypass real API calls for now to show Success Step
      await Future.delayed(const Duration(milliseconds: 800));

      setStep(8);
      state = state.copyWith(isSubmitting: false);
      return true;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, errorMessage: e.toString());
      return false;
    }
  }
}

final onboardingProvider =
    NotifierProvider<OnboardingNotifier, OnboardingState>(
      OnboardingNotifier.new,
    );
