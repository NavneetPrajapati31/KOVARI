import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/common/skeleton.dart';
import '../../../../shared/widgets/kovari_avatar.dart';
import '../../../../features/requests/screens/requests_screen.dart';
import '../../../../features/requests/providers/request_provider.dart';
import '../../../../features/requests/models/request_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// MockRequest removed to use InterestModel directly

class RequestsSection extends ConsumerWidget {
  final bool isLoading;

  const RequestsSection({super.key, this.isLoading = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final interestsAsync = ref.watch(interestsProvider);

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
            InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  PageRouteBuilder(
                    pageBuilder: (context, animation, secondaryAnimation) =>
                        const RequestsScreen(),
                    transitionsBuilder:
                        (context, animation, secondaryAnimation, child) {
                          const begin = Offset(1.0, 0.0);
                          const end = Offset.zero;
                          const curve = Curves.easeOutQuart;
                          var tween = Tween(
                            begin: begin,
                            end: end,
                          ).chain(CurveTween(curve: curve));
                          var offsetAnimation = animation.drive(tween);
                          return SlideTransition(
                            position: offsetAnimation,
                            child: child,
                          );
                        },
                    transitionDuration: const Duration(milliseconds: 350),
                  ),
                );
              },
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Interests',
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.foreground,
                          ),
                        ),
                        const SizedBox(height: 2),
                        interestsAsync.when(
                          data: (interests) => Text(
                            '${interests.length} pending interests',
                            style: AppTextStyles.label.copyWith(
                              fontSize: 12,
                              color: AppColors.mutedForeground,
                            ),
                          ),
                          loading: () => const SizedBox(
                            height: 12,
                            width: 64,
                            child: LinearProgressIndicator(),
                          ),
                          // ignore: unnecessary_underscores
                          error: (_, __) => const Text(
                            'Error loading',
                            style: TextStyle(fontSize: 10),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 1, color: AppColors.border),

            interestsAsync.when(
              data: (interests) {
                if (interests.isEmpty) return _buildEmptyState();
                return Column(
                  children: [
                    for (int i = 0; i < interests.length; i++) ...[
                      _RequestCard(interest: interests[i]),
                      if (i < interests.length - 1)
                        const Divider(
                          height: 1,
                          color: AppColors.border,
                          indent: 0,
                          endIndent: 0,
                        ),
                    ],
                  ],
                );
              },
              loading: () => _buildSkeleton(),
              error: (err, _) => Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text('Error: $err'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkeleton() {
    return Column(
      children: List.generate(
        7,
        (i) => Column(
          children: [
            _RequestCardSkeleton(),
            if (i < 6) const Divider(height: 1, color: AppColors.border),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
      child: Center(
        child: Column(
          children: [
            Text(
              'No pending interests',
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'New match interests will appear here',
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

class _RequestCard extends ConsumerStatefulWidget {
  final InterestModel interest;

  const _RequestCard({required this.interest});

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
                    color: AppColors.foreground,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  widget.interest.destination,
                  style: AppTextStyles.label.copyWith(
                    fontSize: 12,
                    color: AppColors.mutedForeground,
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
  }) {
    return GestureDetector(
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
  }

  Widget _buildSimpleIconButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isLoading = false,
  }) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: isLoading
            ? const SizedBox(
                width: 10,
                height: 10,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.mutedForeground,
                  ),
                ),
              )
            : Icon(icon, size: 14, color: AppColors.mutedForeground),
      ),
    );
  }
}

class _RequestCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 10,
      ),
      child: Row(
        children: [
          const Skeleton.circle(size: 40),
          const SizedBox(width: AppSpacing.sm * 1.5),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Skeleton(width: 96, height: 12, borderRadius: AppRadius.small),
                const SizedBox(height: 4),
                Skeleton(width: 64, height: 12, borderRadius: AppRadius.small),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Skeleton(width: 64, height: 28, borderRadius: AppRadius.medium),
        ],
      ),
    );
  }
}
