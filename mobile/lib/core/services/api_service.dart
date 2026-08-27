import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }

  final Dio _dio;

  ApiService() : _dio = Dio(BaseOptions(baseUrl: defaultBaseUrl)) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          final customUrl = prefs.getString('custom_base_url');
          if (customUrl != null && customUrl.isNotEmpty) {
            options.baseUrl = customUrl;
          } else {
            options.baseUrl = defaultBaseUrl;
          }
          
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          return handler.next(error);
        },
      ),
    );
  }

  // --- Auth ---
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> register(String username, String email, String password, String role) async {
    final response = await _dio.post('/auth/register', data: {
      'username': username,
      'email': email,
      'password': password,
      'role': role,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getMe() async {
    final response = await _dio.get('/auth/me');
    return response.data;
  }

  // --- Books ---
  Future<List<dynamic>> getBooks({String? search, String? language}) async {
    final response = await _dio.get('/books', queryParameters: {
      'search': search,
      'language': language,
    }..removeWhere((_, v) => v == null));
    return response.data;
  }

  Future<Map<String, dynamic>> getBookById(int id) async {
    final response = await _dio.get('/books/$id');
    return response.data;
  }

  // --- Library (Purchased Books) ---
  Future<List<dynamic>> getMyLibrary() async {
    final response = await _dio.get('/purchases/library');
    return response.data;
  }

  Future<Map<String, dynamic>> purchaseBook(int bookId) async {
    final response = await _dio.post('/purchases', data: {'book_id': bookId});
    return response.data;
  }

  // --- AI Recommendations ---
  Future<List<dynamic>> getRecommendations() async {
    final response = await _dio.get('/recommendations');
    return response.data;
  }

  // --- Search ---
  Future<List<dynamic>> searchBooks({required String query, String? language}) async {
    final response = await _dio.get('/books', queryParameters: {
      'search': query,
      if (language != null && language != 'All') 'language': language,
    });
    return response.data;
  }

  // --- Notifications ---
  Future<List<dynamic>> getNotifications() async {
    final response = await _dio.get('/notifications');
    return response.data;
  }

  Future<void> markNotificationRead(int id) async {
    await _dio.put('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _dio.put('/notifications/read-all');
  }

  // --- Download ---
  Future<String> downloadBook(int bookId, String saveDir) async {
    final savePath = '$saveDir/book_$bookId.pdf';
    await _dio.download('/books/$bookId/download', savePath);
    return savePath;
  }

  // --- Payments ---
  Future<Map<String, dynamic>> initiatePayment(int bookId, String provider) async {
    final response = await _dio.post('/payments/initiate', data: {
      'book_id': bookId,
      'provider': provider,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> confirmPayment(String transactionRef) async {
    final response = await _dio.post('/payments/confirm', data: {
      'transaction_ref': transactionRef,
    });
    return response.data;
  }

  // --- Catalog ---
  Future<List<dynamic>> getCatalog({int page = 1, int limit = 20, String? language}) async {
    final response = await _dio.get('/books', queryParameters: {
      'page': page,
      'limit': limit,
      if (language != null && language != 'All') 'language': language,
    });
    return response.data;
  }
}

