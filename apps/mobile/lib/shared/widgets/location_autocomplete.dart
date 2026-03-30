import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'dart:async';
import '../../services/api/location_service.dart';
import '../../services/api/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_radius.dart';
import 'text_input_field.dart';

class LocationAutocomplete extends ConsumerStatefulWidget {
  final String label;
  final String? initialValue;
  final Function(GeoapifyResult) onSelect;

  const LocationAutocomplete({
    super.key,
    required this.label,
    this.initialValue,
    required this.onSelect,
  });

  @override
  ConsumerState<LocationAutocomplete> createState() => _LocationAutocompleteState();
}

class _LocationAutocompleteState extends ConsumerState<LocationAutocomplete> {
  final TextEditingController _controller = TextEditingController();
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  List<GeoapifyResult> _suggestions = [];
  bool _isLoading = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    if (widget.initialValue != null) {
      _controller.text = widget.initialValue!;
    }
  }

  void _onChanged(String value) {
    if (value.trim().length < 3) {
      _hideOverlay();
      return;
    }

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () => _fetchSuggestions(value));
  }

  Future<void> _fetchSuggestions(String query) async {
    setState(() => _isLoading = true);
    
    // In a production app, we'd use a provider for the service
    // but here we keep it localized for the reconstruction phase as requested
    final apiClient = ApiClientFactory.create(forceReal: true);
    final service = LocationService(apiClient);
    
    final results = await service.searchLocation(query);
    
    if (mounted) {
      setState(() {
        _suggestions = results;
        _isLoading = false;
      });
      _showOverlay();
    }
  }

  void _showOverlay() {
    _hideOverlay();
    if (_suggestions.isEmpty) return;

    final overlay = Overlay.of(context);
    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        width: _layerLink.leaderSize?.width,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: const Offset(0, 75), // Matches spacing for Step UI parity
          child: Material(
            elevation: 8,
            borderRadius: AppRadius.medium,
            color: Colors.white,
            child: Container(
              constraints: const BoxConstraints(maxHeight: 250),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.border),
                borderRadius: AppRadius.medium,
              ),
              child: ListView.separated(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: _suggestions.length,
                separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.border),
                itemBuilder: (context, index) {
                  final suggestion = _suggestions[index];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    title: Text(
                      suggestion.city.isNotEmpty ? suggestion.city : suggestion.formatted.split(',')[0],
                      style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      suggestion.formatted,
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.mutedForeground),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    onTap: () {
                      _controller.text = suggestion.formatted;
                      widget.onSelect(suggestion);
                      _hideOverlay();
                    },
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );

    overlay.insert(_overlayEntry!);
  }

  void _hideOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: TextInputField(
        label: widget.label,
        controller: _controller,
        hintText: 'Search city...',
        onChanged: _onChanged,
        suffixIcon: _isLoading
            ? const Padding(
                padding: EdgeInsets.all(12),
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            : const Icon(LucideIcons.mapPin, size: 18),
      ),
    );
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _controller.dispose();
    _hideOverlay();
    super.dispose();
  }
}
