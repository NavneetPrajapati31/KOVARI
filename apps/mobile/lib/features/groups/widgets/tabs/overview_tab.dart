import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/utils/url_utils.dart';
import '../../../../shared/widgets/kovari_avatar.dart';
import '../../models/group.dart';
import '../../providers/group_details_provider.dart';

class OverviewTab extends ConsumerWidget {
  final GroupModel group;
  final bool isEditingNotes;
  final TextEditingController notesController;
  final VoidCallback onEditNotesToggle;
  final Function(int) onTabChange;
  final Function(List<GroupMember>) onViewAllMembers;

  const OverviewTab({
    super.key,
    required this.group,
    required this.isEditingNotes,
    required this.notesController,
    required this.onEditNotesToggle,
    required this.onTabChange,
    required this.onViewAllMembers,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(groupMembersProvider(group.id));
    final itineraryAsync = ref.watch(groupItineraryProvider(group.id));

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: const BorderSide(color: AppColors.border, width: 1),
            ),
            color: AppColors.card,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildCoverImage(group),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          group.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          group.description ?? "No description provided.",
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppColors.mutedForeground,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Divider(color: AppColors.border, thickness: 1),
                  const SizedBox(height: 10),
                  _buildDatesSection(group),
                  const SizedBox(height: 10),
                  const Divider(color: AppColors.border, thickness: 1),
                  const SizedBox(height: 10),
                  membersAsync.when(
                    data: (members) => _buildMembersVerticalList(members),
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (e, s) => Text("Error: $e"),
                  ),
                  const Divider(color: AppColors.border, thickness: 1),
                  const SizedBox(height: 10),
                  itineraryAsync.when(
                    data: (itinerary) => _buildUpcomingItineraryCard(itinerary),
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (e, s) => Text("Error: $e"),
                  ),
                  const SizedBox(height: 16),
                  if (group.destinationImage != null)
                    _buildDestinationImageCard(group),
                  const SizedBox(height: 16),
                  _buildAiOverviewCard(group),
                  const SizedBox(height: 16),
                  _buildStickyNotesSection(ref),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildCoverImage(GroupModel group) {
    final coverImageUrl = UrlUtils.getFullImageUrl(group.coverImage);
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Stack(
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: coverImageUrl != null
                ? CachedNetworkImage(
                    imageUrl: coverImageUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) =>
                        Container(color: AppColors.secondary),
                    errorWidget: (context, url, error) => _buildPlaceholder(),
                  )
                : _buildPlaceholder(),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppColors.secondary,
      child: const Center(
        child: Icon(LucideIcons.image, size: 48, color: AppColors.muted),
      ),
    );
  }

