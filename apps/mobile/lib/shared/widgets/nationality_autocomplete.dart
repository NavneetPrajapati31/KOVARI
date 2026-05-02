import 'package:flutter/material.dart';
import '../../core/constants/countries.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'text_input_field.dart';

class NationalityAutocomplete extends StatefulWidget {
  final String label;
  final String? initialValue;
  final Function(String) onSelect;
  final Color? fillColor;

  const NationalityAutocomplete({
    super.key,
    required this.label,
    this.initialValue,
    required this.onSelect,
    this.fillColor,
  });

  @override
  State<NationalityAutocomplete> createState() =>
      _NationalityAutocompleteState();
}

class _NationalityAutocompleteState extends State<NationalityAutocomplete> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final LayerLink _layerLink = LayerLink();
  final GlobalKey _fieldKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  List<String> _filteredCountries = [];

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
    } else if (_controller.text.isNotEmpty) {
      _showOverlay();
    }
  }

  void _onChanged(String value) {
    if (value.isEmpty) {
      _hideOverlay();
      setState(() => _filteredCountries = []);
      return;
    }

    final filtered = AppConstants.countries
        .where((country) => country.toLowerCase().contains(value.toLowerCase()))
        .toList();

    setState(() => _filteredCountries = filtered);

    if (_filteredCountries.isNotEmpty) {
      _showOverlay();
    } else {
      _hideOverlay();
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
              groupId: 'nationality_autocomplete',
              child: Material(
                elevation: 8,
                borderRadius: BorderRadius.all(Radius.circular(12)),
                color: Colors.white,
                shadowColor: Colors.black.withValues(alpha: 0.1),
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 200),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.all(Radius.circular(12)),
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
    if (_filteredCountries.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: Text(
          'No nationality found',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.mutedForeground,
          ),
        ),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final country in _filteredCountries)
          InkWell(
            onTap: () {
              _controller.text = country;
              widget.onSelect(country);
              _hideOverlay();
              _focusNode.unfocus();
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Text(
                country,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w500,
                  height: 1,
                ),
              ),
            ),
          ),
      ],
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
      groupId: 'nationality_autocomplete',
      onTapOutside: (_) => _hideOverlay(),
      child: CompositedTransformTarget(
        link: _layerLink,
        child: TextInputField(
          key: _fieldKey,
          label: widget.label,
          controller: _controller,
          focusNode: _focusNode,
          hintText: 'Search nationality...',
          onChanged: _onChanged,
          fillColor: widget.fillColor,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _hideOverlay();
    super.dispose();
  }
}
