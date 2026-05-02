import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shimmer/shimmer.dart' as shim;
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../models/user_connection.dart';
import '../data/connections_service.dart';
import '../widgets/user_list_item.dart';
import '../../../core/providers/profile_provider.dart';
import 'public_profile_screen.dart';
import '../../../shared/widgets/kovari_confirm_dialog.dart';

class ConnectionsScreen extends ConsumerStatefulWidget {
  final String userId;
  final String username;
  final String initialTab; // 'followers' or 'following'

  const ConnectionsScreen({
    super.key,
    required this.userId,
    required this.username,
    this.initialTab = 'followers',
  });

  @override
  ConsumerState<ConnectionsScreen> createState() => _ConnectionsScreenState();
}

class _ConnectionsScreenState extends ConsumerState<ConnectionsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late ConnectionsService _service;

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  List<UserConnection> _followers = [];
  List<UserConnection> _following = [];
  bool _isLoading = true;
  bool _isFetchingMoreFollowers = false;
  bool _isFetchingMoreFollowing = false;
  bool _hasMoreFollowers = true;
  bool _hasMoreFollowing = true;
  int _followersPage = 1;
  int _followingPage = 1;
  String? _error;

  final ScrollController _followersScrollController = ScrollController();
  final ScrollController _followingScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTab == 'followers' ? 0 : 1,
    );
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {});
      }
    });
    _followersScrollController.addListener(() => _onScroll('followers'));
    _followingScrollController.addListener(() => _onScroll('following'));

    _service = ConnectionsService(ref.read(apiClientProvider));
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _followersScrollController.dispose();
    _followingScrollController.dispose();
    super.dispose();
  }

  void _onScroll(String type) {
    final controller = type == 'followers' 
        ? _followersScrollController 
        : _followingScrollController;
    
    if (controller.position.pixels >= controller.position.maxScrollExtent - 200) {
      if (type == 'followers') {
        _fetchMoreFollowers();
      } else {
        _fetchMoreFollowing();
      }
    }
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
      _followersPage = 1;
      _followingPage = 1;
      _hasMoreFollowers = true;
      _hasMoreFollowing = true;
    });

    try {
      final followers = await _service.getFollowers(widget.userId, offset: 0);
      final following = await _service.getFollowing(widget.userId, offset: 0);

      if (mounted) {
        setState(() {
          _followers = followers;
          _following = following;
          _hasMoreFollowers = followers.length >= 20;
          _hasMoreFollowing = following.length >= 20;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchMoreFollowers() async {
    if (_isFetchingMoreFollowers || !_hasMoreFollowers || _searchQuery.isNotEmpty) return;

    setState(() => _isFetchingMoreFollowers = true);

    try {
      final nextPage = _followersPage + 1;
      final newFollowers = await _service.getFollowers(
        widget.userId, 
        offset: (_followersPage * 20),
      );

      if (mounted) {
        setState(() {
          _followers.addAll(newFollowers);
          _followersPage = nextPage;
          _hasMoreFollowers = newFollowers.length >= 20;
          _isFetchingMoreFollowers = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isFetchingMoreFollowers = false);
    }
  }

  Future<void> _fetchMoreFollowing() async {
    if (_isFetchingMoreFollowing || !_hasMoreFollowing || _searchQuery.isNotEmpty) return;

    setState(() => _isFetchingMoreFollowing = true);

    try {
      final nextPage = _followingPage + 1;
      final newFollowing = await _service.getFollowing(
        widget.userId, 
        offset: (_followingPage * 20),
      );

      if (mounted) {
        setState(() {
          _following.addAll(newFollowing);
          _followingPage = nextPage;
          _hasMoreFollowing = newFollowing.length >= 20;
          _isFetchingMoreFollowing = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isFetchingMoreFollowing = false);
    }
  }

  Future<void> _handleFollowToggle(UserConnection user) async {
    final originalState = user.isFollowing;
    final userId = user.id;

    // Optimistic UI Update
    setState(() {
      _followers = _followers.map((u) {
        if (u.id == userId) return u.copyWith(isFollowing: !originalState);
        return u;
      }).toList();
      _following = _following.map((u) {
        if (u.id == userId) return u.copyWith(isFollowing: !originalState);
        return u;
      }).toList();
    });

    try {
      if (originalState) {
        await _service.unfollowUser(userId);
      } else {
        await _service.followUser(userId);
      }
      // Re-fetch connections to ensure counts are synced
      final following = await _service.getFollowing(widget.userId);
      if (mounted) {
        setState(() {
          _following = following;
        });
      }
    } catch (e) {
      // Revert on error
      if (mounted) {
        setState(() {
          _followers = _followers.map((u) {
            if (u.id == userId) return u.copyWith(isFollowing: originalState);
            return u;
          }).toList();
          _following = _following.map((u) {
            if (u.id == userId) return u.copyWith(isFollowing: originalState);
            return u;
          }).toList();
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  Future<void> _handleRemoveFollower(UserConnection user) async {
    final userId = user.id;

    // Show confirmation dialog
    showKovariConfirmDialog(
      context: context,
      title: 'Remove Follower?',
      content:
          'Kovari won\'t tell @${user.username} they were removed from your followers.',
      confirmLabel: 'Remove',
      isDestructive: true,
      onConfirm: () async {
        // Optimistic UI Update
        final originalFollowers = List<UserConnection>.from(_followers);
        setState(() {
          _followers = _followers.where((u) => u.id != userId).toList();
        });

        try {
          await _service.removeFollower(userId);
        } catch (e) {
          // Revert on error
          if (mounted) {
            setState(() {
              _followers = originalFollowers;
            });
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
          }
        }
      },
    );
  }

  Future<void> _handleUnfollow(UserConnection user) async {
    final userId = user.id;

    // Show confirmation dialog
    showKovariConfirmDialog(
      context: context,
      title: 'Unfollow?',
      content: 'Kovari won\'t tell ${user.name} they were unfollowed.',
      confirmLabel: 'Unfollow',
      isDestructive: true,
      onConfirm: () async {
        // Optimistic UI Update
        final originalFollowing = List<UserConnection>.from(_following);
        setState(() {
          _following = _following.where((u) => u.id != userId).toList();
        });

        try {
          await _service.unfollowUser(userId);
        } catch (e) {
          // Revert on error
          if (mounted) {
            setState(() {
              _following = originalFollowing;
            });
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
          }
        }
      },
    );
  }

  List<UserConnection> _getFilteredList(List<UserConnection> list) {
    if (_searchQuery.isEmpty) return list;
    return list.where((user) {
      final query = _searchQuery.toLowerCase();
      return user.name.toLowerCase().contains(query) ||
          user.username.toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            // Premium App Bar & Tabs
            SliverOverlapAbsorber(
              handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
              sliver: SliverAppBar(
                pinned: true,
                floating: false,
                elevation: 0,
                backgroundColor: AppColors.card,
                leading: IconButton(
                  icon: const Icon(
                    LucideIcons.arrowLeft,
                    color: AppColors.foreground,
                    size: 20,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                centerTitle: false,
                titleSpacing: 0, // Tighten gap between back icon and title
                title: _isLoading && widget.username.isEmpty
                    ? shim.Shimmer.fromColors(
                        baseColor: AppColors.secondary,
                        highlightColor: AppColors.secondary,
                        child: Container(
                          width: 80,
                          height: 14,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(7),
                          ),
                        ),
                      )
                    : Text(
                        widget.username,
                        style: const TextStyle(
                          color: AppColors.foreground,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(48),
                  child: Container(
                    decoration: const BoxDecoration(color: Colors.white),
                    child: TabBar(
                      controller: _tabController,
                      indicatorColor: AppColors.primary,
                      indicatorWeight: 2,
                      indicatorSize: TabBarIndicatorSize.tab,
                      dividerColor: AppColors.border,
                      dividerHeight: 1,
                      onTap: (index) {
                        // Clear search when switching tabs
                        if (_searchQuery.isNotEmpty) {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        }
                      },
                      labelColor: AppColors.primary,
                      unselectedLabelColor: AppColors.mutedForeground,
                      labelStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      unselectedLabelStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      tabs: [
                        Tab(
                          child: Text(
                            '${_followers.length} followers',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: _tabController.index == 0
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                            ),
                          ),
                        ),
                        Tab(
                          child: Text(
                            '${_following.length} following',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: _tabController.index == 1
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildUserList(_followers, 'followers'),
            _buildUserList(_following, 'following'),
          ],
        ),
      ),
    );
  }

  Widget _buildUserList(List<UserConnection> users, String type) {
    return Builder(
      builder: (context) {
        return CustomScrollView(
          key: PageStorageKey<String>(type),
          controller: type == 'followers' ? _followersScrollController : _followingScrollController,
          slivers: [
            SliverOverlapInjector(
              handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
            ),
            // Search Bar (Always visible)
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    bottom: BorderSide(color: AppColors.border, width: 1),
                  ),
                ),
                child: SizedBox(
                  height: 38,
                  child: TextField(
                    controller: _searchController,
                    enabled: !_isLoading, // Disable while loading
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.black,
                      fontWeight: FontWeight.w400,
                    ),
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value;
                      });
                    },
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppColors.secondary,
                      hintText: 'Search',
                      hintStyle: const TextStyle(
                        color: AppColors.mutedForeground,
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                      ),
                      prefixIcon: null,
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(LucideIcons.x, size: 16),
                              onPressed: () {
                                _searchController.clear();
                                setState(() {
                                  _searchQuery = '';
                                });
                              },
                            )
                          : const Icon(
                              LucideIcons.search,
                              size: 18,
                              color: AppColors.mutedForeground,
                            ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 0,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            if (_isLoading)
              SliverToBoxAdapter(child: _buildSkeletonList())
            else if (_error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.info, color: Colors.red, size: 40),
                      const SizedBox(height: 12),
                      Text(_error!, textAlign: TextAlign.center),
                      TextButton(
                        onPressed: _loadData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              )
            else if (_getFilteredList(users).isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _buildEmptyState(type),
              )
            else ...[
              SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final filteredUsers = _getFilteredList(users);
                  final user = filteredUsers[index];
                  final currentUserId = ref.watch(profileProvider)?.userId;
                  final isMe = user.id == currentUserId;
                  final isViewingOwnConnections =
                      widget.userId == currentUserId;

                  return UserListItem(
                    user: user,
                    type: type,
                    isOwnProfile: isViewingOwnConnections,
                    onTap: isMe
                        ? null
                        : () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    PublicProfileScreen(userId: user.id),
                              ),
                            );
                          },
                    onActionPressed: () {
                      if (isViewingOwnConnections) {
                        if (type == 'followers' && !user.isFollowing) {
                          _handleFollowToggle(user);
                        } else {
                          // TODO: Navigate to chat
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Chat coming soon!')),
                          );
                        }
                      } else {
                        if (user.isFollowing) {
                          // TODO: Navigate to chat
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Chat coming soon!')),
                          );
                        } else {
                          _handleFollowToggle(user);
                        }
                      }
                    },
                    onRemovePressed: isViewingOwnConnections
                        ? (type == 'followers'
                              ? () => _handleRemoveFollower(user)
                              : () => _handleUnfollow(user))
                        : null,
                  );
                }, childCount: _getFilteredList(users).length),
              ),
              if ((type == 'followers' && _isFetchingMoreFollowers) ||
                  (type == 'following' && _isFetchingMoreFollowing))
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ],
        );
      },
    );
  }

  Widget _buildSkeletonList() {
    return shim.Shimmer.fromColors(
      baseColor: AppColors.secondary, // Match image (Lighter)
      highlightColor: AppColors.secondary,
      child: Column(
        children: [
          for (int i = 0; i < 8; i++) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
                children: [
                  // Avatar Skeleton (Match image: 44px)
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // User Info Skeleton
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 100,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 60,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Action Button Skeleton
                  Container(
                    width: 80,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ],
              ),
            ),
            if (i < 7)
              const Divider(height: 1, thickness: 1, color: AppColors.border),
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyState(String type) {
    final title = _searchQuery.isNotEmpty
        ? 'No users found'
        : (type == 'followers' ? 'No followers yet' : 'Not following anyone');

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.mutedForeground,
              ),
            ),
            if (_searchQuery.isEmpty) ...[
              const SizedBox(height: 4),
              Text(
                type == 'followers'
                    ? "When people follow you, you'll see them here."
                    : "When you follow people, you'll see them here.",
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.mutedForeground,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
