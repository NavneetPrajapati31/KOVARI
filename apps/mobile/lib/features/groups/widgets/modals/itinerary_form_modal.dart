import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/secondary_button.dart';
import '../../../../shared/widgets/text_input_field.dart';
import '../../../../shared/widgets/select_field.dart';
import '../../models/group.dart';
import '../../providers/group_details_provider.dart';

class ItineraryFormModal extends ConsumerStatefulWidget {
  final String groupId;
  final ItineraryItem? initialItem;
  final String? initialStatus;

  const ItineraryFormModal({
    super.key,
    required this.groupId,
    this.initialItem,
    this.initialStatus,
  });

  @override
  ConsumerState<ItineraryFormModal> createState() => _ItineraryFormModalState();
}

class _ItineraryFormModalState extends ConsumerState<ItineraryFormModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _locationController;
  late TextEditingController _notesController;
  late DateTime _selectedDate;
  late TimeOfDay _selectedTime;
  late String _selectedType;
  late String _selectedStatus;
  late String _selectedPriority;
  List<String> _selectedAssignedTo = [];
  bool _isSubmitting = false;

  final List<String> _statuses = [
    'pending',
    'confirmed',
    'completed',
    'cancelled',
  ];
  final List<String> _priorities = ['low', 'medium', 'high'];

  @override
  void initState() {
    super.initState();
    final item = widget.initialItem;
    _titleController = TextEditingController(text: item?.title ?? '');
    _descriptionController = TextEditingController(
      text: item?.description ?? '',
    );
    _locationController = TextEditingController(text: item?.location ?? '');
    _notesController = TextEditingController(text: item?.notes ?? '');

    DateTime initialDateTime = DateTime.now();
    if (item?.datetime != null) {
      try {
        initialDateTime = DateTime.parse(item!.datetime);
      } catch (e) {
        initialDateTime = DateTime.now();
      }
    }
    _selectedDate = initialDateTime;
    _selectedTime = TimeOfDay.fromDateTime(initialDateTime);

    _selectedType = item?.type ?? 'other';
    _selectedStatus = item?.status ?? widget.initialStatus ?? 'pending';
    _selectedPriority = item?.priority ?? 'medium';
    _selectedAssignedTo = item?.assignedTo ?? [];
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime date) {
    return DateFormat('MMMM d, y').format(date);
  }

  String _formatTime(TimeOfDay time) {
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    return DateFormat('HH:mm').format(dt);
  }

  Future<void> _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
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
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _pickTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
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
    if (picked != null && picked != _selectedTime) {
      setState(() {
        _selectedTime = picked;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final combinedDateTime = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        _selectedTime.hour,
        _selectedTime.minute,
      ).toIso8601String();

      final data = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'datetime': combinedDateTime,
        'type': _selectedType,
        'status': _selectedStatus,
        'location': _locationController.text.trim(),
        'priority': _selectedPriority,
        'assigned_to': _selectedAssignedTo,
        'group_id': widget.groupId,
        'notes': _notesController.text.trim(),
      };

      final notifier = ref.read(groupActionsProvider(widget.groupId));
      if (widget.initialItem != null) {
        await notifier.updateItineraryItem(widget.initialItem!.id, data);
      } else {
        await notifier.createItineraryItem(data);
      }

      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(groupMembersProvider(widget.groupId));

    return Dialog(
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        constraints: const BoxConstraints(maxWidth: 450),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.initialItem == null
                              ? 'Add Itinerary Item'
                              : 'Edit Itinerary Item',
                          style: AppTextStyles.h2.copyWith(
                            fontSize: 14,
                            color: AppColors.foreground,
                            letterSpacing: 0,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.initialItem == null
                              ? 'Create a new activity or event for your group.'
                              : 'Update the details of this itinerary item.',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.mutedForeground,
                            height: 1.3,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Divider(height: 1, color: AppColors.border),

            // Scrollable Form Content
            Flexible(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 20,
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextInputField(
                          label: 'Title',
                          controller: _titleController,
                          hintText: 'Activity title',
                          validator: (v) =>
                              v?.isEmpty == true ? 'Title is required' : null,
                        ),
                        const SizedBox(height: 20),

                        TextInputField(
                          label: 'Description',
                          controller: _descriptionController,
                          hintText: 'Activity description',
                          maxLines: 3,
                        ),
                        const SizedBox(height: 20),

                        Padding(
                          padding: const EdgeInsets.only(left: 4),
                          child: Text(
                            'Date & Time',
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.mutedForeground,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: GestureDetector(
                                onTap: _pickDate,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.border),
                                    borderRadius: BorderRadius.circular(12),
                                    color: AppColors.background,
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        LucideIcons.calendar,
                                        size: 16,
                                        color: AppColors.mutedForeground,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          _formatDate(_selectedDate),
                                          overflow: TextOverflow.ellipsis,
                                          style: AppTextStyles.bodyMedium
                                              .copyWith(
                                                fontWeight: FontWeight.w500,
                                              ),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(
                                        LucideIcons.chevronDown,
                                        size: 14,
                                        color: AppColors.mutedForeground,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 2,
                              child: GestureDetector(
                                onTap: _pickTime,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.border),
                                    borderRadius: BorderRadius.circular(12),
                                    color: AppColors.background,
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        LucideIcons.clock,
                                        size: 16,
                                        color: AppColors.mutedForeground,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _formatTime(_selectedTime),
                                        style: AppTextStyles.bodyMedium
                                            .copyWith(
                                              fontWeight: FontWeight.w500,
                                            ),
                                      ),
                                      const Spacer(),
                                      const Icon(
                                        LucideIcons.chevronDown,
                                        size: 14,
                                        color: AppColors.mutedForeground,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        TextInputField(
                          label: 'Location',
                          controller: _locationController,
                          hintText: 'Where is this happening?',
                          prefixIcon: const Icon(
                            LucideIcons.mapPin,
                            size: 16,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                        const SizedBox(height: 20),
                        SelectField<String>(
                          label: 'Priority',
                          value: _selectedPriority,
                          hintText: 'Select priority',
                          options: _priorities,
                          itemLabelBuilder: (p) =>
                              p[0].toUpperCase() + p.substring(1),
                          onChanged: (v) =>
                              setState(() => _selectedPriority = v!),
                        ),

                        const SizedBox(height: 20),

                        SelectField<String>(
                          label: 'Status',
                          value: _selectedStatus,
                          hintText: 'Select status',
                          options: _statuses,
                          itemLabelBuilder: (s) =>
                              s[0].toUpperCase() + s.substring(1),
                          onChanged: (v) =>
                              setState(() => _selectedStatus = v!),
                        ),
                        const SizedBox(height: 20),

                        TextInputField(
                          label: 'Notes',
                          controller: _notesController,
                          hintText: 'Additional notes',
                          maxLines: 3,
                        ),
                        const SizedBox(height: 20),

                        Padding(
                          padding: const EdgeInsets.only(left: 4),
                          child: Text(
                            'Assigned To',
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.mutedForeground,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        membersAsync.when(
                          data: (members) => Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: members.map((member) {
                              final isSelected = _selectedAssignedTo.contains(
                                member.id,
                              );
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      if (isSelected) {
                                        _selectedAssignedTo.remove(member.id);
                                      } else {
                                        _selectedAssignedTo.add(member.id);
                                      }
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      border: Border.all(
                                        color: AppColors.border,
                                      ),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      children: [
                                        if (member.avatar != null) ...[
                                          CircleAvatar(
                                            radius: 15,
                                            backgroundImage: NetworkImage(
                                              member.avatar!,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                        ],
                                        Expanded(
                                          child: Text(
                                            member.name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: AppTextStyles.bodySmall
                                                .copyWith(
                                                  color: AppColors.foreground,
                                                  fontWeight: FontWeight.w500,
                                                  fontSize: 13,
                                                ),
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
                              );
                            }).toList(),
                          ),
                          loading: () => const Center(
                            child: SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                          error: (e, s) => const Text('Error loading members'),
                        ), // Buffer for the bottom
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Sticky Action Buttons
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: SecondaryButton(
                      text: 'Cancel',
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: PrimaryButton(
                      text: widget.initialItem == null
                          ? 'Add Item'
                          : 'Update Item',
                      onPressed: _submit,
                      isLoading: _isSubmitting,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
