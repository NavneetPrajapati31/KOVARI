import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../../core/network/location_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_radius.dart';
import 'text_input_field.dart';

class LocationAutocomplete extends ConsumerStatefulWidget {
  final String label;
  final String? initialValue;
  final String? hintText;
  final Function(GeoapifyResult) onSelect;
  final Color? fillColor;

  const LocationAutocomplete({
    super.key,
    required this.label,
    this.initialValue,
    this.hintText,
    required this.onSelect,
    this.fillColor,
  });

  @override
  ConsumerState<LocationAutocomplete> createState() =>
      _LocationAutocompleteState();
}

class _LocationAutocompleteState extends ConsumerState<LocationAutocomplete> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final LayerLink _layerLink = LayerLink();
  final GlobalKey _fieldKey = GlobalKey();
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
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (!_focusNode.hasFocus) {
      _hideOverlay();
    } else if (_controller.text.length >= 3) {
      _showOverlay();
    }
  }

  void _onChanged(String value) {
    if (value.trim().length < 3) {
      _hideOverlay();
      setState(() => _suggestions = []);
      return;
    }

    _showOverlay(); // Show "Searching..." state immediately
    _debounceTimer?.cancel();
    _debounceTimer = Timer(
      const Duration(milliseconds: 400),
      () => _fetchSuggestions(value),
    );
  }

  Future<void> _fetchSuggestions(String query) async {
    setState(() => _isLoading = true);
    _updateOverlay();

    final service = LocationService();
    var results = await service.searchLocation(query);

    if (mounted) {
      setState(() {
        _suggestions = results;
        _isLoading = false;
      });
      _updateOverlay();
    }
  }

  void _showOverlay() {
    if (_overlayEntry != null) {
      _updateOverlay();
      return;
    }

    final overlay = Overlay.of(context);
    _overlayEntry = OverlayEntry(
      builder: (context) {
        final RenderBox? renderBox =
            _fieldKey.currentContext?.findRenderObject() as RenderBox?;
        final size = renderBox?.size ?? Size.zero;

        return Positioned(
          width: size.width,
          child: CompositedTransformFollower(
            link: _layerLink,
            showWhenUnlinked: false,
            offset: Offset(0, size.height + 4),
            child: TapRegion(
              groupId: 'location_autocomplete',
              child: Material(
                elevation: 8,
                borderRadius: AppRadius.large,
                color: Colors.white,
                shadowColor: Colors.black.withValues(alpha: 0.1),
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 240),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: AppRadius.large,
                  ),
                  child: _buildOverlayContent(),
                ),
              ),
            ),
          ),
        );
      },
    );

    overlay.insert(_overlayEntry!);
  }

  Widget _buildOverlayContent() {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(10),
        child: Center(
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    if (_suggestions.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(10),
        child: Center(
          child: Text(
            'No results found',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.mutedForeground,
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 4),
      shrinkWrap: true,
      itemCount: _suggestions.length,
      itemBuilder: (context, index) {
        final suggestion = _suggestions[index];
        return InkWell(
          onTap: () async {
            // 1. Update UI immediately (match web)
            _controller.text = suggestion.formatted;
            _hideOverlay();
            _focusNode.unfocus();

            if (!mounted) return;
            setState(() => _isLoading = true);
            final service = LocationService();
            final details = await service.getLocationDetails(
              suggestion.placeId,
            );
            
            if (!mounted) return;
            setState(() => _isLoading = false);

            if (details != null) {
              widget.onSelect(details);
            } else {
              widget.onSelect(suggestion);
            }
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  suggestion.city.isNotEmpty
                      ? suggestion.city
                      : suggestion.formatted.split(',')[0],
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  suggestion.formatted,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.mutedForeground,
                    height: 1.1,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _updateOverlay() {
    _overlayEntry?.markNeedsBuild();
  }

  void _hideOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  Widget build(BuildContext context) {
    return TapRegion(
      groupId: 'location_autocomplete',
      onTapOutside: (_) => _hideOverlay(),
      child: CompositedTransformTarget(
        link: _layerLink,
        child: TextInputField(
          key: _fieldKey,
          label: widget.label,
          controller: _controller,
          focusNode: _focusNode,
          hintText: widget.hintText ?? 'Search city...',
          onChanged: _onChanged,
          fillColor: widget.fillColor,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _controller.dispose();
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _hideOverlay();
    super.dispose();
  }
}
