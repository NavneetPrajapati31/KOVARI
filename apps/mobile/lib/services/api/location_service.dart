import 'api_client.dart';

class GeoapifyResult {
  final String placeId;
  final String formatted;
  final String city;
  final String state;
  final String country;
  final double lat;
  final double lon;

  GeoapifyResult({
    required this.placeId,
    required this.formatted,
    required this.city,
    required this.state,
    required this.country,
    required this.lat,
    required this.lon,
  });

  factory GeoapifyResult.fromJson(Map<String, dynamic> json) {
    final properties = json['properties'] as Map<String, dynamic>;
    return GeoapifyResult(
      placeId: properties['place_id'] as String,
      formatted: properties['formatted'] as String,
      city: (properties['city'] ?? properties['town'] ?? properties['village'] ?? properties['suburb'] ?? '') as String,
      state: (properties['state'] ?? properties['county'] ?? '') as String,
      country: properties['country'] as String,
      lat: (properties['lat'] as num).toDouble(),
      lon: (properties['lon'] as num).toDouble(),
    );
  }
}

class LocationService {
  final ApiClient _apiClient;

  LocationService(this._apiClient);

  /// Searches for locations using the backend Geoapify proxy.
  /// Type: 'autocomplete'
  Future<List<GeoapifyResult>> searchLocation(String query) async {
    if (query.trim().length < 3) return [];

    try {
      final response = await _apiClient.get(
        'proxy/geocoding',
        queryParameters: {
          'type': 'autocomplete',
          'q': query,
        },
      );

      final features = response.data['features'] as List;
      return features
          .map((f) => GeoapifyResult.fromJson(f as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Gets detailed geocoding data for a specific place_id.
  /// Type: 'details'
  Future<GeoapifyResult?> getLocationDetails(String placeId) async {
    try {
      final response = await _apiClient.get(
        'proxy/geocoding',
        queryParameters: {
          'type': 'details',
          'placeId': placeId,
        },
      );

      final features = response.data['features'] as List;
      if (features.isEmpty) return null;
      return GeoapifyResult.fromJson(features.first as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }
}
