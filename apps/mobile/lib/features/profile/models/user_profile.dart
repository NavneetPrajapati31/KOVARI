class UserProfile {
  final String name;
  final String username;
  final String age;
  final String gender;
  final String nationality;
  final String profession;
  final List<String> interests;
  final List<String> languages;
  final String bio;
  final String followers;
  final String following;
  final String likes;
  final String coverImage;
  final String profileImage;
  final List<UserPost> posts;
  final bool isFollowing;
  final bool isOwnProfile;
  final String location;
  final String religion;
  final String smoking;
  final String drinking;
  final String personality;
  final String foodPreference;
  final String userId;

  UserProfile({
    required this.name,
    required this.username,
    required this.age,
    required this.gender,
    required this.nationality,
    required this.profession,
    required this.interests,
    required this.languages,
    required this.bio,
    required this.followers,
    required this.following,
    required this.likes,
    required this.coverImage,
    required this.profileImage,
    required this.posts,
    this.isFollowing = false,
    this.isOwnProfile = false,
    required this.location,
    required this.religion,
    required this.smoking,
    required this.drinking,
    required this.personality,
    required this.foodPreference,
    required this.userId,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      age: json['age']?.toString() ?? '',
      gender: json['gender'] ?? '',
      nationality: json['nationality'] ?? '',
      profession: json['profession'] ?? '', // API key is 'profession'
      interests: List<String>.from(json['interests'] ?? []),
      languages: List<String>.from(json['languages'] ?? []),
      bio: json['bio'] ?? '',
      followers: json['followers']?.toString() ?? '0',
      following: json['following']?.toString() ?? '0',
      likes: json['likes']?.toString() ?? '0',
      coverImage: json['cover_image'] ?? '',
      profileImage: json['avatar'] ?? '', // API key is 'avatar'
      posts: (json['posts'] as List? ?? [])
          .map((p) => UserPost.fromJson(p))
          .toList(),
      isFollowing: json['isFollowing'] ?? false,
      isOwnProfile: json['isOwnProfile'] ?? false,
      location: json['location'] ?? '',
      religion: json['religion'] ?? '',
      smoking: json['smoking'] ?? '',
      drinking: json['drinking'] ?? '',
      personality: json['personality'] ?? '',
      foodPreference:
          json['foodPreference'] ?? '', // API key is 'foodPreference'
      userId: json['id'] ?? json['user_id'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'username': username,
      'age': age,
      'gender': gender,
      'nationality': nationality,
      'profession': profession,
      'interests': interests,
      'languages': languages,
      'bio': bio,
      'followers': followers,
      'following': following,
      'likes': likes,
      'cover_image': coverImage,
      'avatar': profileImage,
      'isFollowing': isFollowing,
      'isOwnProfile': isOwnProfile,
      'location': location,
      'religion': religion,
      'smoking': smoking,
      'drinking': drinking,
      'personality': personality,
      'foodPreference': foodPreference,
      'user_id': userId,
    };
  }
}

class UserPost {
  final String id;
  final String imageUrl;

  UserPost({required this.id, required this.imageUrl});

  factory UserPost.fromJson(Map<String, dynamic> json) {
    return UserPost(
      id: json['id']?.toString() ?? '',
      imageUrl: json['image_url'] ?? '',
    );
  }
}
