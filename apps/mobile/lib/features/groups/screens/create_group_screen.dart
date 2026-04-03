import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/network/cloudinary_service.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/location_autocomplete.dart';
import '../../../shared/widgets/text_input_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/kovari_switch_tile.dart';
import '../providers/group_provider.dart';

class CreateGroupScreen extends ConsumerStatefulWidget {
  const CreateGroupScreen({super.key});

  @override
  ConsumerState<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends ConsumerState<CreateGroupScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _budgetController = TextEditingController(text: "10000");
  final _descriptionController = TextEditingController();

  String? _destination;
  Map<String, dynamic>? _destinationDetails;

  DateTime _startDate = DateTime.now().add(const Duration(days: 1));
  DateTime _endDate = DateTime.now().add(const Duration(days: 2));

  bool _isPublic = true;
  bool _nonSmoking = false;
  bool _nonDrinking = false;

  File? _imageFile;
  String? _coverImageUrl;
  bool _isUploadingImage = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _budgetController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
    );

    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
        _isUploadingImage = true;
      });

      try {
        final cloudinaryService = CloudinaryService(
          ref.read(apiClientProvider),
        );

        final url = await cloudinaryService.uploadImage(
          _imageFile!,
          folder: 'kovari-groups',
        );

        setState(() {
          _coverImageUrl = url;
          _isUploadingImage = false;
        });
      } catch (e) {
        setState(() => _isUploadingImage = false);
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Image upload failed: $e')));
        }
      }
    }
  }

  Future<void> _selectDate(BuildContext context, bool isStartDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStartDate ? _startDate : _endDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.foreground,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isStartDate) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate) ||
              _endDate.isAtSameMomentAs(_startDate)) {
            _endDate = _startDate.add(const Duration(days: 1));
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a destination')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final payload = {
        'name': _nameController.text,
        'destination': _destination,
        'destination_details': _destinationDetails,
        'start_date': DateFormat('yyyy-MM-dd').format(_startDate),
        'end_date': DateFormat('yyyy-MM-dd').format(_endDate),
        'is_public': _isPublic,
        'non_smokers': _nonSmoking,
        'non_drinkers': _nonDrinking,
        'description': _descriptionController.text,
        'cover_image': _coverImageUrl,
        'budget': int.tryParse(_budgetController.text) ?? 10000,
      };

      final groupService = ref.read(groupServiceProvider);
      await groupService.createGroup(payload);

      // Refresh groups list
      ref.invalidate(myGroupsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group created successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to create group: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.card,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            LucideIcons.x,
            color: AppColors.foreground,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Create a new group",
          style: TextStyle(
            color: AppColors.foreground,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextInputField(
                label: "Group name",
                controller: _nameController,
                hintText: "Enter group name",
                validator: (v) => (v == null || v.isEmpty) ? "Required" : null,
              ),
              const SizedBox(height: AppSpacing.md),

              LocationAutocomplete(
                label: "Destination",
                onSelect: (result) {
                  setState(() {
                    _destination = result.city.isNotEmpty
                        ? result.city
                        : result.formatted.split(',')[0];
                    _destinationDetails = {
                      'city': result.city,
                      'state': result.state,
                      'country': result.country,
                      'latitude': result.lat,
                      'longitude': result.lon,
                      'formatted_address': result.formatted,
                      'place_id': result.placeId,
                    };
                  });
                },
              ),
              const SizedBox(height: AppSpacing.md),

              TextInputField(
                label: "Budget per person (INR)",
                controller: _budgetController,
                keyboardType: TextInputType.number,
                hintText: "e.g. 10000",
                validator: (v) => (v == null || v.isEmpty) ? "Required" : null,
              ),
              const SizedBox(height: AppSpacing.md),

              _buildDatePicker(
                "Start date",
                _startDate,
                () => _selectDate(context, true),
              ),
              const SizedBox(height: AppSpacing.md),
              _buildDatePicker(
                "End date",
                _endDate,
                () => _selectDate(context, false),
              ),
              const SizedBox(height: AppSpacing.md),

              _buildImagePicker(),
              const SizedBox(height: AppSpacing.md),

              TextInputField(
                label: "Description",
                controller: _descriptionController,
                hintText: "Tell people what your group is about...",
                maxLines: 4,
                maxLength: 500,
              ),
              const SizedBox(height: AppSpacing.md),

              KovariSwitchTile(
                label: "Make group public",
                value: _isPublic,
                onChanged: (e) => setState(() => _isPublic = e),
              ),
              KovariSwitchTile(
                label: "Strictly non-smoking group",
                value: _nonSmoking,
                onChanged: (e) => setState(() => _nonSmoking = e),
              ),
              KovariSwitchTile(
                label: "Strictly non-drinking group",
                value: _nonDrinking,
                onChanged: (e) => setState(() => _nonDrinking = e),
              ),

              // const SizedBox(height: AppSpacing.xs),
              PrimaryButton(
                text: "Create Group",
                onPressed: _submit,
                isLoading: _isSubmitting,
                height: 44,
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDatePicker(String label, DateTime date, VoidCallback onTap) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            label,
            style: AppTextStyles.label.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.calendar,
                  size: 16,
                  color: AppColors.mutedForeground,
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat('MMM d, yyyy').format(date),
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            "Upload Group Cover Image",
            style: AppTextStyles.label.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: _isUploadingImage ? null : _pickImage,
          child: Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: _coverImageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(_coverImageUrl!, fit: BoxFit.cover),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_isUploadingImage)
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      else ...[
                        const Icon(
                          LucideIcons.image,
                          color: AppColors.mutedForeground,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "Tap to select image",
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ],
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
