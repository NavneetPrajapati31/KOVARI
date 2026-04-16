import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:mobile/core/network/cloudinary_service.dart';
import 'package:mobile/shared/utils/url_utils.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/shared/widgets/text_input_field.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/location_autocomplete.dart';
import 'package:mobile/shared/widgets/flat_date_picker.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/shared/widgets/kovari_switch_tile.dart';
import 'package:mobile/features/groups/models/group.dart';
import 'package:mobile/features/groups/providers/group_details_provider.dart';
import 'package:mobile/features/groups/widgets/settings_widgets.dart';

/// Base class for Settings Bottom Sheets to ensure consistent iOS look
class SettingsBottomSheet extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final VoidCallback onSave;
  final bool isSubmitting;

  const SettingsBottomSheet({
    super.key,
    required this.title,
    required this.children,
    required this.onSave,
    this.isSubmitting = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: AppTextStyles.h3.copyWith(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(
                  Icons.close,
                  size: 20,
                  color: AppColors.mutedForeground,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
          const SizedBox(height: 24),
          PrimaryButton(
            text: "Save Changes",
            onPressed: isSubmitting ? null : onSave,
            isLoading: isSubmitting,
          ),
        ],
      ),
    );
  }
}

/// 📝 Edit Basic Info (Name, Destination, Description)
class EditBasicInfoSheet extends ConsumerStatefulWidget {
  final GroupModel group;
  const EditBasicInfoSheet({super.key, required this.group});

  @override
  ConsumerState<EditBasicInfoSheet> createState() => _EditBasicInfoSheetState();
}

class _EditBasicInfoSheetState extends ConsumerState<EditBasicInfoSheet> {
  late TextEditingController _nameController;
  late TextEditingController _descController;
  late String _destination;
  dynamic _destinationDetails;
  bool _isSaving = false;

  // Media state
  final ImagePicker _picker = ImagePicker();
  File? _coverImageFile;
  String? _currentCoverUrl;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.group.name);
    _descController = TextEditingController(text: widget.group.description);
    _destination = widget.group.destination;
    _currentCoverUrl = widget.group.coverImage;
  }

  Future<void> _showImageSourceModal() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
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
              "Group Cover Photo",
              style: AppTextStyles.h3.copyWith(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(
                LucideIcons.camera,
                color: AppColors.mutedForeground,
              ),
              title: const Text("Take Photo", style: TextStyle(fontSize: 15)),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(
                LucideIcons.image,
                color: AppColors.mutedForeground,
              ),
              title: const Text(
                "Choose from Gallery",
                style: TextStyle(fontSize: 15),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
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
        _cropImage(pickedFile.path);
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
            toolbarTitle: 'Crop Cover',
            toolbarColor: Colors.black,
            toolbarWidgetColor: Colors.white,
            activeControlsWidgetColor: AppColors.primary,
            lockAspectRatio: true,
            initAspectRatio: CropAspectRatioPreset.ratio16x9,
          ),
          IOSUiSettings(
            title: 'Crop Cover',
            aspectRatioLockEnabled: true,
            resetButtonHidden: true,
            aspectRatioPickerButtonHidden: true,
            cropStyle: CropStyle.rectangle,
          ),
        ],
        aspectRatio: const CropAspectRatio(
          ratioX: 2,
          ratioY: 1,
        ), // Standard group cover ratio
      );

      if (croppedFile != null) {
        setState(() {
          _coverImageFile = File(croppedFile.path);
        });
      }
    } catch (e) {
      debugPrint("Error cropping image: $e");
    }
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    try {
      String? finalCoverUrl = _currentCoverUrl;

      // 1. Upload to Cloudinary if image is new
      if (_coverImageFile != null) {
        final cloudinary = ref.read(cloudinaryServiceProvider);
        final result = await cloudinary.uploadImage(
          _coverImageFile!,
          folder: 'groups',
        );
        finalCoverUrl = result['secure_url'];
      }

      // 2. Patch group
      await ref.read(groupActionsProvider(widget.group.id)).updateGroup({
        'name': _nameController.text,
        'description': _descController.text,
        'destination': _destination,
        'cover_image': finalCoverUrl,
        if (_destinationDetails != null)
          'destination_details': _destinationDetails,
      });

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsBottomSheet(
      title: "Basic Info",
      isSubmitting: _isSaving,
      onSave: _handleSave,
      children: [
        // Cover Image Preview & Edit
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Group Cover",
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.mutedForeground,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: _showImageSourceModal,
              child: Container(
                width: double.infinity,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                  image: _coverImageFile != null
                      ? DecorationImage(
                          image: FileImage(_coverImageFile!),
                          fit: BoxFit.cover,
                        )
                      : (_currentCoverUrl != null
                            ? DecorationImage(
                                image: NetworkImage(
                                  UrlUtils.getFullImageUrl(_currentCoverUrl!) ??
                                      '',
                                ),
                                fit: BoxFit.cover,
                              )
                            : null),
                ),
                child: _coverImageFile == null && _currentCoverUrl == null
                    ? const Center(
                        child: Icon(
                          LucideIcons.imagePlus,
                          size: 32,
                          color: AppColors.mutedForeground,
                        ),
                      )
                    : Align(
                        alignment: Alignment.bottomRight,
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.pencil,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                      ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        TextInputField(
          label: "Group Name",
          controller: _nameController,
          hintText: "Enter group name",
        ),
        const SizedBox(height: 16),
        LocationAutocomplete(
          label: "Destination",
          initialValue: _destination,
          onSelect: (result) {
            setState(() {
              _destination = result.formatted;
              _destinationDetails = {
                'latitude': result.lat,
                'longitude': result.lon,
                'place_id': result.placeId,
                'city': result.city,
                'country': result.country,
              };
            });
          },
        ),
        const SizedBox(height: 16),
        TextInputField(
          label: "Description",
          controller: _descController,
          hintText: "What's this trip about?",
          maxLines: 3,
        ),
      ],
    );
  }
}

