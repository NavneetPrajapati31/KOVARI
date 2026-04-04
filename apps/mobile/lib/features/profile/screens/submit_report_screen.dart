import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/network/cloudinary_service.dart';
import '../providers/safety_provider.dart';

class SubmitReportScreen extends ConsumerStatefulWidget {
  final String targetType;
  final String targetId;
  final String targetName;

  const SubmitReportScreen({
    super.key,
    required this.targetType,
    required this.targetId,
    required this.targetName,
  });

  @override
  ConsumerState<SubmitReportScreen> createState() => _SubmitReportScreenState();
}

class _SubmitReportScreenState extends ConsumerState<SubmitReportScreen> {
  String? _selectedReason;
  final TextEditingController _customReasonController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  File? _evidenceFile;
  bool _isUploading = false;

  final Map<String, List<String>> _reasons = {
    'user': [
      'Spam',
      'Harassment or bullying',
      'Hate speech',
      'Nudity or sexual activity',
      'Scams or fraud',
      'Violence or dangerous content',
      'Suicide or self-injury',
      'Underage',
      'Other',
    ],
    'group': [
      'Spam',
      'Hate speech',
      'Harassment',
      'Nudity or sexual content',
      'Violence or harmful content',
      'Misinformation',
      'Illegal activities',
      'Other',
    ],
  };

  @override
  void dispose() {
    _customReasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _evidenceFile = File(pickedFile.path);
      });
    }
  }

  void _removeEvidence() {
    setState(() {
      _evidenceFile = null;
    });
  }

  Future<void> _submit() async {
    if (_selectedReason == null) return;

    final notifier = ref.read(safetyProvider.notifier);
    String? evidenceUrl;
    String? evidencePublicId;

    setState(() {
      _isUploading = true;
    });

    try {
      if (_evidenceFile != null) {
        final cloudinary = ref.read(cloudinaryServiceProvider);
        final result = await cloudinary.uploadImage(_evidenceFile!);
        evidenceUrl = result['secure_url'];
        evidencePublicId = result['public_id'];
      }

      final finalReason = _selectedReason == 'Other'
          ? _customReasonController.text.trim()
          : _selectedReason!;

      if (finalReason.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please specify a reason')),
        );
        setState(() {
          _isUploading = false;
        });
        return;
      }

      await notifier.submitReport(
        targetType: widget.targetType,
        targetId: widget.targetId,
        reason: finalReason,
        evidenceUrl: evidenceUrl,
        evidencePublicId: evidencePublicId,
      );

      final state = ref.read(safetyProvider);
      if (state.isSubmissionSuccess) {
        if (mounted) {
          _showSuccessAndExit();
        }
      } else if (state.submissionError != null) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.submissionError!)));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Submission failed: $e')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  void _showSuccessAndExit() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.check,
                  color: Colors.green,
                  size: 40,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Report Submitted',
                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Text(
                'Thank you for reporting. Our team will review this case within 24 hours and take appropriate action.',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.mutedForeground,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close dialog
                    Navigator.of(context).pop(); // Exit Submit
                    Navigator.of(context).pop(); // Exit Search
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.foreground,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Back to Safety',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(safetyProvider);
    final reasons = _reasons[widget.targetType] ?? [];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        leadingWidth: 100,
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            padding: const EdgeInsets.only(left: 8),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.chevronLeft,
                  color: AppColors.primary,
                  size: 24,
                ),
                Text(
                  'Search',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppColors.border.withOpacity(0.5), height: 1),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHero(),
              const SizedBox(height: 32),
              _buildSectionTitle('SELECT A REASON'),
              _buildReasonList(reasons),
              const SizedBox(height: 24),
              if (_selectedReason == 'Other') ...[
                _buildSectionTitle('PLEASE SPECIFY'),
                TextField(
                  controller: _customReasonController,
                  maxLines: 3,
                  style: AppTextStyles.bodyMedium,
                  decoration: _inputDecoration(
                    'Briefly describe what happened...',
                  ),
                ),
                const SizedBox(height: 24),
              ],
              _buildSectionTitle('ATTACH EVIDENCE (OPTIONAL)'),
              _buildEvidencePicker(),
              const SizedBox(height: 24),
              _buildSectionTitle('ADDITIONAL CONTEXT (OPTIONAL)'),
              TextField(
                controller: _notesController,
                maxLines: 2,
                maxLength: 300,
                style: AppTextStyles.bodyMedium,
                decoration: _inputDecoration(
                  'Provide any additional details...',
                ),
              ),
              const SizedBox(height: 32),
              _buildSubmitButton(state),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.flag, size: 20, color: AppColors.primary),
            const SizedBox(width: 10),
            Text(
              'Report ${widget.targetType == 'user' ? 'Member' : 'Group'}',
              style: AppTextStyles.h3.copyWith(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          'Help us understand what went wrong with ${widget.targetName}. Your report is confidential.',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.mutedForeground,
            fontSize: 15,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(
        title,
        style: AppTextStyles.bodySmall.copyWith(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.mutedForeground,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.all(16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
    );
  }

  Widget _buildReasonList(List<String> reasons) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: reasons.map((r) {
          final isSelected = _selectedReason == r;
          return Column(
            children: [
              InkWell(
                onTap: () => setState(() => _selectedReason = r),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        r,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: isSelected
                              ? AppColors.foreground
                              : AppColors.mutedForeground,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                      if (isSelected)
                        const Icon(
                          LucideIcons.check,
                          size: 18,
                          color: AppColors.primary,
                        ),
                    ],
                  ),
                ),
              ),
              if (r != reasons.last)
                const Divider(
                  height: 1,
                  color: AppColors.border,
                  indent: 16,
                  endIndent: 16,
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEvidencePicker() {
    return Column(
      children: [
        if (_evidenceFile != null)
          Stack(
            children: [
              Container(
                width: double.infinity,
                height: 180,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: DecorationImage(
                    image: FileImage(_evidenceFile!),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: IconButton(
                  icon: const Icon(
                    LucideIcons.circleX,
                    color: Colors.white,
                    size: 24,
                  ),
                  onPressed: _removeEvidence,
                ),
              ),
            ],
          )
        else
          InkWell(
            onTap: _pickImage,
            child: Container(
              width: double.infinity,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.border,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    LucideIcons.image,
                    color: AppColors.mutedForeground,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap to select a photo',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'PNG, JPG, JPEG up to 5MB',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.mutedForeground,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildSubmitButton(SafetyState state) {
    final canSubmit =
        _selectedReason != null &&
        (_selectedReason != 'Other' ||
            _customReasonController.text.trim().isNotEmpty) &&
        !_isUploading &&
        !state.isSubmitting;

    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          disabledBackgroundColor: AppColors.mutedForeground.withOpacity(0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          elevation: 0,
        ),
        onPressed: canSubmit ? _submit : null,
        child: _isUploading || state.isSubmitting
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : const Text(
                'Submit Report',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
      ),
    );
  }
}
