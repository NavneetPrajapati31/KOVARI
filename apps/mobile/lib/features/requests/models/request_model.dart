import '../../../core/theme/app_colors.dart';
import 'package:flutter/material.dart';

enum RequestStatus {
  pending,
  accepted,
  declined,
}

class InterestModel {
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
    final sender = json['sender'] ?? {};
    return InterestModel(
      id: json['id'] ?? '',
      senderId: sender['id'] ?? '',
      senderName: sender['name'] ?? 'Unknown User',
      senderUsername: sender['username'] ?? 'traveler',
      senderAvatar: sender['avatar'] ?? '',
      senderBio: sender['bio'] ?? '',
      destination: sender['location'] ?? 'Unknown Destination', // Backend maps destination_id to location
      mutualConnections: sender['mutualConnections'] ?? 0,
      sentAt: DateTime.parse(json['sentAt'] ?? DateTime.now().toIso8601String()),
      status: _parseStatus(json['status']),
    );
  }

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

  InterestModel copyWith({RequestStatus? status}) {
    return InterestModel(
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
}

class InvitationModel {
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
    final creator = json['creator'] ?? {};
    final teamMembersJson = json['teamMembers'] as List? ?? [];
    
    return InvitationModel(
      id: json['id'] ?? '',
      groupName: json['groupName'] ?? 'Travel Group',
      groupCoverImage: json['groupCoverImage'],
      creatorName: creator['name'] ?? 'Unknown',
      creatorUsername: creator['username'] ?? 'unknown',
      creatorAvatar: creator['avatar'] ?? '',
      destination: json['destination'] ?? 'Everywhere',
      dates: json['dates'],
      description: json['description'] ?? '',
      memberCount: json['acceptedCount'] ?? 0,
      expiresInDays: json['expiresInDays'] ?? 30,
      inviteDate: DateTime.parse(json['inviteDate'] ?? DateTime.now().toIso8601String()),
      teamMembers: teamMembersJson.map((m) => TeamMemberModel.fromJson(m)).toList(),
      status: RequestStatus.pending, // Invitations from pending-invitations are always pending
    );
  }

  InvitationModel copyWith({RequestStatus? status}) {
    return InvitationModel(
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
}

class TeamMemberModel {
  final String avatar;
  final String initials;
  final String? colorHex;

  TeamMemberModel({
    required this.avatar,
    required this.initials,
    this.colorHex,
  });

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) {
    return TeamMemberModel(
      avatar: json['avatar'] ?? '',
      initials: json['initials'] ?? '?',
      colorHex: json['color'],
    );
  }

  Color get color {
    if (colorHex == null) return AppColors.primary;
    // Map tailwind bg colors to Flutter colors if needed, but for now fallback
    return AppColors.secondary;
  }
}
