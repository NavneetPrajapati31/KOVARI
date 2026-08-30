import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/groups/models/group.dart';

void main() {
  group('GroupModel.fromJson', () {
    test('maps cover image from canonical and legacy keys', () {
      final fromCanonical = GroupModel.fromJson({
        'id': 'g-1',
        'name': 'Canonical',
        'destination': 'Tokyo',
        'coverImage': 'https://cdn.example.com/canonical.jpg',
        'memberCount': 2,
        'creator': {'name': 'Alex', 'username': 'alex'},
      });

      final fromLegacy = GroupModel.fromJson({
        'id': 'g-2',
        'name': 'Legacy',
        'destination': 'Tokyo',
        'image': 'https://cdn.example.com/legacy.jpg',
        'memberCount': 2,
        'creator': {'name': 'Alex', 'username': 'alex'},
      });

      expect(fromCanonical.coverImage, 'https://cdn.example.com/canonical.jpg');
      expect(fromLegacy.coverImage, 'https://cdn.example.com/legacy.jpg');
    });

    test('maps metadata fields used by GroupMatchCard', () {
      final group = GroupModel.fromJson({
        'id': 'g-3',
        'name': 'Bali Trip',
        'destination': 'Bali',
        'description': 'Beach lovers welcome',
        'tags': ['Surfing', 'Food'],
        'languages': ['English'],
        'smokingPolicy': 'Non-smokers preferred',
        'drinkingPolicy': 'Social drinkers welcome',
        'startDate': '2026-09-01',
        'endDate': '2026-09-10',
        'memberCount': 4,
        'creator': {'name': 'Sam', 'username': 'sam'},
      });

      expect(group.description, 'Beach lovers welcome');
      expect(group.tags, ['Surfing', 'Food']);
      expect(group.languages, ['English']);
      expect(group.smokingPolicy, 'Non-smokers preferred');
      expect(group.drinkingPolicy, 'Social drinkers welcome');
      expect(group.dateRange.start, '2026-09-01');
      expect(group.dateRange.end, '2026-09-10');
    });

    test('falls back from interests to tags for legacy API payloads', () {
      final group = GroupModel.fromJson({
        'id': 'g-4',
        'name': 'Interests Fallback',
        'destination': 'Paris',
        'interests': ['Art', 'Food'],
        'dominantLanguages': ['French', 'English'],
        'memberCount': 3,
        'creator': {'name': 'Lee', 'username': 'lee'},
      });

      expect(group.tags, ['Art', 'Food']);
      expect(group.languages, ['French', 'English']);
    });

    test('handles missing optional metadata without throwing', () {
      final group = GroupModel.fromJson({
        'id': 'g-5',
        'name': 'Minimal',
        'destination': 'London',
        'memberCount': 1,
        'creator': {'name': 'Unknown', 'username': 'unknown'},
      });

      expect(group.description, isNull);
      expect(group.tags, isNull);
      expect(group.languages, isNull);
      expect(group.smokingPolicy, isNull);
      expect(group.drinkingPolicy, isNull);
      expect(group.coverImage, isNull);
    });

    test('parses creator interests and languages safely', () {
      final group = GroupModel.fromJson({
        'id': 'g-6',
        'name': 'Creator Safe Parse',
        'destination': 'Dubai',
        'memberCount': 1,
        'creator': {
          'name': 'Test Kovari',
          'username': 'test',
          'gender': '',
          'interests': ['', 'food', 123],
          'languages': [null, 'English'],
        },
      });

      expect(group.creator.interests, ['food', '123']);
      expect(group.creator.languages, ['English']);
    });
  });
}
