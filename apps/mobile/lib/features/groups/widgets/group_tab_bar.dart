import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/haptic_service.dart';

class GroupTabBar extends StatelessWidget {
  final int activeIndex;
  final Function(int) onTabChanged;

  const GroupTabBar({
    super.key,
    required this.activeIndex,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    final tabs = ['Overview', 'Chats', 'Itinerary', 'Settings'];

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.only(left: 14, right: 14, top: 4, bottom: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(tabs.length, (index) {
            final isSelected = activeIndex == index;
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: _buildTabButton(context, tabs[index], isSelected, index),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildTabButton(
    BuildContext context,
    String label,
    bool isSelected,
    int index,
  ) {
    return InkWell(
      onTap: () {
        HapticService.selection();
        onTabChanged(index);
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.cardColor(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderColor(context), width: 1),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w600,
            color: isSelected
                ? AppColors.primary
                : AppColors.text(context, isMuted: true),
          ),
        ),
      ),
    );
  }
}