/// 📅 Edit Travel Details (Dates, Budget)
class EditTravelDetailsSheet extends ConsumerStatefulWidget {
  final GroupModel group;
  const EditTravelDetailsSheet({super.key, required this.group});

  @override
  ConsumerState<EditTravelDetailsSheet> createState() =>
      _EditTravelDetailsSheetState();
}

class _EditTravelDetailsSheetState
    extends ConsumerState<EditTravelDetailsSheet> {
  late DateTime _startDate;
  late DateTime _endDate;
  late TextEditingController _budgetController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _startDate = widget.group.dateRange.start != null
        ? DateTime.parse(widget.group.dateRange.start!)
        : DateTime.now();
    _endDate = widget.group.dateRange.end != null
        ? DateTime.parse(widget.group.dateRange.end!)
        : DateTime.now().add(const Duration(days: 7));
    _budgetController = TextEditingController(
      text: widget.group.budget?.toString() ?? "0",
    );
  }

  Future<void> _handleSave() async {
    if (_startDate.isAfter(_endDate)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("End date must be after start date")),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      await ref.read(groupActionsProvider(widget.group.id)).updateGroup({
        'start_date': DateFormat('yyyy-MM-dd').format(_startDate),
        'end_date': DateFormat('yyyy-MM-dd').format(_endDate),
        'budget': int.tryParse(_budgetController.text) ?? 0,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsBottomSheet(
      title: "Travel Details",
      isSubmitting: _isSaving,
      onSave: _handleSave,
      children: [
        Text(
          "Start Date",
          style: AppTextStyles.bodySmall.copyWith(
            fontWeight: FontWeight.w500,
            color: AppColors.mutedForeground,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 120,
          child: FlatDatePicker(
            initialDate: _startDate,
            onDateChanged: (date) => setState(() => _startDate = date),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          "End Date",
          style: AppTextStyles.bodySmall.copyWith(
            fontWeight: FontWeight.w500,
            color: AppColors.mutedForeground,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 120,
          child: FlatDatePicker(
            initialDate: _endDate,
            onDateChanged: (date) => setState(() => _endDate = date),
          ),
        ),
        const SizedBox(height: 16),
        TextInputField(
          label: "Estimated Budget",
          controller: _budgetController,
          keyboardType: TextInputType.number,
          hintText: "Enter budget amount",
        ),
      ],
    );
  }
}

/// 🛡️ Edit Privacy & Policies
class EditPoliciesSheet extends ConsumerStatefulWidget {
  final GroupModel group;
  const EditPoliciesSheet({super.key, required this.group});

  @override
  ConsumerState<EditPoliciesSheet> createState() => _EditPoliciesSheetState();
}

class _EditPoliciesSheetState extends ConsumerState<EditPoliciesSheet> {
  late bool _isPublic;
  late bool _nonSmokers;
  late bool _nonDrinkers;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _isPublic = widget.group.privacy == 'public';
    _nonSmokers =
        widget.group.smokingPolicy ==
        'true'; // Backend boolean mapped to string
    _nonDrinkers = widget.group.drinkingPolicy == 'true';
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    try {
      await ref.read(groupActionsProvider(widget.group.id)).updateGroup({
        'is_public': _isPublic,
        'non_smokers': _nonSmokers,
        'non_drinkers': _nonDrinkers,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsBottomSheet(
      title: "Privacy & Policies",
      isSubmitting: _isSaving,
      onSave: _handleSave,
      children: [
        _buildToggleRow(
          "Public Group",
          "Anyone can find and request to join",
          _isPublic,
          (val) => setState(() => _isPublic = val),
        ),
        _buildToggleRow(
          "Strictly Non-Smoking",
          "Members must not smoke during trip",
          _nonSmokers,
          (val) => setState(() => _nonSmokers = val),
        ),
        _buildToggleRow(
          "Strictly Non-Drinking",
          "Sober-friendly trip environment",
          _nonDrinkers,
          (val) => setState(() => _nonDrinkers = val),
        ),
      ],
    );
  }

  Widget _buildToggleRow(
    String title,
    String subtitle,
    bool value,
    Function(bool) onChanged,
  ) {
    return KovariSwitchTile(
      label: title,
      subtitle: subtitle,
      value: value,
      onChanged: onChanged,
      margin: const EdgeInsets.only(bottom: 12),
    );
  }
}
