import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/secondary_button.dart';
import '../../../../shared/widgets/select_field.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../providers/onboarding_provider.dart';

class GenderBirthStep extends ConsumerWidget {
  const GenderBirthStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingProvider);
    final genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.sm),
          Text(
            "About you",
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            "Select your gender and date of birth",
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.mutedForeground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),

          // Modern Gender Dropdown Selection
          SelectField<String>(
            label: 'Gender',
            value: state.gender,
            hintText: 'Select gender',
            options: genderOptions,
            itemLabelBuilder: (v) => v,
            onChanged: (v) => ref
                .read(onboardingProvider.notifier)
                .updateGenderBirth(gender: v),
          ),
          const SizedBox(height: AppSpacing.md),

          // Birthday Selection mirroring web date picker
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Birthday', style: AppTextStyles.label),
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: () => _showDatePicker(context, ref, state.birthday),
            borderRadius: AppRadius.large,
            child: Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: AppRadius.large,
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    state.birthday == null
                        ? 'Select Date'
                        : DateFormat('dd MMM yyyy').format(state.birthday!),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: state.birthday == null
                          ? AppColors.mutedForeground
                          : AppColors.foreground,
                    ),
                  ),
                  const Icon(
                    LucideIcons.calendar,
                    size: 18,
                    color: AppColors.mutedForeground,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  text: 'Back',
                  icon: LucideIcons.chevronLeft,
                  onPressed: () =>
                      ref.read(onboardingProvider.notifier).setStep(2),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: PrimaryButton(
                  text: 'Continue',
                  onPressed: (state.gender != null && state.birthday != null)
                      ? () {
                          final today = DateTime.now();
                          var age = today.year - state.birthday!.year;
                          if (today.month < state.birthday!.month ||
                              (today.month == state.birthday!.month &&
                                  today.day < state.birthday!.day)) {
                            age--;
                          }
                          if (age < 18) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'You must be at least 18 years old',
                                ),
                                backgroundColor: AppColors.destructive,
                              ),
                            );
                            return;
                          }
                          ref.read(onboardingProvider.notifier).setStep(4);
                        }
                      : null,
                  icon: LucideIcons.chevronRight,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }

  void _showDatePicker(BuildContext context, WidgetRef ref, DateTime? current) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        DateTime tempDate =
            current ?? DateTime.now().subtract(const Duration(days: 365 * 18));
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
                        ref
                            .read(onboardingProvider.notifier)
                            .updateGenderBirth(birthday: tempDate);
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
                child: Theme(
                  data: ThemeData.light().copyWith(
                    cupertinoOverrideTheme: const CupertinoThemeData(
                      textTheme: CupertinoTextThemeData(
                        dateTimePickerTextStyle: TextStyle(
                          fontSize: 20,
                          color: AppColors.foreground,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  child: _FlatDatePicker(
                    initialDate: tempDate,
                    onDateChanged: (date) => tempDate = date,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _FlatDatePicker extends StatefulWidget {
  final DateTime initialDate;
  final ValueChanged<DateTime> onDateChanged;

  const _FlatDatePicker({
    required this.initialDate,
    required this.onDateChanged,
  });

  @override
  State<_FlatDatePicker> createState() => _FlatDatePickerState();
}

class _FlatDatePickerState extends State<_FlatDatePicker> {
  late FixedExtentScrollController _dayController;
  late FixedExtentScrollController _monthController;
  late FixedExtentScrollController _yearController;

  late int _selectedDay;
  late int _selectedMonth;
  late int _selectedYear;

  final List<String> _months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  final List<int> _years = List.generate(125, (i) => DateTime.now().year - i);

  @override
  void initState() {
    super.initState();
    _selectedDay = widget.initialDate.day;
    _selectedMonth = widget.initialDate.month;
    _selectedYear = widget.initialDate.year;

    _dayController = FixedExtentScrollController(initialItem: _selectedDay - 1);
    _monthController = FixedExtentScrollController(
      initialItem: _selectedMonth - 1,
    );
    _yearController = FixedExtentScrollController(
      initialItem: _years.indexOf(_selectedYear),
    );
  }

  void _onChanged() {
    final daysInMonth = DateTime(_selectedYear, _selectedMonth + 1, 0).day;
    if (_selectedDay > daysInMonth) {
      _selectedDay = daysInMonth;
    }

    final newDate = DateTime(_selectedYear, _selectedMonth, _selectedDay);
    widget.onDateChanged(newDate);
  }

  @override
  Widget build(BuildContext context) {
    const double itemHeight = 45;
    const double diameterRatio = 10.0; // The secret to the "Straight Line" look

    return Stack(
      children: [
        Center(
          child: Container(
            height: itemHeight,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        Row(
          children: [
            // Month
            Expanded(
              flex: 3,
              child: ListWheelScrollView.useDelegate(
                controller: _monthController,
                itemExtent: itemHeight,
                diameterRatio: diameterRatio,
                physics: const FixedExtentScrollPhysics(),
                onSelectedItemChanged: (i) {
                  setState(() => _selectedMonth = i + 1);
                  _onChanged();
                },
                childDelegate: ListWheelChildBuilderDelegate(
                  childCount: _months.length,
                  builder: (context, i) => _buildItem(_months[i]),
                ),
              ),
            ),
            // Day
            Expanded(
              flex: 2,
              child: ListWheelScrollView.useDelegate(
                controller: _dayController,
                itemExtent: itemHeight,
                diameterRatio: diameterRatio,
                physics: const FixedExtentScrollPhysics(),
                onSelectedItemChanged: (i) {
                  setState(() => _selectedDay = i + 1);
                  _onChanged();
                },
                childDelegate: ListWheelChildBuilderDelegate(
                  childCount: DateTime(
                    _selectedYear,
                    _selectedMonth + 1,
                    0,
                  ).day,
                  builder: (context, i) => _buildItem("${i + 1}"),
                ),
              ),
            ),
            // Year
            Expanded(
              flex: 2,
              child: ListWheelScrollView.useDelegate(
                controller: _yearController,
                itemExtent: itemHeight,
                diameterRatio: diameterRatio,
                physics: const FixedExtentScrollPhysics(),
                onSelectedItemChanged: (i) {
                  setState(() => _selectedYear = _years[i]);
                  _onChanged();
                },
                childDelegate: ListWheelChildBuilderDelegate(
                  childCount: _years.length,
                  builder: (context, i) => _buildItem("${_years[i]}"),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildItem(String text) {
    return Center(
      child: Text(
        text,
        style: AppTextStyles.bodyMedium.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.w500,
          color: AppColors.foreground,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _dayController.dispose();
    _monthController.dispose();
    _yearController.dispose();
    super.dispose();
  }
}
