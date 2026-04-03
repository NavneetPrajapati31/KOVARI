import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../shared/widgets/text_input_field.dart';
import '../../../shared/widgets/select_field.dart';
import '../../../shared/widgets/nationality_autocomplete.dart';
import '../../../shared/widgets/location_autocomplete.dart';
import '../../../shared/widgets/profile_section_card.dart';
import '../../../shared/widgets/select_chip.dart';
import '../../../shared/widgets/flat_date_picker.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import '../models/user_profile.dart';
import '../../onboarding/data/profile_service.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/utils/url_utils.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import '../../../core/network/cloudinary_service.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/widgets/common/user_avatar_fallback.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  final UserProfile profile;

  const EditProfileScreen({super.key, required this.profile});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _usernameController;
  late TextEditingController _bioController;
  late TextEditingController _professionController;

  String _age = '';
  DateTime? _birthday;
  String _gender = '';
  String _nationality = '';
  String _location = '';
  Map<String, dynamic>? _locationDetails;
  String _religion = '';
  String _smoking = '';
  String _drinking = '';
  String _personality = '';
  String _foodPreference = '';
  List<String> _interests = [];
  List<String> _languages = [];

  bool _isLoading = false;

  // Username check state
  Timer? _debounceTimer;
  bool? _isUsernameAvailable;
  bool _isUsernameChecking = false;

  // Media Profile State
  final ImagePicker _picker = ImagePicker();
  File? _profileImageFile;
  String? _profilePicUrl;

  @override
  void initState() {
    super.initState();
    _profilePicUrl = widget.profile.profileImage;
    _nameController = TextEditingController(text: widget.profile.name);
    _usernameController = TextEditingController(text: widget.profile.username);
    _isUsernameAvailable = true; // Initially their own username is available
    _bioController = TextEditingController(text: widget.profile.bio);
    _professionController = TextEditingController(
      text: widget.profile.profession,
    );

    _age = widget.profile.age;
    _birthday = widget.profile.birthday != null
        ? DateTime.tryParse(widget.profile.birthday!)
        : null;
    _gender = widget.profile.gender;
    _nationality = widget.profile.nationality;
    _location = widget.profile.location;
    _religion = widget.profile.religion;
    _smoking = widget.profile.smoking;
    _drinking = widget.profile.drinking;
    _personality = widget.profile.personality;
    _foodPreference = widget.profile.foodPreference;
    _interests = List.from(widget.profile.interests);
    _languages = List.from(widget.profile.languages);
  }

  void _debounceUsernameCheck(String username) {
    _debounceTimer?.cancel();

    if (username.isEmpty || username.length < 3) {
      setState(() {
        _isUsernameAvailable = null;
        _isUsernameChecking = false;
      });
      return;
    }

    // If it's their current username, it's available
    if (username == widget.profile.username) {
      setState(() {
        _isUsernameAvailable = true;
        _isUsernameChecking = false;
      });
      return;
    }

    setState(() {
      _isUsernameChecking = true;
      _isUsernameAvailable = null;
    });

    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      try {
        final profileService = ProfileService(ref.read(apiClientProvider));
        final available = await profileService.checkUsernameAvailable(username);
        if (mounted) {
          setState(() {
            _isUsernameAvailable = available;
            _isUsernameChecking = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isUsernameChecking = false);
        }
      }
    });
  }

  Future<void> _showImageSourceModal() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Profile Picture",
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              visualDensity: VisualDensity.compact,
              dense: true,
              leading: const Icon(
                LucideIcons.camera,
                size: 22,
                color: AppColors.mutedForeground,
              ),
              title: Text(
                "Take Photo",
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.mutedForeground,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              visualDensity: VisualDensity.compact,
              dense: true,
              leading: const Icon(
                LucideIcons.image,
                size: 22,
                color: AppColors.mutedForeground,
              ),
              title: Text(
                "Choose from Gallery",
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.mutedForeground,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            if (_profileImageFile != null || _profilePicUrl != null)
              ListTile(
                visualDensity: VisualDensity.compact,
                dense: true,
                leading: const Icon(
                  LucideIcons.trash2,
                  size: 22,
                  color: AppColors.destructive,
                ),
                title: Text(
                  "Remove Photo",
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.destructive,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  setState(() {
                    _profileImageFile = null;
                    _profilePicUrl = null;
                  });
                },
              ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: source);
      if (pickedFile != null) {
        await _cropImage(pickedFile.path);
      }
    } catch (e) {
      debugPrint("Error picking image: $e");
    }
  }

  Future<void> _cropImage(String filePath) async {
    try {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: filePath,
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: '', // Clean, minimal look
            toolbarColor: Colors.black,
            toolbarWidgetColor: Colors.white,
            statusBarLight: true,
            backgroundColor: Colors.black,
            activeControlsWidgetColor: AppColors.primary,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: true,
            showCropGrid: false,
            hideBottomControls: true,
            cropStyle: CropStyle.circle,
            aspectRatioPresets: [CropAspectRatioPreset.square],
          ),
          IOSUiSettings(
            title: '', // Remove title
            aspectRatioLockEnabled: true,
            resetButtonHidden: true,
            rotateButtonsHidden: true,
            rotateClockwiseButtonHidden: true,
            aspectRatioPickerButtonHidden: true,
            doneButtonTitle: 'Done',
            cancelButtonTitle: 'Cancel',
            cropStyle: CropStyle.circle,
            aspectRatioPresets: [CropAspectRatioPreset.square],
          ),
        ],
      );

      if (croppedFile != null) {
        setState(() {
          _profileImageFile = File(croppedFile.path);
        });
      }
    } catch (e) {
      debugPrint("Error cropping image: $e");
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _nameController.dispose();
    _usernameController.dispose();
    _bioController.dispose();
    _professionController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    setState(() => _isLoading = true);
    if (_isUsernameAvailable == false) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Username is already taken')),
      );
      setState(() => _isLoading = false);
      return;
    }

    try {
      final apiClient = ref.read(apiClientProvider);
      final profileService = ProfileService(apiClient);
      final cloudinaryService = CloudinaryService(apiClient);

      // 1. Upload new profile photo if exists
      String? finalProfilePicUrl = _profilePicUrl;
      if (_profileImageFile != null) {
        try {
          finalProfilePicUrl = await cloudinaryService.uploadImage(
            _profileImageFile!,
            folder: 'kovari-profiles',
          );
        } catch (uploadError) {
          throw 'Failed to upload profile photo: $uploadError';
        }
      }

      final updatedData = {
        'name': _nameController.text.trim(),
        'username': _usernameController.text.trim(),
        'bio': _bioController.text.trim(),
        'profession': _professionController.text.trim(),
        'job': _professionController.text.trim(), // Alias for backend
        'age': int.tryParse(_age) ?? 0,
        'birthday': _birthday != null
            ? DateTime.utc(
                _birthday!.year,
                _birthday!.month,
                _birthday!.day,
              ).toIso8601String()
            : null,
        'gender': _gender,
        'nationality': _nationality,
        'location': _location,
        'location_details': _locationDetails,
        'religion': _religion,
        'smoking': _smoking,
        'drinking': _drinking,
        'personality': _personality,
        'foodPreference': _foodPreference,
        'food_preference': _foodPreference, // Alias for backend
        'interests': _interests,
        'languages': _languages,
        'profile_photo': finalProfilePicUrl,
        'avatar': finalProfilePicUrl, // Alias for mobile consistency
      };

      await profileService.updateProfile(updatedData);

      // Update local provider
      final currentProfile = ref.read(profileProvider);
      if (currentProfile != null) {
        ref.read(profileProvider.notifier).setProfile(UserProfile.fromJson({
          ...currentProfile.toJson(),
          ...updatedData,
        }));
      }

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to update profile: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leadingWidth: 80,
        leading: TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(
            'Cancel',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.foreground,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        title: Text(
          'Edit Profile',
          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w700),
        ),
        actions: [
          SizedBox(
            width: 80,
            child: _isLoading
                ? const Center(
                    child: SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.primary,
                        ),
                      ),
                    ),
                  )
                : TextButton(
                    onPressed: _handleSave,
                    child: Text(
                      'Done',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
          ),
        ],
        shape: Border(
          bottom: BorderSide(
            color: AppColors.border.withValues(alpha: 0.5),
            width: 0.5,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
        child: Column(
          children: [
            // Avatar Header
            Center(
              child: GestureDetector(
                onTap: _showImageSourceModal,
                child: Stack(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.border, width: 1),
                        image: _profileImageFile != null
                            ? DecorationImage(
                                image: FileImage(_profileImageFile!),
                                fit: BoxFit.cover,
                              )
                            : (_profilePicUrl != null &&
                                  _profilePicUrl!.isNotEmpty)
                            ? DecorationImage(
                                image: NetworkImage(
                                  UrlUtils.getFullImageUrl(_profilePicUrl!) ??
                                      '',
                                ),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child:
                          (_profileImageFile == null &&
                              (_profilePicUrl == null ||
                                  _profilePicUrl!.isEmpty))
                          ? const Center(child: UserAvatarFallback(size: 100))
                          : null,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            GestureDetector(
              onTap: _showImageSourceModal,
              child: Text(
                'Change Profile Photo',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // 1. General Info
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: ProfileSectionCard(
                title: 'General Info',
                subtitle: 'Update your basic profile details.',
                children: [
                  TextInputField(
                    label: 'Name',
                    controller: _nameController,
                    hintText: 'Your full name',
                    fillColor: AppColors.card,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextInputField(
                    label: 'Username',
                    controller: _usernameController,
                    hintText: 'your_username',
                    fillColor: AppColors.card,
                    onChanged: _debounceUsernameCheck,
                    suffixIcon: Padding(
                      padding: const EdgeInsets.all(12),
                      child: _isUsernameChecking
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            )
                          : (_isUsernameAvailable == true
                                ? const Icon(
                                    LucideIcons.check,
                                    color: AppColors.primary,
                                    size: 18,
                                  )
                                : (_isUsernameAvailable == false
                                      ? const Icon(
                                          LucideIcons.circleAlert,
                                          color: AppColors.destructive,
                                          size: 18,
                                        )
                                      : null)),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _buildDatePicker(context),
                  const SizedBox(height: AppSpacing.md),
                  SelectField<String>(
                    label: 'Gender',
                    value: _gender,
                    hintText: 'Select gender',
                    fillColor: AppColors.card,
                    options: const [
                      'Male',
                      'Female',
                      'Other',
                      'Prefer not to say',
                    ],
                    itemLabelBuilder: (val) => val,
                    onChanged: (val) => setState(() => _gender = val ?? ''),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  NationalityAutocomplete(
                    label: 'Nationality',
                    initialValue: _nationality,
                    fillColor: AppColors.card,
                    onSelect: (val) => setState(() => _nationality = val),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  LocationAutocomplete(
                    label: 'Location',
                    initialValue: _location,
                    fillColor: AppColors.card,
                    onSelect: (val) => setState(() {
                      _location = val.formatted;
                      _locationDetails = {
                        'city': val.city,
                        'country': val.country,
                        'formatted': val.formatted,
                        'lat': val.lat,
                        'lon': val.lon,
                      };
                    }),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // 2. Professional Info
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: ProfileSectionCard(
                title: 'Professional Info',
                subtitle: 'Update your professional details.',
                children: [
                  TextInputField(
                    label: 'Profession',
                    controller: _professionController,
                    hintText: 'What do you do?',
                    fillColor: AppColors.card,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // 3. Personal Info
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: ProfileSectionCard(
                title: 'Personal Info',
                subtitle: 'Update your personal details.',
                children: [
                  TextInputField(
                    label: 'Bio',
                    controller: _bioController,
                    hintText: 'Tell us about yourself...',
                    maxLines: 4,
                    fillColor: AppColors.card,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  SelectField<String>(
                    label: 'Religion',
                    value: _religion,
                    hintText: 'Select Religion',
                    fillColor: AppColors.card,
                    options: const [
                      "Christianity",
                      "Islam",
                      "Hinduism",
                      "Buddhism",
                      "Judaism",
                      "Sikhism",
                      "Atheist",
                      "Other",
                    ],
                    itemLabelBuilder: (val) => val,
                    onChanged: (val) => setState(() => _religion = val ?? ''),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  SelectField<String>(
                    label: 'Smoking',
                    value: _smoking,
                    hintText: 'Select Smoking',
                    fillColor: AppColors.card,
                    options: const ["Yes", "No", "Occasionally", "Socially"],
                    itemLabelBuilder: (val) => val,
                    onChanged: (val) => setState(() => _smoking = val ?? ''),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  SelectField<String>(
                    label: 'Drinking',
                    value: _drinking,
                    hintText: 'Select Drinking',
                    fillColor: AppColors.card,
                    options: const ["Yes", "No", "Occasionally", "Socially"],
                    itemLabelBuilder: (val) => val,
                    onChanged: (val) => setState(() => _drinking = val ?? ''),
                  ),

                  const SizedBox(height: AppSpacing.md),
                  SelectField<String>(
                    label: 'Personality',
                    value: _personality,
                    hintText: 'Select Personality',
                    fillColor: AppColors.card,
                    options: const ["Introvert", "Extrovert", "Ambivert"],
                    itemLabelBuilder: (val) => val,
                    onChanged: (val) =>
                        setState(() => _personality = val ?? ''),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  SelectField<String>(
                    label: 'Food Preference',
                    value: _foodPreference,
                    hintText: 'Select Food Preference',
                    fillColor: AppColors.card,
                    options: const [
                      "Vegetarian",
                      "Vegan",
                      "Non-vegetarian",
                      "Halal",
                    ],
                    itemLabelBuilder: (val) => val,
                    onChanged: (val) =>
                        setState(() => _foodPreference = val ?? ''),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _buildMultiSelectSection(
                    'Interests',
                    const [
                      "Travel",
                      "Hiking",
                      "Camping",
                      "Backpacking",
                      "Surfing",
                      "Skiing",
                      "Rock Climbing",
                      "Food",
                      "Cooking",
                      "Wine",
                      "Coffee",
                      "Brunch",
                      "Fitness",
                      "Yoga",
                      "Running",
                      "Cycling",
                      "Dance",
                      "Sports",
                      "Football",
                      "Basketball",
                      "Tennis",
                      "Art",
                      "Photography",
                      "Museums",
                      "Concerts",
                      "Festivals",
                      "Music",
                      "Live Music",
                      "Movies",
                      "Netflix",
                      "Podcasts",
                      "Reading",
                      "Books",
                      "Volunteering",
                      "Fashion",
                      "Dogs",
                      "Cats",
                      "Nightlife",
                      "Bars",
                    ],
                    _interests,
                    (val) => setState(
                      () => _interests.contains(val)
                          ? _interests.remove(val)
                          : _interests.add(val),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _buildMultiSelectSection(
                    'Languages',
                    const [
                      "English",
                      "Hindi",
                      "Bengali",
                      "Telugu",
                      "Marathi",
                      "Tamil",
                      "Gujarati",
                      "Urdu",
                      "Kannada",
                      "Malayalam",
                      "Punjabi",
                    ],
                    _languages,
                    (val) => setState(
                      () => _languages.contains(val)
                          ? _languages.remove(val)
                          : _languages.add(val),
                    ),
                  ),
                ],
              ),
            ),
            // const SizedBox(height: AppSpacing.xs),
          ],
        ),
      ),
    );
  }

  Widget _buildDatePicker(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            'Birthday',
            style: AppTextStyles.label.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: () => _showDatePicker(context),
          child: Container(
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.all(Radius.circular(12)),
              border: Border.all(color: AppColors.border, width: 1),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _birthday == null
                      ? 'Select Date'
                      : DateFormat('dd MMM yyyy').format(_birthday!),
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: _birthday == null
                        ? AppColors.mutedForeground
                        : AppColors.foreground,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showDatePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        DateTime tempDate =
            _birthday ??
            DateTime.now().subtract(const Duration(days: 365 * 18));
        return Container(
          height: 320,
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        "Cancel",
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.mutedForeground,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text(
                      "Birthday",
                      style: AppTextStyles.h3.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _birthday = tempDate;
                          // Recalculate age if needed
                          final now = DateTime.now();
                          int age = now.year - _birthday!.year;
                          if (now.month < _birthday!.month ||
                              (now.month == _birthday!.month &&
                                  now.day < _birthday!.day)) {
                            age--;
                          }
                          _age = age.toString();
                        });
                        Navigator.pop(context);
                      },
                      child: Text(
                        "Done",
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(color: AppColors.border, thickness: 0.5),
              Expanded(
                child: FlatDatePicker(
                  initialDate: tempDate,
                  onDateChanged: (date) => tempDate = date,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMultiSelectSection(
    String label,
    List<String> options,
    List<String> selected,
    Function(String) onToggle,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.mutedForeground,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final isSelected = selected.contains(opt);
            return SelectChip(
              label: opt,
              isSelected: isSelected,
              onTap: () => onToggle(opt),
              fillColor: AppColors.card,
            );
          }).toList(),
        ),
      ],
    );
  }
}
