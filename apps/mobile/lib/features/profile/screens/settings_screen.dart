import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../providers/settings_provider.dart';
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
      await ref
          .read(settingsServiceProvider)
          .updateEmail(_emailController.text);

      setState(() {
        _pendingNewEmail = _emailController.text;
        _verificationStep = true;
      });
      _showSnackBar('Verification code sent to your new email.');
    } catch (e) {
      _showSnackBar(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isEmailLoading = false);
    }
  }

  Future<void> _handleVerifyEmail() async {
    _showSnackBar('Email updated successfully');
    final currentProfile = ref.read(profileProvider);
    if (currentProfile != null) {
      ref.read(profileProvider.notifier).state = currentProfile.copyWith(
        email: _pendingNewEmail,
      );
    }
    setState(() {
      _showEmailForm = false;
      _verificationStep = false;
    });
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
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'Are you sure you want to delete your account? This action is irreversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.destructive),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isDeleteLoading = true);
      try {
        await ref.read(settingsServiceProvider).deleteAccount();
        _showSnackBar('Account deleted successfully');
        ref.read(authStateProvider.notifier).state = null;
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
    return Container(
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
                style: TextStyle(fontSize: 13, color: AppColors.foreground),
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
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      'Verify email',
                      onPressed: _handleVerifyEmail,
                      isLoading: _isEmailLoading,
                    ),
                  ),
                  const SizedBox(width: 12),
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
            const SizedBox(height: 16),
            _buildTextField(
              controller: _confirmEmailController,
              label: 'Confirm email',
              hint: 'Confirm new email',
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                _buildActionButton(
                  'Continue',
                  onPressed: _handleRequestVerification,
                  isLoading: _isEmailLoading,
                  width: 100,
                ),
                const SizedBox(width: 12),
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
            const SizedBox(height: 16),
            _buildTextField(
              controller: _newPasswordController,
              label: 'New Password',
              hint: 'Enter new password',
              obscureText: true,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              hint: 'Confirm new password',
              obscureText: true,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                _buildActionButton(
                  'Save',
                  onPressed: _handleChangePassword,
                  isLoading: _isPasswordLoading,
                  width: 100,
                ),
                const SizedBox(width: 12),
                _buildCancelButton(
                  () => setState(() => _showPasswordForm = false),
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
            _buildLegalTile('Terms of Service', LucideIcons.fileText),
            _buildLegalTile('Privacy Policy', LucideIcons.shield),
            _buildLegalTile('Community Guidelines', LucideIcons.bookOpen),
            _buildLegalTile(
              'Data Deletion Policy',
              LucideIcons.trash2,
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
        if (!isLast)
          const Divider(
            height: 1,
            indent: 16,
            endIndent: 16,
            color: AppColors.border,
          ),
      ],
    );
  }

  Widget _buildLegalTile(String title, IconData icon, {bool isLast = false}) {
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
          onTap: () {}, // Link behavior
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          visualDensity: VisualDensity.compact,
        ),
        if (!isLast)
          const Divider(
            height: 1,
            indent: 16,
            endIndent: 16,
            color: AppColors.border,
          ),
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
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: const TextStyle(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: AppColors.mutedForeground,
              fontSize: 13,
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 10,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.primary),
            ),
            filled: true,
            fillColor: AppColors.card,
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
    return SizedBox(
      height: 36,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: const Text(
          'Cancel',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppColors.foreground,
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton(
    String label, {
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isDestructive = false,
    double? width,
  }) {
    return Container(
      width: width ?? double.infinity,
      height: 36,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isDestructive
              ? AppColors.destructive
              : AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: isLoading
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primaryForeground,
                ),
              )
            : Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}
