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
  final String? birthday;
  final String userId;
  final String email;

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
    this.birthday,
    required this.userId,
    required this.email,
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
      birthday: json['birthday'],
      userId: json['id'] ?? json['user_id'] ?? '',
      email: json['email'] ?? '',
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
      'birthday': birthday,
      'user_id': userId,
      'email': email,
    };
  }

  UserProfile copyWith({
    String? name,
    String? username,
    String? age,
    String? gender,
    String? nationality,
    String? profession,
    List<String>? interests,
    List<String>? languages,
    String? bio,
    String? followers,
    String? following,
    String? likes,
    String? coverImage,
    String? profileImage,
    List<UserPost>? posts,
    bool? isFollowing,
    bool? isOwnProfile,
    String? location,
    String? religion,
    String? smoking,
    String? drinking,
    String? personality,
    String? foodPreference,
    String? birthday,
    String? userId,
    String? email,
  }) {
    return UserProfile(
      name: name ?? this.name,
      username: username ?? this.username,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      nationality: nationality ?? this.nationality,
      profession: profession ?? this.profession,
      interests: interests ?? this.interests,
      languages: languages ?? this.languages,
      bio: bio ?? this.bio,
      followers: followers ?? this.followers,
      following: following ?? this.following,
      likes: likes ?? this.likes,
      coverImage: coverImage ?? this.coverImage,
      profileImage: profileImage ?? this.profileImage,
      posts: posts ?? this.posts,
      isFollowing: isFollowing ?? this.isFollowing,
      isOwnProfile: isOwnProfile ?? this.isOwnProfile,
      location: location ?? this.location,
      religion: religion ?? this.religion,
      smoking: smoking ?? this.smoking,
      drinking: drinking ?? this.drinking,
      personality: personality ?? this.personality,
      foodPreference: foodPreference ?? this.foodPreference,
      birthday: birthday ?? this.birthday,
      userId: userId ?? this.userId,
      email: email ?? this.email,
    );
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