  Widget _buildDatesSection(GroupModel group) {
    final start = group.dateRange.start != null
        ? DateFormat('MMMM d').format(DateTime.parse(group.dateRange.start!))
        : "";
    final end = group.dateRange.end != null
        ? DateFormat('MMMM d').format(DateTime.parse(group.dateRange.end!))
        : "";

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Mark the dates!",
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Text(
            "$start - $end",
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMembersVerticalList(List<GroupMember> members) {
    final sortedMembers = [...members]
      ..sort((a, b) {
        if (a.role == 'admin' && b.role != 'admin') return -1;
        if (a.role != 'admin' && b.role == 'admin') return 1;
        return 0;
      });

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "${members.length} members",
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            children: [
              for (int i = 0; i < (sortedMembers.length > 5 ? 5 : sortedMembers.length); i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      KovariAvatar(imageUrl: sortedMembers[i].avatar, size: 40),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              sortedMembers[i].name,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              "@${sortedMembers[i].username}",
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.mutedForeground,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (sortedMembers[i].role == 'admin')
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            "Admin",
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
            ],
          ),
          if (members.length > 5)
            TextButton(
              onPressed: () => onViewAllMembers(members),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(0, 0),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                "View all",
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildUpcomingItineraryCard(List<ItineraryItem> itinerary) {
    if (itinerary.isEmpty) return const SizedBox.shrink();
    final nextItem = itinerary.first;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(0),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 4, bottom: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Upcoming Itinerary",
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "${itinerary.length} item${itinerary.length == 1 ? '' : 's'} scheduled",
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.mutedForeground,
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => onTabChange(2),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(0, 0),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text(
                    "View all",
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        nextItem.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    _buildStatusBadge(nextItem.status),
                  ],
                ),
                nextItem.description.isNotEmpty
                    ? Column(
                        children: [
                          const SizedBox(height: 4),
                          Text(
                            nextItem.description,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.mutedForeground,
                            ),
                          ),
                          const SizedBox(height: 4),
                        ],
                      )
                    : const SizedBox.shrink(),
                Row(
                  children: [
                    const Icon(
                      LucideIcons.calendar,
                      size: 14,
                      color: AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat(
                        'EEE, MMM d',
                      ).format(DateTime.parse(nextItem.datetime)),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.mutedForeground,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      LucideIcons.clock,
                      size: 14,
                      color: AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat(
                        'hh:mm a',
                      ).format(DateTime.parse(nextItem.datetime)),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.mutedForeground,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      LucideIcons.mapPin,
                      size: 14,
                      color: AppColors.mutedForeground,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      nextItem.location,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.mutedForeground,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.grey;
    Color bgColor = Colors.grey.withValues(alpha: 0.1);
    String label = status.toUpperCase();

    switch (status.toLowerCase()) {
      case 'confirmed':
        color = const Color(0xFF1D4ED8);
        bgColor = const Color(0xFFEFF6FF);
        label = "In Progress";
        break;
      case 'completed':
        color = const Color(0xFF15803D);
        bgColor = const Color(0xFFF0FDF4);
        label = "Completed";
        break;
      case 'pending':
        color = const Color.fromARGB(255, 193, 148, 0);
        bgColor = const Color.fromARGB(255, 255, 247, 216);
        label = "Not Started";
        break;
      case 'cancelled':
        color = const Color(0xFFB91C1C);
        bgColor = const Color(0xFFFEF2F2);
        label = "Cancelled";
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildDestinationImageCard(GroupModel group) {
    final destinationImageUrl = UrlUtils.getFullImageUrl(
      group.destinationImage,
    );
    if (destinationImageUrl == null) return const SizedBox.shrink();

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Stack(
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: CachedNetworkImage(
              imageUrl: destinationImageUrl,
              fit: BoxFit.cover,
              placeholder: (context, url) =>
                  Container(color: AppColors.secondary),
              errorWidget: (context, url, error) => const SizedBox.shrink(),
            ),
          ),
          Positioned(
            bottom: AppSpacing.sm,
            left: AppSpacing.sm,
            right: AppSpacing.sm,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: _buildGlassContainer(
                    child: Text(
                      group.destination,
                      style: AppTextStyles.label.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                GestureDetector(
                  onTap: () {},
                  child: _buildGlassContainer(
                    borderRadius: BorderRadius.circular(100),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          LucideIcons.search,
                          size: 16,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassContainer({
    required Widget child,
    BorderRadius? borderRadius,
  }) {
    final effectiveRadius = borderRadius ?? BorderRadius.circular(24);
    return ClipRRect(
      borderRadius: effectiveRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.mds,
            vertical: 6,
          ),
          height: 32,
          decoration: BoxDecoration(
            color: Colors.transparent,
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 0.5,
            ),
            borderRadius: effectiveRadius,
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildAiOverviewCard(GroupModel group) {
    if (group.aiOverview == null) return const SizedBox.shrink();

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        color: AppColors.primaryLight,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  LucideIcons.sparkles,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 8),
                const Text(
                  "AI Overview",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              group.aiOverview!,
              style: const TextStyle(
                color: AppColors.foreground,
                fontSize: 12,
                height: 1.6,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStickyNotesSection(WidgetRef ref) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF2C0),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          isEditingNotes
              ? TextField(
                  controller: notesController,
                  maxLines: null,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.6,
                    fontWeight: FontWeight.w500,
                    color: AppColors.mutedForeground,
                  ),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: "Enter your travel note...",
                  ),
                )
              : Text(
                  notesController.text.isEmpty
                      ? "Enter your travel note..."
                      : notesController.text,
                  style: const TextStyle(
                    color: AppColors.mutedForeground,
                    height: 1.6,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                DateFormat('MMM d, yyyy').format(DateTime.now()),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.mutedForeground,
                ),
              ),
              IconButton(
                icon: Icon(
                  isEditingNotes ? LucideIcons.check : LucideIcons.pencil,
                  size: 16,
                  color: AppColors.mutedForeground,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {
                  if (isEditingNotes) {
                    ref
                        .read(groupActionsProvider(group.id))
                        .updateNotes(notesController.text);
                  }
                  onEditNotesToggle();
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
