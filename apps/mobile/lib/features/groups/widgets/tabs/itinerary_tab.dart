import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../shared/widgets/kovari_avatar.dart';
import '../../../../core/theme/app_colors.dart';
import '../../models/group.dart';
import '../../providers/group_details_provider.dart';
import '../modals/itinerary_form_modal.dart';
import '../../../../shared/widgets/kovari_popover.dart';

class ItineraryTab extends ConsumerWidget {
  final Group group;

  const ItineraryTab({super.key, required this.group});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itineraryAsync = ref.watch(groupItineraryProvider(group.id));
    final membersAsync = ref.watch(groupMembersProvider(group.id));
    final optimisticStore = ref.watch(optimisticStoreProvider);
    final optimisticItinerary = optimisticStore[group.id];

    return itineraryAsync.when(
      data: (baseItinerary) {
        // Use optimistic state if it exists, otherwise use base server data
        final itinerary = optimisticItinerary ?? baseItinerary;

        final members = membersAsync.value ?? [];
        // Group by status
        final todo = itinerary.where((i) => i.status == 'pending').toList();
        final inProgress = itinerary
            .where((i) => i.status == 'confirmed')
            .toList();
        final done = itinerary.where((i) => i.status == 'completed').toList();
        final cancelled = itinerary
            .where((i) => i.status == 'cancelled')
            .toList();

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(groupItineraryProvider(group.id));
            ref.invalidate(groupMembersProvider(group.id));
          },
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            children: [
              const Text(
                "Itinerary Board",
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              const Text(
                "Plan and organize your group's travel activities",
                style: TextStyle(
                  color: AppColors.mutedForeground,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 20),
              _buildItinerarySection(
                context,
                ref,
                "To do",
                "pending",
                todo,
                const Color(0xFFF59E0B),
                members,
              ),
              _buildItinerarySection(
                context,
                ref,
                "In Progress",
                "confirmed",
                inProgress,
                const Color(0xFF007AFF),
                members,
              ),
              _buildItinerarySection(
                context,
                ref,
                "Done",
                "completed",
                done,
                const Color(0xFF34C759),
                members,
              ),
              _buildItinerarySection(
                context,
                ref,
                "Cancelled",
                "cancelled",
                cancelled,
                const Color(0xFFF31260),
                members,
              ),
            ],
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text("Error: $e")),
    );
  }

