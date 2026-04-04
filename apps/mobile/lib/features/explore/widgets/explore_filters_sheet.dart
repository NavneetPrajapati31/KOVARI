import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/location_autocomplete.dart';
import '../../../shared/widgets/select_chip.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/kovari_switch_tile.dart';
import '../models/explore_state.dart';
import '../providers/explore_provider.dart';

class ExploreFiltersSheet extends ConsumerStatefulWidget {
  const ExploreFiltersSheet({super.key});

  @override
  ConsumerState<ExploreFiltersSheet> createState() =>
      _ExploreFiltersSheetState();
}

class _ExploreFiltersSheetState extends ConsumerState<ExploreFiltersSheet> {
  late SearchData _searchData;
  late ExploreFilters _filters;

  @override
  void initState() {
    super.initState();
    final state = ref.read(exploreProvider);
    _searchData = state.searchData;
    _filters = state.filters;
  }

  static const List<String> genderOptions = ["Any", "Male", "Female", "Other"];
  static const List<String> interestOptions = [
    "Adventure",
    "Culture",
    "Food",
    "Nature",
    "Nightlife",
    "Relaxation",
    "Shopping",
    "Sports",
    "Photography",
    "History",
    "Beach",
    "Mountains",
    "Urban",
    "Rural",
    "Wellness",
    "Education",
  ];
  static const List<String> personalityOptions = [
    "Any",
    "Extrovert",
    "Introvert",
    "Ambivert",
  ];
  static const List<String> nationalityOptions = [
    "Any",
    "Indian",
    "American",
    "British",
    "Canadian",
    "Australian",
    "German",
    "French",
    "Japanese",
    "Chinese",
    "Korean",
    "Singaporean",
    "Thai",
    "Vietnamese",
    "Indonesian",
    "Malaysian",
    "Filipino",
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildSectionTitle('Destination'),
                LocationAutocomplete(
                  label: '',
                  initialValue: _searchData.destination,
                  onSelect: (result) {
                    setState(() {
                      _searchData = _searchData.copyWith(
                        destination: result.formatted,
                        destinationDetails: {
                          'lat': result.lat,
                          'lon': result.lon,
                          'city': result.city,
                          'country': result.country,
                        },
                      );
                    });
                  },
                ),
                const SizedBox(height: 24),
                _buildSectionTitle('Trip Dates'),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _searchData.startDate,
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(
                              const Duration(days: 365),
                            ),
                          );
                          if (date != null) {
                            setState(() {
                              _searchData = _searchData.copyWith(
                                startDate: date,
                              );
                            });
                          }
                        },
                        child: Text(
                          DateFormat(
                            'MMM d, yyyy',
                          ).format(_searchData.startDate),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _searchData.endDate,
                            firstDate: _searchData.startDate,
                            lastDate: DateTime.now().add(
                              const Duration(days: 365),
                            ),
                          );
                          if (date != null) {
                            setState(() {
                              _searchData = _searchData.copyWith(endDate: date);
                            });
                          }
                        },
                        child: Text(
                          DateFormat('MMM d, yyyy').format(_searchData.endDate),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildSectionTitle('Budget'),
                Slider(
                  value: _searchData.budget,
                  min: 5000,
                  max: 200000,
                  divisions: 39,
                  label: '₹${_searchData.budget.round()}',
                  onChanged: (value) {
                    setState(() {
                      _searchData = _searchData.copyWith(budget: value);
                    });
                  },
                ),
                Center(
                  child: Text(
                    'Budget: ₹${_searchData.budget.round()}',
                    style: AppTextStyles.bodySmall,
                  ),
                ),
                const SizedBox(height: 24),
                if (_searchData.travelMode == TravelMode.solo) ...[
                  _buildSectionTitle('Age Range'),
                  RangeSlider(
                    values: RangeValues(
                      _filters.ageRange[0].toDouble(),
                      _filters.ageRange[1].toDouble(),
                    ),
                    min: 18,
                    max: 80,
                    divisions: 62,
                    labels: RangeLabels(
                      '${_filters.ageRange[0]}',
                      '${_filters.ageRange[1]}',
                    ),
                    onChanged: (values) {
                      setState(() {
                        _filters = _filters.copyWith(
                          ageRange: [values.start.round(), values.end.round()],
                        );
                      });
                    },
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Gender'),
                  _buildChips(
                    options: genderOptions,
                    selected: [_filters.gender],
                    onSelected: (val) => setState(
                      () => _filters = _filters.copyWith(gender: val),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                _buildSectionTitle('Personality'),
                _buildChips(
                  options: personalityOptions,
                  selected: [_filters.personality],
                  onSelected: (val) => setState(
                    () => _filters = _filters.copyWith(personality: val),
                  ),
                ),
                const SizedBox(height: 24),
                _buildSectionTitle('Interests'),
                _buildChips(
                  options: interestOptions,
                  selected: _filters.interests,
                  onSelected: (val) {
                    final interests = List<String>.from(_filters.interests);
                    if (interests.contains(val)) {
                      interests.remove(val);
                    } else {
                      interests.add(val);
                    }
                    setState(
                      () => _filters = _filters.copyWith(interests: interests),
                    );
                  },
                  multiple: true,
                ),
                const SizedBox(height: 24),
                KovariSwitchTile(
                  label: 'Smoking allowed?',
                  value: _filters.smoking == 'Yes',
                  onChanged: (val) => setState(
                    () => _filters = _filters.copyWith(
                      smoking: val ? 'Yes' : 'No',
                    ),
                  ),
                ),
                KovariSwitchTile(
                  label: 'Drinking allowed?',
                  value: _filters.drinking == 'Yes',
                  onChanged: (val) => setState(
                    () => _filters = _filters.copyWith(
                      drinking: val ? 'Yes' : 'No',
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                _buildSectionTitle('Nationality'),
                _buildChips(
                  options: nationalityOptions,
                  selected: [_filters.nationality],
                  onSelected: (val) => setState(
                    () => _filters = _filters.copyWith(nationality: val),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
          _buildFooter(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('Filters', style: AppTextStyles.h3),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: SafeArea(
        child: PrimaryButton(
          text: 'Apply Filters',
          onPressed: () {
            ref.read(exploreProvider.notifier).updateSearchData(_searchData);
            ref.read(exploreProvider.notifier).updateFilters(_filters);
            ref.read(exploreProvider.notifier).performSearch();
            Navigator.pop(context);
          },
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: AppTextStyles.bodySmall.copyWith(
          fontWeight: FontWeight.bold,
          color: AppColors.mutedForeground,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildChips({
    required List<String> options,
    required List<String> selected,
    required Function(String) onSelected,
    bool multiple = false,
  }) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((option) {
        return SelectChip(
          label: option,
          isSelected: selected.contains(option),
          onTap: () => onSelected(option),
        );
      }).toList(),
    );
  }
}
