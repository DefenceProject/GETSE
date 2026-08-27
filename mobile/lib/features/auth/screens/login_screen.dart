import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/localization.dart';
import '../../../core/services/api_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../library/screens/library_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _isRegisterMode = false;
  final _usernameCtrl = TextEditingController();
  String _selectedRole = 'READER';

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _usernameCtrl.dispose();
    super.dispose();
  }
  Future<void> _showSettingsDialog() async {
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString('custom_base_url') ?? '';
    final controller = TextEditingController(text: customUrl);

    if (!mounted) return;
    final loc = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.dns, color: Colors.blue),
              const SizedBox(width: 8),
              Text(loc?.translate('api_config') ?? 'API Configuration'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                loc?.translate('server_url_prompt') ?? 'Enter the backend API server base URL:',
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  labelText: loc?.translate('base_url') ?? 'Base URL',
                  hintText: 'http://192.168.1.100:5000/api',
                  border: const OutlineInputBorder(),
                  helperText: '${loc?.translate('reset_default') ?? 'Default'}: ${ApiService.defaultBaseUrl}',
                ),
              ),
              const SizedBox(height: 8),
              Text(
                loc?.translate('server_url_note') ?? 'Note: If using a physical Android device, use your host machine\'s IP (e.g. http://192.168.x.x:5000/api).',
                style: const TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic),
              ),
            ],
          ),
          actions: [
            TextButton(
              child: Text(loc?.translate('reset_default') ?? 'Reset to Default'),
              onPressed: () async {
                await prefs.remove('custom_base_url');
                if (!ctx.mounted) return;
                Navigator.of(ctx).pop();
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(loc?.translate('server_url_reset') ?? 'Server URL reset to platform default.')),
                );
              },
            ),
            TextButton(
              child: Text(loc?.translate('cancel') ?? 'Cancel'),
              onPressed: () => Navigator.of(ctx).pop(),
            ),
            ElevatedButton(
              child: Text(loc?.translate('save') ?? 'Save'),
              onPressed: () async {
                final url = controller.text.trim();
                if (url.isNotEmpty && !url.startsWith('http')) {
                  if (!ctx.mounted) return;
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(content: Text(loc?.translate('url_start_error') ?? 'URL must start with http:// or https://'), backgroundColor: Colors.red),
                  );
                  return;
                }
                if (url.isEmpty) {
                  await prefs.remove('custom_base_url');
                } else {
                  await prefs.setString('custom_base_url', url);
                }
                if (!ctx.mounted) return;
                Navigator.of(ctx).pop();
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${loc?.translate('server_url_updated') ?? 'Server URL updated:'} ${url.isEmpty ? ApiService.defaultBaseUrl : url}')),
                );
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);

    bool success;
    if (_isRegisterMode) {
      success = await auth.register(_usernameCtrl.text.trim(), _emailCtrl.text.trim(), _passwordCtrl.text, _selectedRole);
    } else {
      success = await auth.login(_emailCtrl.text.trim(), _passwordCtrl.text);
    }

    if (!mounted) return;
    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LibraryScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'An error occurred'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final primaryColor = Theme.of(context).colorScheme.primary;
    final loc = AppLocalizations.of(context);

    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [primaryColor, primaryColor.withValues(alpha: 0.7), Colors.white],
                stops: const [0.0, 0.3, 0.6],
              ),
            ),
            child: SafeArea(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const SizedBox(height: 40),
                      const Icon(Icons.menu_book, size: 64, color: Colors.white),
                      const SizedBox(height: 8),
                      Text(loc?.translate('title') ?? 'GETSE', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 2)),
                      Text(loc?.translate('subtitle') ?? 'Ethiopian Digital Library', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                      const SizedBox(height: 40),
                      Card(
                        elevation: 8,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  _isRegisterMode 
                                      ? (loc?.translate('create_account') ?? 'Create Account') 
                                      : (loc?.translate('welcome_back') ?? 'Welcome Back'),
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: primaryColor),
                                ),
                                const SizedBox(height: 24),
                                if (_isRegisterMode) ...[
                                  TextFormField(
                                    controller: _usernameCtrl,
                                    decoration: _inputDecoration(loc?.translate('username') ?? 'Username', Icons.person),
                                    validator: (v) => v!.isEmpty ? (loc?.translate('username_required') ?? 'Username required') : null,
                                  ),
                                  const SizedBox(height: 16),
                                  DropdownButtonFormField<String>(
                                    initialValue: _selectedRole,
                                    decoration: _inputDecoration(loc?.translate('role_prompt') ?? 'I am a...', Icons.badge),
                                    items: [
                                      DropdownMenuItem(value: 'READER', child: Text(loc?.translate('reader') ?? 'Reader')),
                                      DropdownMenuItem(value: 'AUTHOR', child: Text(loc?.translate('author') ?? 'Author')),
                                    ],
                                    onChanged: (v) => setState(() => _selectedRole = v!),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                TextFormField(
                                  controller: _emailCtrl,
                                  decoration: _inputDecoration(loc?.translate('email') ?? 'Email', Icons.email),
                                  keyboardType: TextInputType.emailAddress,
                                  validator: (v) => v!.isEmpty ? (loc?.translate('email_required') ?? 'Email required') : null,
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _passwordCtrl,
                                  decoration: _inputDecoration(loc?.translate('password') ?? 'Password', Icons.lock).copyWith(
                                    suffixIcon: IconButton(
                                      icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                    ),
                                  ),
                                  obscureText: _obscurePassword,
                                  validator: (v) => v!.length < 6 ? (loc?.translate('password_length') ?? 'Min 6 characters') : null,
                                ),
                                const SizedBox(height: 24),
                                ElevatedButton(
                                  onPressed: auth.isLoading ? null : _submit,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: auth.isLoading
                                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                      : Text(
                                          _isRegisterMode 
                                              ? (loc?.translate('register') ?? 'REGISTER') 
                                              : (loc?.translate('login') ?? 'LOGIN'), 
                                          style: const TextStyle(fontSize: 16),
                                        ),
                                ),
                                const SizedBox(height: 16),
                                TextButton(
                                  onPressed: () => setState(() => _isRegisterMode = !_isRegisterMode),
                                  child: Text(
                                    _isRegisterMode 
                                        ? (loc?.translate('has_account') ?? 'Already have an account? Login') 
                                        : (loc?.translate('no_account') ?? "Don't have an account? Register"),
                                    style: TextStyle(color: primaryColor),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 16,
            right: 16,
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.translate, color: Colors.white, size: 28),
                    tooltip: 'Change Language',
                    onPressed: () => auth.toggleLanguage(),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.settings, color: Colors.white, size: 28),
                    tooltip: loc?.translate('server_settings') ?? 'Server Settings',
                    onPressed: _showSettingsDialog,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      filled: true,
      fillColor: Colors.grey[50],
    );
  }
}
