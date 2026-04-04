import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/kovari_avatar.dart';
import '../../../shared/utils/url_utils.dart';
import '../providers/safety_provider.dart';
import '../models/safety_report.dart';
import 'submit_report_screen.dart';

class ReportTargetSearchScreen extends ConsumerStatefulWidget {
  final String targetType; // 'user' or 'group'

  const ReportTargetSearchScreen({
    super.key,
    required this.targetType,
  });

  @override
  ConsumerState<ReportTargetSearchScreen> createState() =>
      _ReportTargetSearchScreenState();
}

class _ReportTargetSearchScreenState
    extends ConsumerState<ReportTargetSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    // Initial search for defaults
    Future.microtask(() {
      ref.read(safetyProvider.notifier).searchTargets(widget.targetType, '');
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      ref.read(safetyProvider.notifier).searchTargets(widget.targetType, query);
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
                const Icon(LucideIcons.chevronLeft, color: AppColors.primary, size: 24),
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
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppColors.border.withOpacity(0.5), height: 1),
        ),
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(
            child: _buildResultsList(state),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Report a ${widget.targetType == 'user' ? 'User' : 'Group'}',
            style: AppTextStyles.h3.copyWith(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Select the profile you want to report',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            style: AppTextStyles.bodyMedium,
            decoration: InputDecoration(
              hintText:
                  'Search ${widget.targetType == 'user' ? 'users' : 'groups'}...',
              hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.mutedForeground),
              prefixIcon: const Icon(LucideIcons.search, size: 18, color: AppColors.mutedForeground),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(LucideIcons.x, size: 18, color: AppColors.mutedForeground),
                      onPressed: () {
                        _searchController.clear();
                        ref
                            .read(safetyProvider.notifier)
                            .searchTargets(widget.targetType, '');
                        setState(() {});
                      },
                    )
                  : null,
              filled: true,
              fillColor: AppColors.secondary.withOpacity(0.6),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsList(SafetyState state) {
    if (state.isSearchLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.searchError != null) {
      return Center(
        child: Text(
          state.searchError!,
          style: const TextStyle(color: AppColors.destructive),
        ),
      );
    }

    final results = state.searchResults;

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              widget.targetType == 'user' ? LucideIcons.user : LucideIcons.users,
              size: 48,
              color: AppColors.mutedForeground.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No ${widget.targetType == 'user' ? 'users' : 'groups'} found',
              style: TextStyle(
                color: AppColors.mutedForeground.withOpacity(0.5),
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: results.length,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemBuilder: (context, index) {
        final target = results[index];
        final isLast = index == results.length - 1;
        
        return Column(
          children: [
            if (index == 0) const SizedBox(height: 8),
            Material(
              color: Colors.transparent,
              child: ListTile(
                onTap: () => _onSelectTarget(target),
                contentPadding: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(
                    top: index == 0 ? const Radius.circular(12) : Radius.zero,
                    bottom: isLast ? const Radius.circular(12) : Radius.zero,
                  ),
                ),
                tileColor: Colors.white,
                leading: KovariAvatar(
                  imageUrl: UrlUtils.getFullImageUrl(target.imageUrl ?? ''),
                  size: 36,
                ),
                title: Text(
                  target.name,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                subtitle: target.username != null
                    ? Text(
                        '@${target.username}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                          fontSize: 13,
                        ),
                      )
                    : null,
                trailing: Icon(
                  LucideIcons.chevronRight,
                  size: 18,
                  color: AppColors.mutedForeground.withOpacity(0.5),
                ),
              ),
            ),
            if (!isLast)
              const Divider(
                height: 1,
                color: AppColors.border,
                indent: 60,
              ),
          ],
        );
      },
    );
  }

  void _onSelectTarget(SafetyTarget target) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SubmitReportScreen(
          targetType: widget.targetType,
          targetId: target.id,
          targetName: target.name,
        ),
      ),
    );
  }
}
