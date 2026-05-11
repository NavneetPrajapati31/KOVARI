import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

enum RequestStatus {
  pending,
  accepted,
  declined,
}

class InterestModel {

  InterestModel({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.senderUsername,
    required this.senderAvatar,
    required this.senderBio,
    required this.destination,
    required this.mutualConnections,
    required this.sentAt,
    required this.status,
  });

  factory InterestModel.fromJson(Map<String, dynamic> json) {
    final sender = (json['sender'] as Map<String, dynamic>?) ?? {};
    return InterestModel(
      id: (json['id'] as String?) ?? '',
      senderId: (sender['id'] as String?) ?? '',
      senderName: (sender['name'] as String?) ?? 'Unknown User',
      senderUsername: (sender['username'] as String?) ?? 'traveler',
      senderAvatar: (sender['avatar'] as String?) ?? '',
      senderBio: (sender['bio'] as String?) ?? '',
      destination: (sender['location'] as String?) ?? 'Unknown Destination', // Backend maps destination_id to location
      mutualConnections: (sender['mutualConnections'] as int?) ?? 0,
      sentAt: DateTime.parse((json['sentAt'] as String?) ?? DateTime.now().toIso8601String()),
      status: _parseStatus(json['status'] as String?),
    );
  }
  final String id;
  final String senderId;
  final String senderName;
  final String senderUsername;
  final String senderAvatar;
  final String senderBio;
  final String destination;
  final int mutualConnections;
  final DateTime sentAt;
  final RequestStatus status;

  static RequestStatus _parseStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return RequestStatus.accepted;
      case 'rejected':
      case 'declined':
        return RequestStatus.declined;
      default:
        return RequestStatus.pending;
    }
  }

  InterestModel copyWith({RequestStatus? status}) => InterestModel(
      id: id,
      senderId: senderId,
      senderName: senderName,
      senderUsername: senderUsername,
      senderAvatar: senderAvatar,
      senderBio: senderBio,
      destination: destination,
      mutualConnections: mutualConnections,
      sentAt: sentAt,
      status: status ?? this.status,
    );
}

class InvitationModel {

  InvitationModel({
    required this.id,
    required this.groupName,
    this.groupCoverImage,
    required this.creatorName,
    required this.creatorUsername,
    required this.creatorAvatar,
    required this.destination,
    this.dates,
    required this.description,
    required this.memberCount,
    required this.expiresInDays,
    required this.inviteDate,
    required this.teamMembers,
    required this.status,
  });

  factory InvitationModel.fromJson(Map<String, dynamic> json) {
    final creator = (json['creator'] as Map<String, dynamic>?) ?? {};
    final teamMembersJson = json['teamMembers'] as List? ?? [];
    
    return InvitationModel(
      id: (json['id'] as String?) ?? '',
      groupName: (json['groupName'] as String?) ?? 'Travel Group',
      groupCoverImage: json['groupCoverImage'] as String?,
      creatorName: (creator['name'] as String?) ?? 'Unknown',
      creatorUsername: (creator['username'] as String?) ?? 'unknown',
      creatorAvatar: (creator['avatar'] as String?) ?? '',
      destination: (json['destination'] as String?) ?? 'Everywhere',
      dates: json['dates'] as String?,
      description: (json['description'] as String?) ?? '',
      memberCount: (json['acceptedCount'] as int?) ?? 0,
      expiresInDays: (json['expiresInDays'] as int?) ?? 30,
      inviteDate: DateTime.parse((json['inviteDate'] as String?) ?? DateTime.now().toIso8601String()),
      teamMembers: teamMembersJson.map((m) => TeamMemberModel.fromJson(m as Map<String, dynamic>)).toList(),
      status: RequestStatus.pending, // Invitations from pending-invitations are always pending
    );
  }
  final String id;
  final String groupName;
  final String? groupCoverImage;
  final String creatorName;
  final String creatorUsername;
  final String creatorAvatar;
  final String destination;
  final String? dates;
  final String description;
  final int memberCount;
  final int expiresInDays;
  final DateTime inviteDate;
  final List<TeamMemberModel> teamMembers;
  final RequestStatus status;

  InvitationModel copyWith({RequestStatus? status}) => InvitationModel(
      id: id,
      groupName: groupName,
      groupCoverImage: groupCoverImage,
      creatorName: creatorName,
      creatorUsername: creatorUsername,
      creatorAvatar: creatorAvatar,
      destination: destination,
      dates: dates,
      description: description,
      memberCount: memberCount,
      expiresInDays: expiresInDays,
      inviteDate: inviteDate,
      teamMembers: teamMembers,
      status: status ?? this.status,
    );
}

class TeamMemberModel {

  TeamMemberModel({
    required this.avatar,
    required this.initials,
    this.colorHex,
  });

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) => TeamMemberModel(
      avatar: (json['avatar'] as String?) ?? '',
      initials: (json['initials'] as String?) ?? '?',
      colorHex: json['color'] as String?,
    );
  final String avatar;
  final String initials;
  final String? colorHex;

  Color get color {
    if (colorHex == null) return AppColors.primary;
    // Map tailwind bg colors to Flutter colors if needed, but for now fallback
    return AppColors.secondary;
  }
}
