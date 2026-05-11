import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/network/cloudinary_service.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_spacing.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/features/groups/providers/entity_stores.dart';
import 'package:mobile/features/groups/providers/group_provider.dart';
import 'package:mobile/shared/widgets/app_card.dart';
import 'package:mobile/shared/widgets/kovari_snackbar.dart';
import 'package:mobile/shared/widgets/kovari_switch_tile.dart';
import 'package:mobile/shared/widgets/location_autocomplete.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/text_input_field.dart';

class CreateGroupScreen extends ConsumerStatefulWidget {
  const CreateGroupScreen({super.key});

  @override
  ConsumerState<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends ConsumerState<CreateGroupScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _budgetController = TextEditingController(text: '10000');
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
        final cloudinaryService = ref.read(cloudinaryServiceProvider);

        final result = await cloudinaryService.uploadImage(
          _imageFile!,
          folder: 'kovari-groups',
        );

        setState(() {
          _coverImageUrl = result['secure_url'] as String?;
          _isUploadingImage = false;
        });
      } catch (e) {
        setState(() => _isUploadingImage = false);
        if (mounted) {
          KovariSnackbar.error(context, 'Image upload failed: $e');
        }
      }
    }
  }

  Future<void> _selectDate(BuildContext context, bool isStartDate) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStartDate ? _startDate : _endDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) => Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppColors.primary,
              primary: AppColors.primary,
              onPrimary: AppColors.primaryForeground,
              surface: AppColors.surface(context, level: 1),
              onSurface: AppColors.text(context),
              brightness: Theme.of(context).brightness,
            ),
          ),
          child: child!,
        ),
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
      KovariSnackbar.info(context, 'Please select a destination');
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
      final newGroup = await groupService.createGroup(payload);

      // 🚀 Optimistic injection: Add the new group to the list immediately
      ref.read(myGroupsStoreProvider.notifier).patch((groups) {
        if (groups.any((g) => g.id == newGroup.id)) return groups;
        return [newGroup, ...groups];
      });

      // Refresh to ensure server sync (SWR will maintain our optimistic list)
      await ref.read(myGroupsStoreProvider.notifier).refresh();

      if (mounted) {
        KovariSnackbar.success(context, 'Group created successfully!');
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        KovariSnackbar.error(context, 'Failed to create group: $e');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.x, color: AppColors.text(context), size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Create a new group',
          style: TextStyle(
            color: AppColors.text(context),
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
                label: 'Group name',
                controller: _nameController,
                hintText: 'Enter group name',
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  if (v.trim().length < 3) {
                    return 'Name must be at least 3 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.md),

              LocationAutocomplete(
                label: 'Destination',
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
                label: 'Budget per person (INR)',
                controller: _budgetController,
                keyboardType: TextInputType.number,
                hintText: 'e.g. 10000',
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: AppSpacing.md),

              _buildDatePicker(
                context,
                'Start date',
                _startDate,
                () => _selectDate(context, true),
              ),
              const SizedBox(height: AppSpacing.md),
              _buildDatePicker(
                context,
                'End date',
                _endDate,
                () => _selectDate(context, false),
              ),
              const SizedBox(height: AppSpacing.md),

              _buildImagePicker(context),
              const SizedBox(height: AppSpacing.md),

              TextInputField(
                label: 'Description',
                controller: _descriptionController,
                hintText: 'Tell people what your group is about...',
                maxLines: 4,
                maxLength: 500,
              ),
              const SizedBox(height: AppSpacing.md),

              KovariSwitchTile(
                label: 'Make group public',
                value: _isPublic,
                onChanged: (e) => setState(() => _isPublic = e),
              ),
              KovariSwitchTile(
                label: 'Strictly non-smoking group',
                value: _nonSmoking,
                onChanged: (e) => setState(() => _nonSmoking = e),
              ),
              KovariSwitchTile(
                label: 'Strictly non-drinking group',
                value: _nonDrinking,
                onChanged: (e) => setState(() => _nonDrinking = e),
              ),

              // const SizedBox(height: AppSpacing.xs),
              PrimaryButton(
                text: 'Create Group',
                onPressed: _submit,
                isLoading: _isSubmitting,
                height: 42,
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );

  Widget _buildDatePicker(
    BuildContext context,
    String label,
    DateTime date,
    VoidCallback onTap,
  ) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            label,
            style: AppTextStyles.label.copyWith(
              color: AppColors.text(context, isMuted: true),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          child: AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            borderRadius: BorderRadius.circular(12),
            child: Row(
              children: [
                Icon(
                  LucideIcons.calendar,
                  size: 16,
                  color: AppColors.text(context, isMuted: true),
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat('MMM d, yyyy').format(date),
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppColors.text(context),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );

  Widget _buildImagePicker(BuildContext context) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            'Upload Group Cover Image',
            style: AppTextStyles.label.copyWith(
              color: AppColors.text(context, isMuted: true),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: _isUploadingImage ? null : _pickImage,
          child: AppCard(
            height: 120,
            width: double.infinity,
            borderRadius: BorderRadius.circular(12),
            child: _coverImageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: _coverImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => const Center(
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
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
                        Icon(
                          LucideIcons.image,
                          color: AppColors.text(context, isMuted: true),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap to select image',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.text(context, isMuted: true),
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
