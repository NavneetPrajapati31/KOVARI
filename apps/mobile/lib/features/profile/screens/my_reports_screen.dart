import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/utils/url_utils.dart';
import '../providers/safety_provider.dart';
import '../models/safety_report.dart';

class MyReportsScreen extends ConsumerStatefulWidget {
  const MyReportsScreen({super.key});

  @override
  ConsumerState<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends ConsumerState<MyReportsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(safetyProvider.notifier).fetchMyReports();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(safetyProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          Container(
            color: AppColors.card,
            child: SafeArea(bottom: false, child: _buildHeader(context, state)),
          ),
          Expanded(child: _buildBody(state)),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, SafetyState state) {
    return Container(
      padding: const EdgeInsets.only(left: 4, right: 16, top: 16, bottom: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          _buildBackButton(context),
          const SizedBox(width: 4),
          const Expanded(
            child: Text(
              'My Reports',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
          ),
          if (state.reports.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${state.reports.length} Total',
                style: AppTextStyles.bodySmall.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.mutedForeground,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBackButton(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: const Icon(
          LucideIcons.arrowLeft,
          size: 20,
          color: AppColors.foreground,
        ),
      ),
    );
  }

  Widget _buildBody(SafetyState state) {
    if (state.isLoadingReports && state.reports.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.reportsError != null && state.reports.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LucideIcons.flag,
              size: 48,
              color: AppColors.destructive,
            ),
            const SizedBox(height: 16),
            Text(
              state.reportsError!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.destructive),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () =>
                  ref.read(safetyProvider.notifier).fetchMyReports(),
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (state.reports.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.heartHandshake,
              size: 64,
              color: AppColors.primary.withValues(alpha: 0.1),
            ),
            const SizedBox(height: 16),
            const Text(
              'No active reports',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              "We're glad things are safe. You can report concerns here anytime.",
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.mutedForeground),
            ),
          ],
        ),
      );
    }

    // Group reports by date
    final Map<String, List<SafetyReport>> groupedReports = {};
    for (var report in state.reports) {
      final dateKey = _formatDate(report.createdAt);
      groupedReports.putIfAbsent(dateKey, () => []).add(report);
    }

    return ListView.builder(
      itemCount: groupedReports.length,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final dateKey = groupedReports.keys.elementAt(index);
        final reports = groupedReports[dateKey]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 8, top: 12),
              child: Text(
                dateKey,
                style: AppTextStyles.bodySmall.copyWith(
                  fontWeight: FontWeight.w500,
                  color: AppColors.mutedForeground,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: List.generate(reports.length, (i) {
                  final report = reports[i];
                  return Column(
                    children: [
                      _buildReportCard(report),
                      if (i != reports.length - 1)
                        const Divider(
                          height: 1,
                          color: AppColors.border,
                          indent: 16,
                          endIndent: 16,
                        ),
                    ],
                  );
                }),
              ),
            ),
            const SizedBox(height: 24),
          ],
        );
      },
    );
  }

  Widget _buildReportCard(SafetyReport report) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              KovariAvatar(
                imageUrl: UrlUtils.getFullImageUrl(report.targetImageUrl),
                size: 40,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            report.targetName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildStatusBadge(report.status),
                      ],
                    ),
                    if (report.targetUsername != null)
                      Text(
                        '@${report.targetUsername}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          RichText(
            text: TextSpan(
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.foreground,
                height: 1.4,
              ),
              children: [
                const TextSpan(
                  text: 'Reason: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: AppColors.mutedForeground,
                  ),
                ),
                TextSpan(
                  text: report.reason,
                  style: const TextStyle(fontWeight: FontWeight.w400),
                ),
              ],
            ),
          ),
          if (report.additionalNotes.isNotEmpty) ...[
            const SizedBox(height: 4),
            RichText(
              text: TextSpan(
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.foreground,
                  height: 1.4,
                ),
                children: [
                  const TextSpan(
                    text: 'Additional Context: ',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                  TextSpan(
                    text: '"${report.additionalNotes}"',
                    style: const TextStyle(fontWeight: FontWeight.w400),
                  ),
                ],
              ),
            ),
          ],
          if (report.evidenceUrl.isNotEmpty) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                // Open full image logic or just show it
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      LucideIcons.image,
                      size: 13,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'View Evidence',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;

    switch (status.toLowerCase()) {
      case 'pending':
        color = const Color(0xFFD97706); // Amber 600
        break;
      case 'resolved':
      case 'action taken':
        color = const Color(0xFF16A34A); // Green 600
        break;
      case 'reviewed':
      case 'ongoing':
        color = AppColors.primary;
        break;
      case 'dismissed':
        color = AppColors.mutedForeground;
        break;
      default:
        color = const Color(0xFFD97706);
    }

    // Capitalize status
    final String label = status.toLowerCase() == 'pending'
        ? 'Pending'
        : status.toLowerCase() == 'ongoing' ||
              status.toLowerCase() == 'reviewed'
        ? 'Ongoing'
        : status.toLowerCase() == 'resolved' ||
              status.toLowerCase() == 'action taken'
        ? 'Resolved'
        : status.substring(0, 1).toUpperCase() +
              status.substring(1).toLowerCase();

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: color,
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final reportDate = DateTime(date.year, date.month, date.day);

    if (reportDate == today) return 'Today';
    if (reportDate == yesterday) return 'Yesterday';

    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
