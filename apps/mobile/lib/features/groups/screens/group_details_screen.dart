import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/theme/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/utils/url_utils.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../providers/group_details_provider.dart';
import '../providers/group_provider.dart';
import '../models/group.dart';
import '../widgets/group_tab_bar.dart';

class GroupDetailsScreen extends ConsumerStatefulWidget {
  final String groupId;

  const GroupDetailsScreen({super.key, required this.groupId});

  @override
  ConsumerState<GroupDetailsScreen> createState() => _GroupDetailsScreenState();
}

class _GroupDetailsScreenState extends ConsumerState<GroupDetailsScreen> {
  final TextEditingController _notesController = TextEditingController();
  bool _isEditingNotes = false;
  int _activeTabIndex = 0;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final groupAsync = ref.watch(groupDetailsProvider(widget.groupId));
    final membershipAsync = ref.watch(groupMembershipProvider(widget.groupId));

    return groupAsync.when(
      data: (group) {
        return membershipAsync.when(
          data: (membership) {
            if (group.status == 'pending') {
              return _buildPendingState();
            }

            if (!membership.isMember && !membership.isCreator) {
              return _buildJoinState(membership);
            }

            if (!_isEditingNotes &&
                group.notes != null &&
                _notesController.text != group.notes) {
              _notesController.text = group.notes!;
            }

            return Scaffold(
              backgroundColor: AppColors.background,
              body: Column(
                children: [
                  Container(
                    color: AppColors.background,
                    child: SafeArea(bottom: false, child: _buildHeader(group)),
                  ),
                  GroupTabBar(
                    activeIndex: _activeTabIndex,
                    onTabChanged: (index) =>
                        setState(() => _activeTabIndex = index),
                  ),
                  Expanded(
                    child: IndexedStack(
                      index: _activeTabIndex,
                      children: [
                        _buildOverviewTab(group),
                        _buildChatsTab(group),
                        _buildItineraryTab(group),
                        _buildSettingsTab(group),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
          loading: () => const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          ),
          error: (e, s) => _buildErrorState(e),
        );
      },
      loading: () => const Scaffold(
        body: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(
              color: AppColors.primary,
              strokeWidth: 3,
            ),
          ),
        ),
      ),
      error: (e, s) => _buildErrorState(e),
    );
  }

  Widget _buildHeader(Group group) {
    return Container(
      padding: const EdgeInsets.only(left: 4, right: 16, top: 16, bottom: 6),
      decoration: const BoxDecoration(color: AppColors.background),
      child: Row(
        children: [
          _buildBackButton(context),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              group.name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
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

  Widget _buildOverviewTab(Group group) {
    final membersAsync = ref.watch(groupMembersProvider(widget.groupId));
    final itineraryAsync = ref.watch(groupItineraryProvider(widget.groupId));

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main Content Card
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
                  // Group Cover Image (Rounded Rectangle)
                  _buildCoverImage(group),
                  const SizedBox(height: 16),

                  // Group Name & Description
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

                  // Dates Section
                  _buildDatesSection(group),
                  const SizedBox(height: 10),
                  const Divider(color: AppColors.border, thickness: 1),
                  const SizedBox(height: 10),

                  // Members Section (Vertical)
                  membersAsync.when(
                    data: (members) => _buildMembersVerticalList(members),
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (e, s) => Text("Error: $e"),
                  ),
                  const Divider(color: AppColors.border, thickness: 1),
                  const SizedBox(height: 10),

                  // Upcoming Itinerary Card
                  itineraryAsync.when(
                    data: (itinerary) => _buildUpcomingItineraryCard(itinerary),
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (e, s) => Text("Error: $e"),
                  ),
                  const SizedBox(height: 16),

                  // Destination Image Card (Below Itinerary)
                  if (group.destinationImage != null)
                    _buildDestinationImageCard(group),
                  const SizedBox(height: 16),

                  // AI Overview Card
                  _buildAiOverviewCard(group),
                  const SizedBox(height: 16),

                  // Shared Notes (Yellow Stickie)
                  _buildStickyNotesSection(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildCoverImage(Group group) {
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

  Widget _buildDatesSection(Group group) {
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
          ListView.builder(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: sortedMembers.length > 5 ? 5 : sortedMembers.length,
            itemBuilder: (context, index) {
              final member = sortedMembers[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    KovariAvatar(imageUrl: member.avatar, size: 40),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            member.name,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            "@${member.username}",
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.mutedForeground,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (member.role == 'admin')
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
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
              );
            },
          ),
          if (members.length > 5)
            TextButton(
              onPressed: () => _showMembersModal(members),
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

    // Take the next upcoming item
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
                  onPressed: () => setState(() => _activeTabIndex = 2),
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

  Widget _buildDestinationImageCard(Group group) {
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
                // Location Name Label
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
                // Action Button
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

  Widget _buildAiOverviewCard(Group group) {
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

  Widget _buildStickyNotesSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF2C0), // Canonical sticky note yellow
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _isEditingNotes
              ? TextField(
                  controller: _notesController,
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
                  _notesController.text.isEmpty
                      ? "Enter your travel note..."
                      : _notesController.text,
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
                  _isEditingNotes ? LucideIcons.check : LucideIcons.pencil,
                  size: 16,
                  color: AppColors.mutedForeground,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {
                  if (_isEditingNotes) {
                    final service = ref.read(groupServiceProvider);
                    GroupActionsNotifier(
                      service,
                      ref,
                      widget.groupId,
                    ).updateNotes(_notesController.text);
                  }
                  setState(() => _isEditingNotes = !_isEditingNotes);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChatsTab(Group group) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.messageCircle,
              size: 48,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            "Group Chat",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "Connect with your travel buddies here.",
            style: TextStyle(color: AppColors.mutedForeground, fontSize: 14),
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            text: "Open Chat",
            onPressed: () {
              // Navigation to chat screen would go here
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Chat feature integration coming soon!"),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildItineraryTab(Group group) {
    final itineraryAsync = ref.watch(groupItineraryProvider(widget.groupId));

    return itineraryAsync.when(
      data: (itinerary) {
        if (itinerary.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  LucideIcons.calendar,
                  size: 48,
                  color: AppColors.muted,
                ),
                const SizedBox(height: 16),
                const Text(
                  "No itinerary items yet",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Plan your trip together!",
                  style: TextStyle(color: AppColors.mutedForeground),
                ),
              ],
            ),
          );
        }

        // Group by status
        final todo = itinerary.where((i) => i.status == 'pending').toList();
        final inProgress = itinerary
            .where((i) => i.status == 'confirmed')
            .toList();
        final done = itinerary.where((i) => i.status == 'completed').toList();
        final cancelled = itinerary
            .where((i) => i.status == 'cancelled')
            .toList();

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (todo.isNotEmpty)
              _buildItinerarySection("To do", todo, const Color(0xFFF59E0B)),
            if (inProgress.isNotEmpty)
              _buildItinerarySection(
                "In Progress",
                inProgress,
                const Color(0xFF007AFF),
              ),
            if (done.isNotEmpty)
              _buildItinerarySection("Done", done, const Color(0xFF34C759)),
            if (cancelled.isNotEmpty)
              _buildItinerarySection(
                "Cancelled",
                cancelled,
                const Color(0xFFF31260),
              ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text("Error: $e")),
    );
  }

  Widget _buildItinerarySection(
    String title,
    List<ItineraryItem> items,
    Color dotColor,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(width: 8),
            Text(
              "(${items.length})",
              style: const TextStyle(
                color: AppColors.mutedForeground,
                fontSize: 14,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildItineraryItemCard(item),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildItineraryItemCard(ItineraryItem item) {
    IconData typeIcon = LucideIcons.calendar;
    switch (item.type.toLowerCase()) {
      case 'flight':
        typeIcon = LucideIcons.plane;
        break;
      case 'accommodation':
        typeIcon = LucideIcons.hotel;
        break;
      case 'activity':
        typeIcon = LucideIcons.map;
        break;
      case 'transport':
        typeIcon = LucideIcons.car;
        break;
      case 'budget':
        typeIcon = LucideIcons.wallet;
        break;
    }

    return Container(
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
              Row(
                children: [
                  Icon(typeIcon, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    item.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              _buildStatusBadge(item.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            item.description,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                LucideIcons.calendar,
                size: 14,
                color: AppColors.mutedForeground,
              ),
              const SizedBox(width: 4),
              Text(
                DateFormat('EEE, MMM d').format(DateTime.parse(item.datetime)),
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
                DateFormat('hh:mm a').format(DateTime.parse(item.datetime)),
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
                item.location,
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
    );
  }

  Widget _buildSettingsTab(Group group) {
    final membersAsync = ref.watch(groupMembersProvider(widget.groupId));
    final membershipAsync = ref.watch(groupMembershipProvider(widget.groupId));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSettingsSection("Group Info", [
          _buildSettingsItem(
            icon: LucideIcons.info,
            title: "Edit Basic Details",
            subtitle: "Name, description, destination",
            onTap: () {},
          ),
          _buildSettingsItem(
            icon: LucideIcons.calendar,
            title: "Travel Dates",
            subtitle: group.dateRange.start != null
                ? "${DateFormat('MMM d').format(DateTime.parse(group.dateRange.start!))} - ${group.dateRange.end != null ? DateFormat('MMM d').format(DateTime.parse(group.dateRange.end!)) : 'Ongoing'}"
                : "Not set",
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 24),
        _buildSettingsSection("Management", [
          _buildSettingsItem(
            icon: LucideIcons.users,
            title: "Manage Members",
            subtitle: "Add, remove, or change roles",
            onTap: () {
              membersAsync.whenData((members) => _showMembersModal(members));
            },
          ),
          _buildSettingsItem(
            icon: LucideIcons.shieldCheck,
            title: "Privacy & Safety",
            subtitle: group.privacy == 'public'
                ? "Public Group"
                : "Private Group",
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 24),
        _buildSettingsSection("Actions", [
          _buildSettingsItem(
            icon: LucideIcons.logOut,
            title: "Leave Group",
            titleColor: AppColors.destructive,
            onTap: () => _showLeaveConfirmation(),
          ),
          if (membershipAsync.value?.isCreator == true)
            _buildSettingsItem(
              icon: LucideIcons.trash2,
              title: "Delete Group",
              titleColor: AppColors.destructive,
              onTap: () => _showDeleteConfirmation(),
            ),
        ]),
      ],
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.mutedForeground,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    String? subtitle,
    Color? titleColor,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, size: 20, color: titleColor ?? AppColors.foreground),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: titleColor ?? AppColors.foreground,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.mutedForeground,
              ),
            )
          : null,
      trailing: const Icon(
        LucideIcons.chevronRight,
        size: 16,
        color: AppColors.muted,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    );
  }

  void _showLeaveConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Leave Group?"),
        content: const Text(
          "Are you sure you want to leave this travel group?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              final service = ref.read(groupServiceProvider);
              GroupActionsNotifier(service, ref, widget.groupId).leaveGroup();
              Navigator.pop(context); // close dialog
              Navigator.pop(context); // back to groups screen
            },
            child: const Text(
              "Leave",
              style: TextStyle(color: AppColors.destructive),
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Group?"),
        content: const Text(
          "This action is permanent and will delete all trip data and chats for everyone.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              final service = ref.read(groupServiceProvider);
              GroupActionsNotifier(service, ref, widget.groupId).deleteGroup();
              Navigator.pop(context); // close dialog
              Navigator.pop(context); // back to groups screen
            },
            child: const Text(
              "Delete",
              style: TextStyle(color: AppColors.destructive),
            ),
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

  Widget _buildStatusBadge(String status) {
    Color color = Colors.grey;
    String label = status.toUpperCase();

    switch (status.toLowerCase()) {
      case 'confirmed':
        color = const Color(0xFF007AFF);
        label = "In Progress";
        break;
      case 'completed':
        color = const Color(0xFF34C759);
        label = "Completed";
        break;
      case 'pending':
        color = AppColors.mutedForeground;
        label = "Not Started";
        break;
      case 'cancelled':
        color = const Color(0xFFF31260);
        label = "Cancelled";
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildErrorState(Object e) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LucideIcons.circleAlert,
              size: 48,
              color: AppColors.destructive,
            ),
            const SizedBox(height: 16),
            Text("Something went wrong", style: AppTextStyles.h3),
            const SizedBox(height: 8),
            Text(
              e.toString(),
              style: AppTextStyles.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SecondaryButton(
              text: "Retry",
              onPressed: () {
                ref.invalidate(groupDetailsProvider(widget.groupId));
                ref.invalidate(groupMembershipProvider(widget.groupId));
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPendingState() {
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                LucideIcons.circleAlert,
                size: 64,
                color: AppColors.muted,
              ),
              const SizedBox(height: 24),
              Text(
                "Group Under Review",
                style: AppTextStyles.h2,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                "This group is currently pending admin approval and is not available for viewing or interaction.",
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.mutedForeground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              PrimaryButton(
                text: "Back to Groups",
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJoinState(MembershipInfo membership) {
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.users, size: 64, color: AppColors.muted),
              const SizedBox(height: 24),
              Text(
                "Join the group",
                style: AppTextStyles.h2,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                "You need to be a member of this group to access its itinerary and notes.",
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.mutedForeground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              PrimaryButton(
                text: membership.hasPendingRequest
                    ? "Request Pending"
                    : "Request to Join Group",
                onPressed: membership.hasPendingRequest
                    ? null
                    : () {
                        final service = ref.read(groupServiceProvider);
                        GroupActionsNotifier(
                          service,
                          ref,
                          widget.groupId,
                        ).joinRequest();
                      },
              ),
              const SizedBox(height: 12),
              SecondaryButton(
                text: "Back to Groups",
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showMembersModal(List<GroupMember> members) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text("Group Members (${members.length})", style: AppTextStyles.h3),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: members.length,
                itemBuilder: (context, index) {
                  final member = members[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Row(
                      children: [
                        KovariAvatar(imageUrl: member.avatar, size: 48),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                member.name,
                                style: AppTextStyles.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                "@${member.username}",
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (member.role == 'admin')
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              "Admin",
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
