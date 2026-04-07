class MatchUser {
  final String id;
  final String name;
  final int age;
  final String location;
  final String image;
  final double score;
  final Map<String, dynamic> raw;

  MatchUser({
    required this.id,
    required this.name,
    required this.age,
    required this.location,
    required this.image,
    required this.score,
    required this.raw,
  });

  factory MatchUser.fromJson(Map<String, dynamic> json) {
    return MatchUser(
      id: (json['userId'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? 'Unknown').toString(),
      age: json['age'] ?? 0,
      location: (json['location'] ?? 'Unknown location').toString(),
      image: json['profilePhoto'] ?? '',
      score: (json['compatibilityScore'] as num?)?.toDouble() ?? 0.0,
      raw: json,
    );
  }
}
