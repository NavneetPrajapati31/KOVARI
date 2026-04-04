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
                  'Safety',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
        title: Text(
          'My Reports',
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        actions: [
          if (state.reports.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(right: 16, top: 16, bottom: 16),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  '${state.reports.length} TOTAL',
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppColors.border.withOpacity(0.5), height: 1),
        ),
      ),
      body: _buildBody(state),
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
              color: AppColors.mutedForeground.withOpacity(0.3),
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
              style: TextStyle(
                color: AppColors.mutedForeground.withOpacity(0.6),
              ),
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
                  fontWeight: FontWeight.w600,
                  color: AppColors.mutedForeground,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border.withOpacity(0.5)),
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
            const SizedBox(height: 16),
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
              const SizedBox(width: 12),
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
                    fontWeight: FontWeight.w600,
                    color: AppColors.mutedForeground,
                  ),
                ),
                TextSpan(text: report.reason),
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
                      fontWeight: FontWeight.w600,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                  TextSpan(text: '"${report.additionalNotes}"'),
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
                  color: AppColors.secondary.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      LucideIcons.image,
                      size: 14,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'View Evidence',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
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
    Color bgColor;

    switch (status.toLowerCase()) {
      case 'pending':
        color = Colors.orange;
        bgColor = Colors.orange.withOpacity(0.1);
        break;
      case 'resolved':
      case 'reviewed':
        color = Colors.blue;
        bgColor = Colors.blue.withOpacity(0.1);
        break;
      case 'action taken':
        color = Colors.green;
        bgColor = Colors.green.withOpacity(0.1);
        break;
      case 'dismissed':
        color = Colors.grey;
        bgColor = Colors.grey.withOpacity(0.1);
        break;
      default:
        color = AppColors.mutedForeground;
        bgColor = AppColors.secondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
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
