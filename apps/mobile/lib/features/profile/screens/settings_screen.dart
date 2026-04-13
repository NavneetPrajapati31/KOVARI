import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile/shared/widgets/primary_button.dart';
import 'package:mobile/shared/widgets/secondary_button.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/services/local_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/api_error_handler.dart';
// import '../../../shared/widgets/kovari_avatar.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _isPasswordLoading = false;
  bool _isEmailLoading = false;
  bool _isDeleteLoading = false;

  // Form visibility states
  bool _showEmailForm = false;
  bool _showPasswordForm = false;
  bool _verificationStep = false;
  String _pendingNewEmail = '';

  // Controllers
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _emailController = TextEditingController();
  final _confirmEmailController = TextEditingController();
  final _verificationCodeController = TextEditingController();

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _emailController.dispose();
    _confirmEmailController.dispose();
    _verificationCodeController.dispose();
    super.dispose();
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontSize: 14)),
        backgroundColor: isError ? AppColors.destructive : Colors.green[600],
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleRequestVerification() async {
    if (_emailController.text != _confirmEmailController.text) {
      _showSnackBar('Email addresses do not match', isError: true);
      return;
    }

    setState(() => _isEmailLoading = true);
    try {
      final response = await ref
          .read(settingsServiceProvider)
          .updateEmail(_emailController.text);

      if (response['verificationRequired'] == true) {
        setState(() {
          _pendingNewEmail = _emailController.text;
          _verificationStep = true;
        });
        _showSnackBar(
          response['message'] ?? 'Verification code sent to your new email.',
        );
      } else {
        // Direct update succeeded (unlikely now)
        final currentProfile = ref.read(profileProvider);
        if (currentProfile != null) {
          ref.read(profileProvider.notifier).setProfile(currentProfile.copyWith(
            email: _emailController.text,
          ));
        }
        setState(() => _showEmailForm = false);
        _showSnackBar('Email updated successfully');
      }
    } catch (e) {
      _showSnackBar(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isEmailLoading = false);
    }
  }

  Future<void> _handleVerifyEmail() async {
    if (_verificationCodeController.text.length != 6) {
      _showSnackBar('Please enter a 6-digit code', isError: true);
      return;
    }

    setState(() => _isEmailLoading = true);
    try {
      await ref
          .read(settingsServiceProvider)
          .verifyEmail(_pendingNewEmail, _verificationCodeController.text);

      _showSnackBar('Email updated successfully');
      final currentProfile = ref.read(profileProvider);
      if (currentProfile != null) {
        ref.read(profileProvider.notifier).setProfile(currentProfile.copyWith(
          email: _pendingNewEmail,
        ));
      }
      setState(() {
        _showEmailForm = false;
        _verificationStep = false;
        _emailController.clear();
        _confirmEmailController.clear();
        _verificationCodeController.clear();
      });
    } catch (e) {
      _showSnackBar(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isEmailLoading = false);
    }
  }

  Future<void> _handleForgotPassword() async {
    final profile = ref.read(profileProvider);
    if (profile?.email == null || profile!.email.isEmpty) {
      _showSnackBar('No email associated with your account', isError: true);
      return;
    }

    setState(() => _isPasswordLoading = true);
    try {
      final authService = AuthService(
        ApiClientFactory.create(),
        LocalStorage(),
      );
      await authService.requestPasswordReset(profile.email);
      _showSnackBar('Password reset link sent to ${profile.email}');
    } catch (e) {
      _showSnackBar(ApiErrorHandler.extractError(e), isError: true);
    } finally {
      if (mounted) setState(() => _isPasswordLoading = false);
    }
  }

  Future<void> _handleChangePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showSnackBar('New passwords do not match', isError: true);
      return;
    }

    setState(() => _isPasswordLoading = true);
    try {
      await ref
          .read(settingsServiceProvider)
          .changePassword(
            currentPassword: _currentPasswordController.text,
            newPassword: _newPasswordController.text,
            confirmPassword: _confirmPasswordController.text,
          );
      _showSnackBar('Password updated successfully');
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      setState(() => _showPasswordForm = false);
    } catch (e) {
      _showSnackBar(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isPasswordLoading = false);
    }
  }

  Future<void> _handleDeleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Delete your account?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.foreground,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'This will permanently delete your account and all associated data. This action cannot be undone.',
                textAlign: TextAlign.start,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: AppColors.mutedForeground,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: SecondaryButton(
                      text: 'Cancel',
                      height: 36,
                      onPressed: () => Navigator.pop(context, false),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: PrimaryButton(
                      text: 'Delete',
                      height: 36,
                      backgroundColor: AppColors.destructive,
                      onPressed: () => Navigator.pop(context, true),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed == true) {
      setState(() => _isDeleteLoading = true);
      try {
        await ref.read(settingsServiceProvider).deleteAccount();
        _showSnackBar('Account deleted successfully');
        await ref.read(authStateProvider.notifier).logout();
        if (!mounted) return;
        Navigator.of(context).popUntil((route) => route.isFirst);
      } catch (e) {
        _showSnackBar(
          e.toString().replaceAll('Exception: ', ''),
          isError: true,
        );
      } finally {
        if (mounted) setState(() => _isDeleteLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          Container(
            color: AppColors.card,
            child: SafeArea(bottom: false, child: _buildHeader(context)),
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 24,
                ),
                child: Column(
                  children: [
                    _buildSectionHeader(
                      'Manage email',
                      'Change your account email address.',
                    ),
                    const SizedBox(height: 16),
                    _buildAccountSection(profile?.email ?? ''),
                    const SizedBox(height: 32),
                    _buildSectionHeader(
                      'Manage password',
                      'Change your account password.',
                    ),
                    const SizedBox(height: 16),
                    _buildSecuritySection(),
                    const SizedBox(height: 32),
                    _buildSectionHeader(
                      'Delete account',
                      'This action is permanent and cannot be undone.',
                      isDestructive: true,
                    ),
                    const SizedBox(height: 16),
                    _buildDangerZoneSection(),
                    const SizedBox(height: 32),
                    _buildSectionHeader(
                      'Legal & Policies',
                      'Review Kovari\'s policies and your acceptance history.',
                    ),
                    const SizedBox(height: 16),
                    _buildLegalSection(),
                    // const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 4, right: 16, top: 16, bottom: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          _buildBackButton(context),
          const SizedBox(width: 4),
          const Expanded(
            child: Text(
              'Settings',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackButton(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: const Icon(
          LucideIcons.arrowLeft,
          size: 20,
          color: AppColors.foreground,
        ),
      ),
    );
  }

  Widget _buildSectionHeader(
    String title,
    String subtitle, {
    bool isDestructive = false,
  }) {
    return SizedBox(
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isDestructive
                  ? AppColors.destructive
                  : AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(fontSize: 13, color: AppColors.mutedForeground),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child, Color? borderColor}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor ?? AppColors.border),
      ),
      child: child,
    );
  }

  Widget _buildAccountSection(String currentEmail) {
    if (!_showEmailForm) {
      return _buildCard(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Current email',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.foreground,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                currentEmail,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 12),
              _buildOutlineButton(
                'Change Email',
                onPressed: () => setState(() => _showEmailForm = true),
              ),
            ],
          ),
        ),
      );
    }

    if (_verificationStep) {
      return _buildCard(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Verify your new email',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Text(
                "We've sent a 6-digit code to $_pendingNewEmail. Enter it below.",
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.mutedForeground,
                ),
              ),
              const SizedBox(height: 24),
              _buildTextField(
                controller: _verificationCodeController,
                label: 'Verification code',
                hint: 'Enter 6-digit code',
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Expanded(
                    child: _buildActionButton(
                      'Verify email',
                      onPressed: _handleVerifyEmail,
                      isLoading: _isEmailLoading,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _buildCancelButton(
                    () => setState(() {
                      _showEmailForm = false;
                      _verificationStep = false;
                    }),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    return _buildCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildTextField(
              controller: _emailController,
              label: 'New email',
              hint: 'Enter new email',
            ),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _confirmEmailController,
              label: 'Confirm email',
              hint: 'Confirm new email',
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                _buildActionButton(
                  'Continue',
                  onPressed: _handleRequestVerification,
                  isLoading: _isEmailLoading,
                  width: null, // Allow intrinsic width
                ),
                const SizedBox(width: 8),
                _buildCancelButton(
                  () => setState(() => _showEmailForm = false),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecuritySection() {
    if (!_showPasswordForm) {
      return _buildCard(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Keep your account secure',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                'Set a strong new password to help keep your account secure.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.mutedForeground,
                ),
              ),
              const SizedBox(height: 12),
              _buildOutlineButton(
                'Change Password',
                onPressed: () => setState(() => _showPasswordForm = true),
              ),
            ],
          ),
        ),
      );
    }

    return _buildCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildTextField(
              controller: _currentPasswordController,
              label: 'Current Password',
              hint: 'Enter current password',
              obscureText: true,
            ),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _newPasswordController,
              label: 'New Password',
              hint: 'Enter new password',
              obscureText: true,
            ),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              hint: 'Confirm new password',
              obscureText: true,
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: _isPasswordLoading ? null : _handleForgotPassword,
                  child: Text(
                    'Forgot password',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary.withValues(
                        alpha: _isPasswordLoading ? 0.5 : 1,
                      ),
                    ),
                  ),
                ),
                Row(
                  children: [
                    _buildActionButton(
                      'Save',
                      onPressed: _handleChangePassword,
                      isLoading: _isPasswordLoading,
                      width: null,
                    ),
                    const SizedBox(width: 8),
                    _buildCancelButton(
                      () => setState(() => _showPasswordForm = false),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDangerZoneSection() {
    return _buildCard(
      borderColor: AppColors.border,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Permanently remove your account',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Deleting your account removes your profile, groups, and activity.',
              style: TextStyle(fontSize: 13, color: AppColors.mutedForeground),
            ),
            const SizedBox(height: 12),
            _buildActionButton(
              'Delete Account',
              onPressed: _handleDeleteAccount,
              isLoading: _isDeleteLoading,
              isDestructive: true,
              height: 36,
              width: double.infinity,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegalSection() {
    return Column(
      children: [
        _buildExpandingList(
          title: 'POLICY DOCUMENTS',
          children: [
            _buildLegalTile(
              'Terms of Service',
              LucideIcons.fileText,
              url: 'https://kovari.in/terms',
            ),
            _buildLegalTile(
              'Privacy Policy',
              LucideIcons.shield,
              url: 'https://kovari.in/privacy',
            ),
            _buildLegalTile(
              'Community Guidelines',
              LucideIcons.bookOpen,
              url: 'https://kovari.in/community-guidelines',
            ),
            _buildLegalTile(
              'Data Deletion Policy',
              LucideIcons.trash2,
              url: 'https://kovari.in/data-deletion',
              isLast: true,
            ),
          ],
        ),
        const SizedBox(height: 24),
        _buildExpandingList(
          title: 'POLICY ACCEPTANCE STATUS',
          children: [
            _buildStatusTile(
              'Terms of Service',
              'Accepted: Mar 4, 2026',
              'Version: 2026-03-03',
            ),
            _buildStatusTile(
              'Privacy Policy',
              'Accepted: Mar 4, 2026',
              'Version: 2026-03-03',
            ),
            _buildStatusTile(
              'Community Guidelines',
              'Accepted: Mar 4, 2026',
              'Version: 2026-03-03',
              isLast: true,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildExpandingList({
    required String title,
    required List<Widget> children,
  }) {
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppColors.mutedForeground,
                letterSpacing: 1.2,
              ),
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildStatusTile(
    String title,
    String accepted,
    String version, {
    bool isLast = false,
  }) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    accepted,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                  Text(
                    version,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ],
              ),
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF22C55E),
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
        ),
        if (!isLast) const Divider(height: 1, color: AppColors.border),
      ],
    );
  }

  Widget _buildLegalTile(
    String title,
    IconData icon, {
    required String url,
    bool isLast = false,
  }) {
    return Column(
      children: [
        ListTile(
          leading: Icon(icon, size: 18, color: AppColors.mutedForeground),
          title: Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: AppColors.foreground,
            ),
          ),
          trailing: const Icon(
            LucideIcons.externalLink,
            size: 14,
            color: AppColors.mutedForeground,
          ),
          onTap: () =>
              launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          visualDensity: VisualDensity.compact,
        ),
        if (!isLast) const Divider(height: 1, color: AppColors.border),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.foreground,
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          height: 40,
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            keyboardType: keyboardType,
            style: const TextStyle(fontSize: 13),
            decoration: InputDecoration(
              isDense: true,
              hintText: hint,
              hintStyle: TextStyle(
                color: AppColors.mutedForeground,
                fontSize: 13,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
              filled: true,
              fillColor: AppColors.card,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOutlineButton(String label, {required VoidCallback onPressed}) {
    return SizedBox(
      width: double.infinity,
      height: 36,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: AppColors.border),
          backgroundColor: AppColors.background,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.foreground,
          ),
        ),
      ),
    );
  }

  Widget _buildCancelButton(VoidCallback onPressed) {
    return SecondaryButton(
      onPressed: onPressed,
      icon: LucideIcons.x,
      width: 32,
      height: 32,
    );
  }

  Widget _buildActionButton(
    String label, {
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isDestructive = false,
    double? width,
    double? height,
  }) {
    return PrimaryButton(
      text: label,
      onPressed: onPressed,
      isLoading: isLoading,
      width: width ?? 0,
      height: height ?? 32,
      backgroundColor: isDestructive
          ? AppColors.destructive
          : AppColors.primary,
      foregroundColor: AppColors.primaryForeground,
      isDestructive: isDestructive,
    );
  }
}
