import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/core/navigation/routes.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_radius.dart';
import 'package:mobile/core/theme/app_spacing.dart';
import 'package:mobile/core/theme/app_text_styles.dart';
import 'package:mobile/core/widgets/skeletons/kovari_skeletons.dart';
import 'package:mobile/features/requests/models/request_model.dart';
import 'package:mobile/features/requests/providers/request_provider.dart';
import 'package:mobile/shared/widgets/kovari_avatar.dart';

// MockRequest removed to use InterestModel directly

class RequestsSection extends ConsumerWidget {

  const RequestsSection({super.key, this.isLoading = false});
  final bool isLoading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final interestsAsync = ref.watch(interestsProvider);
    final hasData = interestsAsync.hasValue && interestsAsync.value!.isNotEmpty;
    final showSkeleton =
        (interestsAsync.isLoading && !interestsAsync.hasValue) ||
        (isLoading && !hasData);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface(context, level: 1),
        border: Border.all(color: AppColors.borderColor(context)),
        borderRadius: AppRadius.large,
      ),
      child: ClipRRect(
        borderRadius: AppRadius.large,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            InkWell(
              onTap: () => const RequestsRouteData().push<void>(context),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Interests',
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.text(context),
                            ),
                          ),
                          const SizedBox(height: 2),
                          interestsAsync.when(
                            data: (interests) => Text(
                              '${interests.length} pending interests',
                              style: AppTextStyles.label.copyWith(
                                fontSize: 11,
                                color: AppColors.text(context, isMuted: true),
                              ),
                            ),
                            loading: () => Text(
                              'Syncing interests...',
                              style: AppTextStyles.label.copyWith(
                                fontSize: 11,
                                color: AppColors.text(context, isMuted: true),
                              ),
                            ),
                            error: (_, __) => Text(
                              'Error loading',
                              style: AppTextStyles.label.copyWith(
                                fontSize: 11,
                                color: AppColors.destructive,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Divider(height: 1, color: AppColors.borderColor(context)),

            if (showSkeleton)
              _buildSkeleton(context)
            else
              interestsAsync.when(
                data: (interests) {
                  if (interests.isEmpty) return _buildEmptyState(context);
                  return Column(
                    children: [
                      for (int i = 0; i < interests.length; i++) ...[
                        _RequestCard(interest: interests[i]),
                        if (i < interests.length - 1)
                          Divider(
                            height: 1,
                            color: AppColors.borderColor(context),
                            indent: 0,
                            endIndent: 0,
                          ),
                      ],
                    ],
                  );
                },
                loading: () => _buildSkeleton(context),
                error: (err, _) => Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Center(
                    child: Text(
                      'Failed to load interests',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.destructive,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkeleton(BuildContext context) => Column(
      children: List.generate(
        4,
        (i) => Column(
          children: [
            const KovariSkeletonRequestListItem(),
            if (i < 3)
              Divider(height: 1, color: AppColors.borderColor(context)),
          ],
        ),
      ),
    );

  Widget _buildEmptyState(BuildContext context) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
      child: Center(
        child: Column(
          children: [
            Text(
              'No pending interests',
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.text(context, isMuted: true),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'New match interests will appear here',
              style: AppTextStyles.label.copyWith(
                color: AppColors.text(context, isMuted: true),
              ),
            ),
          ],
        ),
      ),
    );
}

class _RequestCard extends ConsumerStatefulWidget {

  const _RequestCard({required this.interest});
  final InterestModel interest;

  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  String? _loadingAction;
  bool _isAccepted = false;

  Future<void> _handleAction(String action) async {
    setState(() => _loadingAction = action);
    try {
      final success = await ref
          .read(interestsProvider.notifier)
          .respond(widget.interest.id, action);

      if (mounted && success && action == 'accept') {
        setState(() {
          _isAccepted = true;
          _loadingAction = null;
        });
      }
    } finally {
      if (mounted && !_isAccepted) {
        setState(() => _loadingAction = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isAccepted) {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: 16,
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.check, color: Colors.green, size: 20),
            const SizedBox(width: 12),
            Text(
              'Accepted! Joining group...',
              style: AppTextStyles.bodySmall.copyWith(
                color: Colors.green,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 10,
      ),
      child: Row(
        children: [
          // Avatar
          KovariAvatar(
            imageUrl: widget.interest.senderAvatar,
            size: 40,
            fullName: widget.interest.senderName,
          ),
          const SizedBox(width: AppSpacing.sm * 1.5),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.interest.senderName,
                  style: AppTextStyles.bodySmall.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.text(context),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  widget.interest.destination,
                  style: AppTextStyles.label.copyWith(
                    fontSize: 12,
                    color: AppColors.text(context, isMuted: true),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Actions
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildActionButton(
                label: 'Connect',
                backgroundColor: AppColors.primary,
                textColor: Colors.white,
                onTap: () => _handleAction('accept'),
                isLoading: _loadingAction == 'accept',
              ),
              const SizedBox(width: AppSpacing.sm),
              _buildSimpleIconButton(
                icon: LucideIcons.x,
                onTap: () => _handleAction('reject'),
                isLoading: _loadingAction == 'reject',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required String label,
    required Color backgroundColor,
    required Color textColor,
    required VoidCallback onTap,
    bool isLoading = false,
  }) => GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        height: 28,
        constraints: const BoxConstraints(minWidth: 64),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isLoading
              ? backgroundColor.withValues(alpha: 0.7)
              : backgroundColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: isLoading
            ? const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                label,
                style: AppTextStyles.label.copyWith(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: textColor,
                ),
              ),
      ),
    );

  Widget _buildSimpleIconButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isLoading = false,
  }) => GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.borderColor(context)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: isLoading
            ? const SizedBox(
                width: 10,
                height: 10,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
              )
            : Icon(
                icon,
                size: 14,
                color: AppColors.text(context, isMuted: true),
              ),
      ),
    );
}
