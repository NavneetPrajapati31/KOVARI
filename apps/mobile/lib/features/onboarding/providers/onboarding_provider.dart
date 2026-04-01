import 'dart:async';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/profile_service.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/location_service.dart';
import '../../../core/network/cloudinary_service.dart';

const Object _sentinel = Object();

class OnboardingState {
  final int currentStep;
  final String firstName;
  final String lastName;
  final String username;
  final bool? isUsernameAvailable;
  final bool isUsernameChecking;
  final String? profilePicUrl;
  final String? localProfilePicPath;
  final String bio;
  final String? gender;
  final DateTime? birthday;
  final String? location;
  final GeoapifyResult? locationDetails;
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
    this.localProfilePicPath,
    this.bio = '',
    this.gender,
    this.birthday,
    this.location,
    this.locationDetails,
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
    Object? profilePicUrl = _sentinel,
    Object? localProfilePicPath = _sentinel,
    String? bio,
    String? gender,
    DateTime? birthday,
    String? location,
    GeoapifyResult? locationDetails,
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
      profilePicUrl: profilePicUrl == _sentinel
          ? this.profilePicUrl
          : (profilePicUrl as String?),
      localProfilePicPath: localProfilePicPath == _sentinel
          ? this.localProfilePicPath
          : (localProfilePicPath as String?),
      bio: bio ?? this.bio,
      gender: gender ?? this.gender,
      birthday: birthday ?? this.birthday,
      location: location ?? this.location,
      locationDetails: locationDetails ?? this.locationDetails,
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
  late final CloudinaryService _cloudinaryService;
  Timer? _debounceTimer;

  @override
  OnboardingState build() {
    final apiClient = ApiClientFactory.create();
    _profileService = ProfileService(apiClient);
    _cloudinaryService = CloudinaryService(apiClient);

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

  void updateMediaBio({Object? url = _sentinel, Object? localPath = _sentinel, String? bio}) {
    state = state.copyWith(
      profilePicUrl: url,
      localProfilePicPath: localPath,
      bio: bio ?? state.bio,
    );
  }

  void updateGenderBirth({String? gender, DateTime? birthday}) {
    state = state.copyWith(
      gender: gender ?? state.gender,
      birthday: birthday ?? state.birthday,
    );
  }

  void updateLocationJob({
    String? loc,
    GeoapifyResult? details,
    String? nation,
    String? job,
  }) {
    state = state.copyWith(
      location: loc ?? state.location,
      locationDetails: details ?? state.locationDetails,
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
      if (state.birthday == null) throw 'Birthday is required';

      // 1. Upload Profile Photo if local path exists
      String? finalProfilePicUrl = state.profilePicUrl;
      if (state.localProfilePicPath != null) {
        try {
          finalProfilePicUrl = await _cloudinaryService.uploadImage(
            File(state.localProfilePicPath!),
            folder: 'kovari-profiles',
          );
          // Update state with the new URL for future attempts
          state = state.copyWith(profilePicUrl: finalProfilePicUrl);
        } catch (uploadError) {
          throw 'Failed to upload profile photo: $uploadError';
        }
      }

      // 2. Calculate Age
      final now = DateTime.now();
      int age = now.year - state.birthday!.year;
      if (now.month < state.birthday!.month ||
          (now.month == state.birthday!.month && now.day < state.birthday!.day)) {
        age--;
      }

      // 2. Prepare Profile Payload
      final profilePayload = {
        'name': '${state.firstName} ${state.lastName}'.trim(),
        'firstName': state.firstName,
        'lastName': state.lastName,
        'username': state.username,
        'age': age,
        'gender': (state.gender == 'Prefer not to say' || state.gender == null) 
            ? 'Other' 
            : state.gender, 
        'birthday': state.birthday!.toUtc().toIso8601String(), // Correct ISO format
        'bio': state.bio,
        'profile_photo': finalProfilePicUrl,
        'location': state.location,
        'location_details': state.locationDetails != null ? {
          'lat': state.locationDetails!.lat,
          'lon': state.locationDetails!.lon,
          'city': state.locationDetails!.city,
          'state': state.locationDetails!.state,
          'country': state.locationDetails!.country,
          'formatted': state.locationDetails!.formatted,
        } : null,
        'languages': state.languages,
        'nationality': state.nationality,
        'job': state.jobType,
        'religion': state.religion ?? 'Prefer not to say',
        'smoking': state.smoking ?? 'No',
        'drinking': state.drinking ?? 'No',
        'personality': state.personality ?? 'Ambivert',
        'food_preference': state.foodPreference ?? 'Veg',
        'interests': state.interests,
      };

      // 2.5 Remove null values from payload
      profilePayload.removeWhere((key, value) => value == null);

      // 3. Update Profile
      await _profileService.updateProfile(profilePayload);

      // 4. Accept Policies
      await _profileService.acceptPolicies(
        termsVersion: '1.0',
        privacyVersion: '1.0',
        guidelinesVersion: '1.0',
      );

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
