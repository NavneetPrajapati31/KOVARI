import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/groups/models/group.dart';

void main() {
  group('ItineraryItem.fromJson', () {
    test('parses production GET /groups/{id}/itinerary payload', () {
      final item = ItineraryItem.fromJson({
        'id': 'item-uuid-1',
        'title': 'Visit Taj Mahal',
        'description': 'Morning tour',
        'datetime': '2026-09-01T09:00:00+05:30',
        'type': 'activity',
        'status': 'pending',
        'location': 'Agra',
        'priority': 'medium',
        'assigned_to': ['user-uuid-a', 'user-uuid-b'],
        'notes': 'Bring camera',
        'image_url': 'https://example.com/img.jpg',
        'external_link': 'https://example.com/booking',
      });

      expect(item.id, 'item-uuid-1');
      expect(item.title, 'Visit Taj Mahal');
      expect(item.description, 'Morning tour');
      expect(item.datetime, '2026-09-01T09:00:00+05:30');
      expect(item.type, 'activity');
      expect(item.status, 'pending');
      expect(item.location, 'Agra');
      expect(item.priority, 'medium');
      expect(item.assignedTo, ['user-uuid-a', 'user-uuid-b']);
      expect(item.notes, 'Bring camera');
      expect(item.imageUrl, 'https://example.com/img.jpg');
      expect(item.externalLink, 'https://example.com/booking');
    });

    test('coalesces null description and location to empty strings', () {
      final item = ItineraryItem.fromJson({
        'id': 'item-2',
        'title': 'Dinner',
        'datetime': '2026-09-02T20:00:00Z',
        'type': 'food',
        'status': 'confirmed',
        'priority': 'low',
      });

      expect(item.description, '');
      expect(item.location, '');
      expect(item.status, 'confirmed');
    });

    test('round-trips through toJson for mobile mutations', () {
      const original = ItineraryItem(
        id: 'item-3',
        title: 'Flight',
        description: 'DEL → BOM',
        datetime: '2026-09-03T06:00:00Z',
        type: 'transport',
        status: 'pending',
        location: 'Airport',
        priority: 'high',
        assignedTo: ['user-1'],
        notes: 'Check-in early',
      );

      final restored = ItineraryItem.fromJson(original.toJson());

      expect(restored.id, original.id);
      expect(restored.title, original.title);
      expect(restored.assignedTo, original.assignedTo);
    });
  });
}
