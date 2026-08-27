import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _api = ApiService();

  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;
  Locale _locale = const Locale('en');

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _token != null;
  Locale get locale => _locale;

  // Check if a token exists on startup
  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load persisted locale
    final langCode = prefs.getString('language_code') ?? 'en';
    _locale = Locale(langCode);
    
    final savedToken = prefs.getString('token');
    if (savedToken != null) {
      _token = savedToken;
      try {
        _user = await _api.getMe();
        notifyListeners();
      } catch (_) {
        _token = null;
        await prefs.remove('token');
      }
    }
    notifyListeners();
  }

  Future<void> toggleLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (_locale.languageCode == 'en') {
      _locale = const Locale('am');
    } else {
      _locale = const Locale('en');
    }
    await prefs.setString('language_code', _locale.languageCode);
    notifyListeners();
  }

  String _handleError(dynamic e, String defaultMessage) {
    debugPrint('API Error: $e');
    if (e is DioException) {
      debugPrint('DioException type: ${e.type}');
      debugPrint('DioException error: ${e.error}');
      debugPrint('DioException response: ${e.response?.data}');
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Please check your internet connection or server IP address settings.';
      }
      if (e.response != null && e.response?.data != null) {
        final data = e.response?.data;
        if (data is Map) {
          if (data.containsKey('message')) {
            return data['message'].toString();
          }
        } else if (data is String) {
          try {
            final decoded = json.decode(data);
            if (decoded is Map && decoded.containsKey('message')) {
              return decoded['message'].toString();
            }
          } catch (_) {
            return data;
          }
        }
      }
    }
    return defaultMessage;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.login(email, password);
      _token = data['token'];
      _user = {
        'id': data['id'],
        'username': data['username'],
        'email': data['email'],
        'role': data['role'],
      };
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _handleError(e, 'Invalid email or password. Please try again.');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String username, String email, String password, String role) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.register(username, email, password, role);
      _token = data['token'];
      _user = {
        'id': data['id'],
        'username': data['username'],
        'email': data['email'],
        'role': data['role'],
      };
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _handleError(e, 'Registration failed. Please try again.');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    notifyListeners();
  }
}
