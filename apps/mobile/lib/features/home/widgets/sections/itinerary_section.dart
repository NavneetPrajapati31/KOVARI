import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_radius.dart';

enum EventColor { sky, amber, violet, rose, emerald, orange }

class MockEvent {
  final String id;
  final String title;
  final String? description;
  final DateTime start;
  final DateTime end;
  final String? location;
  final EventColor color;
  final bool allDay;

  MockEvent({
    required this.id,
    required this.title,
    this.description,
    required this.start,
    required this.end,
    this.location,
    this.color = EventColor.sky,
    this.allDay = false,
  });
}

class ItinerarySection extends StatelessWidget {
  final List<MockEvent> events;
  final bool isLoading;

  const ItinerarySection({
    super.key,
    required this.events,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        border: Border.all(color: AppColors.border),
        borderRadius: AppRadius.large,
      ),
      child: ClipRRect(
        borderRadius: AppRadius.large,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Itinerary',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Your upcoming events and activities',
                    style: AppTextStyles.label.copyWith(
                      fontSize: 12,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),

            if (isLoading)
              _buildSkeleton()
            else if (events.isEmpty)
              _buildEmptyState()
            else
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md,
                  0,
                  AppSpacing.md,
                  AppSpacing.lg,
                ),
                child: _buildEventList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventList() {
    // Group events by day
    final Map<DateTime, List<MockEvent>> groupedEvents = {};
    for (var event in events) {
      final date = DateTime(
        event.start.year,
        event.start.month,
        event.start.day,
      );
      if (!groupedEvents.containsKey(date)) {
        groupedEvents[date] = [];
      }
      groupedEvents[date]!.add(event);
    }

    final sortedDates = groupedEvents.keys.toList()..sort();

    return Column(
      children: sortedDates.map((date) {
        return _DayGroup(date: date, events: groupedEvents[date]!);
      }).toList(),
    );
  }

  Widget _buildSkeleton() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: AppColors.muted.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
      child: Center(
        child: Column(
          children: [
            Text(
              'No events found',
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'There are no events scheduled for this time period.',
              textAlign: TextAlign.center,
              style: AppTextStyles.label.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DayGroup extends StatelessWidget {
  final DateTime date;
  final List<MockEvent> events;

  const _DayGroup({required this.date, required this.events});

  @override
  Widget build(BuildContext context) {
    final isToday = DateUtils.isSameDay(date, DateTime.now());
    final dateStr = DateFormat('d MMM, EEEE').format(date);

    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                dateStr.toUpperCase(),
                style: AppTextStyles.label.copyWith(
                  fontSize: 10,
                  fontWeight: isToday ? FontWeight.w600 : FontWeight.w400,
                  letterSpacing: 0.5,
                  color: AppColors.foreground,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              const Expanded(
                child: Divider(color: AppColors.border, thickness: 0.7),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            children: events.map((event) => _EventItem(event: event)).toList(),
          ),
        ],
      ),
    );
  }
}

class _EventItem extends StatelessWidget {
  final MockEvent event;

  const _EventItem({required this.event});

  @override
  Widget build(BuildContext context) {
    final colorPair = _getEventColors(event.color);
    final startTime = event.allDay
        ? 'All day'
        : DateFormat('h a').format(event.start);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: colorPair.background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            event.title,
            style: AppTextStyles.bodySmall.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.foreground,
            ),
          ),
          if (event.description != null && event.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              event.description!,
              style: AppTextStyles.label.copyWith(
                fontSize: 12,
                color: AppColors.foreground.withValues(alpha: 0.9),
              ),
            ),
          ],
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                startTime,
                style: AppTextStyles.label.copyWith(
                  fontSize: 12,
                  color: AppColors.foreground.withValues(alpha: 0.7),
                ),
              ),
              if (event.location != null && event.location!.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    '|',
                    style: AppTextStyles.label.copyWith(fontSize: 10),
                  ),
                ),
                Text(
                  event.location!,
                  style: AppTextStyles.label.copyWith(
                    fontSize: 12,
                    color: AppColors.foreground.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  ({Color background, Color border}) _getEventColors(EventColor color) {
    switch (color) {
      case EventColor.sky:
        return (
          background: const Color(0xFFE0F2FE).withValues(alpha: 0.5),
          border: const Color(0xFF7DD3FC),
        );
      case EventColor.amber:
        return (
          background: const Color(0xFFFEF3C7).withValues(alpha: 0.5),
          border: const Color(0xFFFCD34D),
        );
      case EventColor.violet:
        return (
          background: const Color(0xFFEDE9FE).withValues(alpha: 0.5),
          border: const Color(0xFFC4B5FD),
        );
      case EventColor.rose:
        return (
          background: const Color(0xFFFFE4E6).withValues(alpha: 0.5),
          border: const Color(0xFFFDA4AF),
        );
      case EventColor.emerald:
        return (
          background: const Color(0xFFD1FAE5).withValues(alpha: 0.5),
          border: const Color(0xFF6EE7B7),
        );
      case EventColor.orange:
        return (
          background: const Color(0xFFFFEDD5).withValues(alpha: 0.5),
          border: const Color(0xFFFDBA74),
        );
    }
  }
}
