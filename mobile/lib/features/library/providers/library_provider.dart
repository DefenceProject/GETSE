import 'package:flutter/material.dart';
import '../../../core/models/book.dart';
import '../../../core/services/api_service.dart';
import '../../../core/database/local_database.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'dart:io';

class LibraryProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  final LocalDatabase _localDb = LocalDatabase();

  List<Book> _library = [];
  List<Book> _catalog = [];
  List<Book> _recommendations = [];
  bool _isLoading = false;
  String? _error;
  final Map<int, double> _downloadProgress = {};

  List<Book> get library => _library;
  List<Book> get catalog => _catalog;
  List<Book> get recommendations => _recommendations;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<int, double> get downloadProgress => _downloadProgress;

  // Fetch user's purchased library from backend
  Future<void> fetchLibrary() async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.getMyLibrary();
      final downloaded = await _localDb.getDownloadedBooks();
      final downloadedIds = downloaded.map((b) => b['id'] as int).toSet();

      _library = data.map((b) {
        final isDownloaded = downloadedIds.contains(b['id']);
        final localPath = isDownloaded
            ? downloaded.firstWhere((d) => d['id'] == b['id'])['local_pdf_path'] as String
            : null;
        return Book(
          id: b['id'].toString(),
          title: b['title'],
          author: b['author_name'] ?? '',
          description: b['description'] ?? '',
          coverImageUrl: b['cover_image_url'] ?? '',
          bookUrl: b['file_url'] ?? '',
          isDownloaded: isDownloaded,
          localPath: localPath,
        );
      }).toList();
      _error = null;
    } catch (e) {
      // Fallback to offline downloaded books
      final downloaded = await _localDb.getDownloadedBooks();
      _library = downloaded.map((b) => Book(
            id: b['id'].toString(),
            title: b['title'],
            author: b['author_name'],
            description: b['description'] ?? '',
            coverImageUrl: b['cover_image_url'] ?? '',
            bookUrl: '',
            isDownloaded: true,
            localPath: b['local_pdf_path'],
          )).toList();
      _error = 'Offline mode: Showing downloaded books only.';
    }
    _isLoading = false;
    notifyListeners();
  }

  // Fetch all books from catalog
  Future<void> fetchCatalog({String? search, String? language}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.getBooks(search: search, language: language);
      _catalog = data.map((b) => Book(
            id: b['id'].toString(),
            title: b['title'],
            author: b['author_name'] ?? '',
            description: b['description'] ?? '',
            coverImageUrl: b['cover_image_url'] ?? '',
            bookUrl: b['file_url'] ?? '',
          )).toList();
      _error = null;
    } catch (e) {
      _error = 'Failed to load catalog.';
    }
    _isLoading = false;
    notifyListeners();
  }

  // Fetch AI recommendations
  Future<void> fetchRecommendations() async {
    try {
      final data = await _api.getRecommendations();
      _recommendations = data.map((b) => Book(
            id: b['id'].toString(),
            title: b['title'],
            author: b['author_name'] ?? '',
            description: b['description'] ?? '',
            coverImageUrl: b['cover_image_url'] ?? '',
            bookUrl: b['file_url'] ?? '',
          )).toList();
      notifyListeners();
    } catch (_) {
      // Fail silently — recommendations are a bonus
    }
  }

  // Download book for offline reading
  Future<void> downloadBook(Book book) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final savePath = '${dir.path}/books/book_${book.id}.pdf';
      await Directory('${dir.path}/books').create(recursive: true);

      final dio = Dio();
      await dio.download(
        book.bookUrl,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            _downloadProgress[int.parse(book.id)] = received / total;
            notifyListeners();
          }
        },
      );

      await _localDb.saveDownloadedBook({
        'id': int.parse(book.id),
        'title': book.title,
        'author_name': book.author,
        'description': book.description,
        'cover_image_url': book.coverImageUrl,
        'language': 'Amharic',
      }, savePath);

      _downloadProgress.remove(int.parse(book.id));
      await fetchLibrary(); // Refresh library
    } catch (e) {
      _downloadProgress.remove(int.parse(book.id));
      _error = 'Download failed. Please try again.';
      notifyListeners();
    }
  }

  void updateBookStatus(String id, bool isDownloaded, String localPath) {
    final index = _library.indexWhere((b) => b.id == id);
    if (index != -1) {
      _library[index] = _library[index].copyWith(isDownloaded: isDownloaded, localPath: localPath);
      notifyListeners();
    }
  }
}