  Widget _buildItinerarySection(
    BuildContext context,
    WidgetRef ref,
    String title,
    String targetStatus,
    List<ItineraryItem> items,
    Color dotColor,
    List<GroupMember> groupMembers,
  ) {
    return DragTarget<ItineraryItem>(
      onWillAccept: (data) => data?.status != targetStatus,
      onAccept: (item) async {
        final messenger = ScaffoldMessenger.of(context);
        try {
          await ref
              .read(groupActionsProvider(group.id))
              .updateItineraryStatus(item, targetStatus);
        } catch (e) {
          String errorMessage = "Failed to update item";
          if (e is DioException) {
            final data = e.response?.data;
            if (data is Map && data.containsKey('error')) {
              errorMessage = "${data['error']}";
            } else {
              errorMessage = e.message ?? errorMessage;
            }
          }
          messenger.showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
      builder: (context, candidateData, rejectedData) {
        final bool isOver = candidateData.isNotEmpty;
        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isOver ? AppColors.primary : AppColors.border,
              width: isOver ? 2 : 1,
            ),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 0,
                ),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border(bottom: BorderSide(color: AppColors.border)),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
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
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.secondary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        "${items.length}",
                        style: const TextStyle(
                          color: AppColors.mutedForeground,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(LucideIcons.plus, size: 18),
                      color: AppColors.mutedForeground,
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) => ItineraryFormModal(
                            groupId: group.id,
                            initialStatus: targetStatus,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(
                  children: [
                    if (items.isEmpty)
                      const SizedBox(height: 12)
                    else
                      ...items.map(
                        (item) => Padding(
                          padding: const EdgeInsets.fromLTRB(14, 2, 14, 2),
                          child: _buildDraggableItineraryItem(
                            context,
                            ref,
                            item,
                            groupMembers,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDraggableItineraryItem(
    BuildContext context,
    WidgetRef ref,
    ItineraryItem item,
    List<GroupMember> groupMembers,
  ) {
    return LongPressDraggable<ItineraryItem>(
      data: item,
      hapticFeedbackOnStart: true,
      feedback: SizedBox(
        width: 300, // Approximate width of the card
        child: Material(
          elevation: 3.0,
          borderRadius: BorderRadius.circular(16),
          child: _buildItineraryItemCard(context, ref, item, groupMembers),
        ),
      ),
      childWhenDragging: Opacity(
        opacity: 0.4,
        child: _buildItineraryItemCard(context, ref, item, groupMembers),
      ),
      child: _buildItineraryItemCard(context, ref, item, groupMembers),
    );
  }

  Widget _buildItineraryItemCard(
    BuildContext context,
    WidgetRef ref,
    ItineraryItem item,
    List<GroupMember> groupMembers,
  ) {
    final dt = DateTime.parse(item.datetime).toLocal();
    final daySuffix = _getOrdinalSuffix(dt.day);
    final formattedDate =
        "${DateFormat('MMMM d').format(dt)}$daySuffix, ${dt.year}";

    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      color: AppColors.card,
      child: Padding(
        padding: const EdgeInsets.only(
          left: 14,
          right: 14,
          top: 14,
          bottom: 14,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    _buildStatusBadge(item.status),
                    const SizedBox(width: 8),
                    _buildPriorityBadge(item.priority),
                  ],
                ),
                KovariPopover(
                  items: [
                    KovariMenuAction(
                      icon: LucideIcons.pencil,
                      label: 'Edit',
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (context) => ItineraryFormModal(
                            groupId: group.id,
                            initialItem: item,
                          ),
                        );
                      },
                    ),
                    KovariMenuAction(
                      icon: LucideIcons.trash2,
                      label: 'Delete',
                      isDestructive: true,
                      onTap: () async {
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Delete Item'),
                            content: const Text(
                              'Are you sure you want to delete this itinerary item?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                style: TextButton.styleFrom(
                                  foregroundColor: AppColors.destructive,
                                ),
                                child: const Text('Delete'),
                              ),
                            ],
                          ),
                        );

                        if (confirmed == true) {
                          try {
                            await ref
                                .read(groupActionsProvider(group.id))
                                .deleteItineraryItem(item.id);
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed to delete: $e')),
                            );
                          }
                        }
                      },
                    ),
                  ],
                  child: const Icon(
                    LucideIcons.ellipsis,
                    size: 18,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              item.title,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            if (item.description.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                item.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.mutedForeground,
                  height: 1.4,
                ),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(
                  LucideIcons.calendar,
                  size: 14,
                  color: AppColors.mutedForeground,
                ),
                const SizedBox(width: 8),
                Text(
                  formattedDate,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.mutedForeground,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 16),
                const Icon(
                  LucideIcons.clock,
                  size: 14,
                  color: AppColors.mutedForeground,
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat('hh:mm a').format(dt).toLowerCase(),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.mutedForeground,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  LucideIcons.mapPin,
                  size: 14,
                  color: AppColors.mutedForeground,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item.location,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.mutedForeground,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Text(
                  "Assignees :",
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.mutedForeground,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 10),
                if (item.assignedTo != null && item.assignedTo!.isNotEmpty)
                  _buildAvatarStack(item.assignedTo, groupMembers)
                else
                  const Text(
                    "No assignees",
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.mutedForeground,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getOrdinalSuffix(int day) {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }

  Widget _buildAvatarStack(
    List<String>? assignedIds,
    List<GroupMember> allMembers,
  ) {
    if (assignedIds == null || assignedIds.isEmpty) {
      return const SizedBox.shrink();
    }
    final idsToShow = assignedIds.take(3).toList();
    final List<Widget> avatars = [];
    for (int i = 0; i < idsToShow.length; i++) {
      final assignedId = idsToShow[i];
      final member = allMembers.cast<GroupMember?>().firstWhere(
        (m) => m?.id == assignedId || m?.username == assignedId,
        orElse: () => null,
      );
      avatars.add(
        Positioned(
          left: i * 16.0,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.card, width: 2),
            ),
            child: KovariAvatar(imageUrl: member?.avatar, size: 28),
          ),
        ),
      );
    }
    if (assignedIds.length > 3) {
      avatars.add(
        Positioned(
          left: 3 * 16.0,
          child: Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppColors.muted,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.card, width: 2),
            ),
            child: Center(
              child: Text(
                "+${assignedIds.length - 3}",
                style: const TextStyle(
                  fontSize: 10,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
      );
    }
    return SizedBox(
      height: 32,
      width: (idsToShow.length * 16.0) + (assignedIds.length > 3 ? 34 : 14),
      child: Stack(clipBehavior: Clip.none, children: avatars),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    Color bgColor = const Color(0xFFF4F4F5);
    Color textColor = const Color(0xFF71717A);
    String label = priority.toUpperCase();
    switch (priority.toLowerCase()) {
      case 'medium':
        bgColor = const Color.fromARGB(255, 255, 247, 216);
        textColor = const Color.fromARGB(255, 193, 148, 0);
        label = "Medium";
        break;
      case 'high':
        bgColor = const Color(0xFFDCFCE7);
        textColor = const Color(0xFF15803D);
        label = "High";
        break;
      case 'low':
        bgColor = const Color(0xFFF4F4F5);
        textColor = const Color(0xFF71717A);
        label = "Low";
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
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.grey;
    Color bgColor = Colors.grey.withOpacity(0.1);
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
}
