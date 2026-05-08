import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/utils/url_utils.dart';
import '../../../../shared/widgets/kovari_avatar.dart';
import '../../../../core/widgets/common/kovari_image.dart';
import '../../models/group.dart';
import '../../providers/group_details_provider.dart';
import '../../providers/entity_stores.dart';

class OverviewTab extends ConsumerStatefulWidget {
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
  ConsumerState<OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends ConsumerState<OverviewTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(memberStoreProvider.notifier).subscribe(widget.group.id);
      ref.read(itineraryStoreProvider.notifier).subscribe(widget.group.id);
    });
  }

  @override
  void dispose() {
    ref.read(memberStoreProvider.notifier).unsubscribe(widget.group.id);
    ref.read(itineraryStoreProvider.notifier).unsubscribe(widget.group.id);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    // 🛡️ Debug Logic: Why is the destination image missing?
    debugPrint(
      '🔍 [OverviewTab] Group: ${widget.group.id} | Destination: ${widget.group.destination}',
    );
    debugPrint(
      '🖼️ [OverviewTab] Cover: ${widget.group.coverImage} | DestinationImg: ${widget.group.destinationImage}',
    );

    // Selective subscriptions to avoid parent rebuilds
    final membersState = ref.watch(
      memberStoreProvider.select((s) => s[widget.group.id]),
    );
    final itineraryState = ref.watch(
      itineraryStoreProvider.select((s) => s[widget.group.id]),
    );
    final group = ref.watch(
      groupStoreProvider.select(
        (s) => s[widget.group.id]?.data ?? widget.group,
      ),
    );

    return SingleChildScrollView(
      key: PageStorageKey(
        'overview_${widget.group.id}',
      ), // 🛡️ [Replay Engine] Scroll restoration
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: AppColors.borderColor(context), width: 1),
            ),
            color: AppColors.surface(context, level: 1),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildCoverImage(context, group),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          group.name,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.text(context),
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          group.description ?? "No description provided.",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppColors.text(context, isMuted: true),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Divider(color: AppColors.borderColor(context), thickness: 1),
                  const SizedBox(height: 10),
                  _buildDatesSection(context, group),
                  const SizedBox(height: 10),
                  Divider(color: AppColors.borderColor(context), thickness: 1),
                  const SizedBox(height: 10),

                  // Members Layer
                  if (membersState != null && membersState.hasData)
                    _buildMembersVerticalList(context, membersState.data!)
                  else if (membersState != null && membersState.isHydrating)
                    _buildMembersLoading(context)
                  else
                    SizedBox.shrink(),

                  Divider(color: AppColors.borderColor(context), thickness: 1),
                  const SizedBox(height: 10),

                  // Itinerary Layer
                  if (itineraryState != null && itineraryState.hasData)
                    _buildUpcomingItineraryCard(context, itineraryState.data!)
                  else
                    SizedBox.shrink(),

                  const SizedBox(height: 16),
                  _buildDestinationImageCard(group),
                  const SizedBox(height: 16),
                  _buildAiOverviewCard(context, group),
                  const SizedBox(height: 16),
                  _buildStickyNotesSection(context, ref, group),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildCoverImage(BuildContext context, GroupModel group) {
    final coverImageUrl = UrlUtils.getFullImageUrl(group.coverImage);
    return AspectRatio(
      aspectRatio: 16 / 10,
      child: coverImageUrl != null
          ? KovariImage(
              imageUrl: coverImageUrl,
              fit: BoxFit.cover,
              borderRadius: BorderRadius.circular(20),
            )
          : _buildPlaceholder(context),
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Container(
      color: AppColors.mutedColor(context),
      child: Center(
        child: Icon(
          LucideIcons.image,
          size: 48,
          color: AppColors.text(context, isMuted: true),
        ),
      ),
    );
  }

  Widget _buildDatesSection(BuildContext context, GroupModel group) {
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
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.text(context, isMuted: true),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMembersVerticalList(
    BuildContext context,
    List<GroupMember> members,
  ) {
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
                "${members.length} member${members.length == 1 ? '' : 's'}",
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
              for (
                int i = 0;
                i < (sortedMembers.length > 5 ? 5 : sortedMembers.length);
                i++
              )
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
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.text(context, isMuted: true),
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
              onPressed: () => widget.onViewAllMembers(members),
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

  Widget _buildUpcomingItineraryCard(
    BuildContext context,
    List<ItineraryItem> itinerary,
  ) {
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
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.text(context, isMuted: true),
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => widget.onTabChange(2),
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
              color: AppColors.surface(context, level: 1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.borderColor(context)),
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
                    _buildStatusBadge(context, nextItem.status),
                  ],
                ),
                nextItem.description.isNotEmpty
                    ? Column(
                        children: [
                          const SizedBox(height: 4),
                          Text(
                            nextItem.description,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.text(context, isMuted: true),
                            ),
                          ),
                          const SizedBox(height: 4),
                        ],
                      )
                    : const SizedBox.shrink(),
                Row(
                  children: [
                    Icon(
                      LucideIcons.calendar,
                      size: 14,
                      color: AppColors.text(context, isMuted: true),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat(
                        'EEE, MMM d',
                      ).format(DateTime.parse(nextItem.datetime)),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.text(context, isMuted: true),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      LucideIcons.clock,
                      size: 14,
                      color: AppColors.text(context, isMuted: true),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat(
                        'hh:mm a',
                      ).format(DateTime.parse(nextItem.datetime)),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.text(context, isMuted: true),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      LucideIcons.mapPin,
                      size: 14,
                      color: AppColors.text(context, isMuted: true),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      nextItem.location,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.text(context, isMuted: true),
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

  Widget _buildStatusBadge(BuildContext context, String status) {
    Color color = Colors.grey;
    Color bgColor = Colors.grey.withValues(alpha: 0.1);
    String label = status.toUpperCase();

    final isDark = AppColors.isDark(context);
    switch (status.toLowerCase()) {
      case 'confirmed':
        color = isDark ? const Color(0xFF60A5FA) : const Color(0xFF1D4ED8);
        bgColor = isDark
            ? const Color(0xFF1E3A8A).withValues(alpha: 0.3)
            : const Color(0xFFEFF6FF);
        label = "In Progress";
        break;
      case 'completed':
        color = isDark ? const Color(0xFF4ADE80) : const Color(0xFF15803D);
        bgColor = isDark
            ? const Color(0xFF064E3B).withValues(alpha: 0.3)
            : const Color(0xFFF0FDF4);
        label = "Completed";
        break;
      case 'pending':
        color = isDark
            ? const Color(0xFFFACC15)
            : const Color.fromARGB(255, 193, 148, 0);
        bgColor = isDark
            ? const Color(0xFF422006).withValues(alpha: 0.3)
            : const Color.fromARGB(255, 255, 247, 216);
        label = "Not Started";
        break;
      case 'cancelled':
        color = isDark ? const Color(0xFFF87171) : const Color(0xFFB91C1C);
        bgColor = isDark
            ? const Color(0xFF7F1D1D).withValues(alpha: 0.3)
            : const Color(0xFFFEF2F2);
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
    final imageUrl = UrlUtils.getFullImageUrl(group.destinationImage);
    if (imageUrl == null) return const SizedBox.shrink();

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Stack(
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: KovariImage(
              imageUrl: imageUrl,
              fit: BoxFit.cover,
              borderRadius: BorderRadius.circular(20),
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

  Widget _buildAiOverviewCard(BuildContext context, GroupModel group) {
    if (group.aiOverview == null) return const SizedBox.shrink();

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        color: AppColors.isDark(context)
            ? AppColors.primary.withValues(alpha: 0.15)
            : AppColors.primaryLight,
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
              style: TextStyle(
                color: AppColors.text(context),
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

  Widget _buildStickyNotesSection(
    BuildContext context,
    WidgetRef ref,
    GroupModel group,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.isDark(context)
            ? AppColors.mutedDark
            : const Color(0xFFFFF2C0),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          widget.isEditingNotes
              ? TextField(
                  controller: widget.notesController,
                  maxLines: null,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.6,
                    fontWeight: FontWeight.w500,
                    color: AppColors.text(context, isMuted: true),
                  ),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: "Enter your travel note...",
                  ),
                )
              : Text(
                  widget.notesController.text.isEmpty
                      ? "Enter your travel note..."
                      : widget.notesController.text,
                  style: TextStyle(
                    color: AppColors.text(context, isMuted: true),
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
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.text(context, isMuted: true),
                ),
              ),
              IconButton(
                icon: Icon(
                  widget.isEditingNotes
                      ? LucideIcons.check
                      : LucideIcons.pencil,
                  size: 16,
                  color: AppColors.text(context, isMuted: true),
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {
                  if (widget.isEditingNotes) {
                    ref
                        .read(groupActionsProvider(group.id))
                        .updateNotes(widget.notesController.text);
                  }
                  widget.onEditNotesToggle();
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMembersLoading(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 100,
            height: 14,
            decoration: BoxDecoration(
              color: AppColors.mutedColor(context).withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              for (int i = 0; i < 3; i++)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color:
                          AppColors.mutedColor(context).withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
