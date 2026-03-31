import 'package:flutter_riverpod/legacy.dart';
import '../../shared/models/kovari_user.dart';

/// Global provider to track the current authenticated user.
/// null = Logged Out
/// not null = Logged In
final authStateProvider = StateProvider<KovariUser?>((ref) => null);
