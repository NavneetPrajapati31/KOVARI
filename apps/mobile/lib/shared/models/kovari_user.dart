class KovariUser {
  final String id;
  final String email;
  final String? name;

  KovariUser({
    required this.id,
    required this.email,
    this.name,
  });

  factory KovariUser.fromAuthResponse(Map<String, dynamic> json) {
    return KovariUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
    };
  }

  factory KovariUser.fromJson(Map<String, dynamic> json) {
    return KovariUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
    );
  }
}