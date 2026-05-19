import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/runtime/hydration_engine.dart';
import 'package:mobile/features/groups/models/hydrated_state.dart';
import 'package:mocktail/mocktail.dart';

class MockHydratable extends Mock implements Hydratable<String> {}
class HydratedStateFake extends Fake implements HydratedState<String> {}

void main() {
  setUpAll(() {
    registerFallbackValue(HydratedStateFake());
  });

  late HydrationEngine engine;
  late MockHydratable target;

  setUp(() {
    engine = HydrationEngine();
    target = MockHydratable();
    
    when(() => target.hydrationKey).thenReturn('test_key');
    when(() => target.loadFromDisk()).thenAnswer((_) async {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      return 'disk_data';
    });
    when(() => target.fetchFromNetwork()).thenAnswer((_) async {
      await Future<void>.delayed(const Duration(milliseconds: 20));
      return 'network_data';
    });
    when(() => target.onUpdate(any())).thenReturn(null);
  });

  group('HydrationEngine Deduplication', () {
    test('Multiple concurrent calls for same key share the same sequence', () async {
      final stream1 = engine.hydrate(target);
      final stream2 = engine.hydrate(target);

      final results1 = <HydratedState<String>>[];
      final results2 = <HydratedState<String>>[];

      stream1.listen((s) {
        results1.add(s);
      });
      stream2.listen((s) {
        results2.add(s);
      });

      // Wait for network data to arrive on both streams
      await Future<void>.delayed(const Duration(milliseconds: 200));

      verify(() => target.fetchFromNetwork()).called(1);
      
      expect(results1.any((s) => s.data == 'network_data'), true, reason: 'Stream 1 missed network data');
      expect(results2.any((s) => s.data == 'network_data'), true, reason: 'Stream 2 missed network data');
      expect(results1.last.data, 'network_data');
      expect(results2.last.data, 'network_data');
    });

    test('Late subscriber receives the last known state immediately (Replay)', () async {
      final stream1 = engine.hydrate(target);
      await stream1.firstWhere((s) => s.source == HydrationSource.network);

      final stream2 = engine.hydrate(target);
      final firstState2 = await stream2.first;

      expect(firstState2.data, 'network_data');
      expect(firstState2.source, HydrationSource.network);
    });
  });
}
