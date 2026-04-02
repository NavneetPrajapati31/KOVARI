import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class FlatDatePicker extends StatefulWidget {
  final DateTime initialDate;
  final ValueChanged<DateTime> onDateChanged;

  const FlatDatePicker({
    super.key,
    required this.initialDate,
    required this.onDateChanged,
  });

  @override
  State<FlatDatePicker> createState() => _FlatDatePickerState();
}

class _FlatDatePickerState extends State<FlatDatePicker> {
  late FixedExtentScrollController _dayController;
  late FixedExtentScrollController _monthController;
  late FixedExtentScrollController _yearController;

  late int _selectedDay;
  late int _selectedMonth;
  late int _selectedYear;

  final List<String> _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  final List<int> _years = List.generate(125, (i) => DateTime.now().year - i);

  @override
  void initState() {
    super.initState();
    _selectedDay = widget.initialDate.day;
    _selectedMonth = widget.initialDate.month;
    _selectedYear = widget.initialDate.year;

    _dayController = FixedExtentScrollController(initialItem: _selectedDay - 1);
    _monthController = FixedExtentScrollController(initialItem: _selectedMonth - 1);
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
    const double diameterRatio = 10.0;

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
                  childCount: DateTime(_selectedYear, _selectedMonth + 1, 0).day,
                  builder: (context, i) => _buildItem("${i + 1}"),
                ),
              ),
            ),
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
