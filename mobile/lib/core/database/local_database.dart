import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDatabase {
  static final LocalDatabase _instance = LocalDatabase._internal();
  factory LocalDatabase() => _instance;
  LocalDatabase._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'getse_offline.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE IF NOT EXISTS downloaded_books (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            author_name TEXT NOT NULL,
            description TEXT,
            cover_image_url TEXT,
            local_pdf_path TEXT NOT NULL,
            language TEXT,
            downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS reading_progress (
            id INTEGER PRIMARY KEY,
            book_id INTEGER NOT NULL,
            current_page INTEGER DEFAULT 0,
            total_pages INTEGER DEFAULT 0,
            last_read_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES downloaded_books(id)
          )
        ''');
      },
    );
  }

  // Save a book to local storage (after download)
  Future<void> saveDownloadedBook(Map<String, dynamic> book, String localPath) async {
    final db = await database;
    await db.insert(
      'downloaded_books',
      {
        'id': book['id'],
        'title': book['title'],
        'author_name': book['author_name'],
        'description': book['description'],
        'cover_image_url': book['cover_image_url'],
        'local_pdf_path': localPath,
        'language': book['language'],
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Get all downloaded books
  Future<List<Map<String, dynamic>>> getDownloadedBooks() async {
    final db = await database;
    return await db.query('downloaded_books', orderBy: 'downloaded_at DESC');
  }

  // Check if a book is downloaded
  Future<bool> isBookDownloaded(int bookId) async {
    final db = await database;
    final result = await db.query('downloaded_books', where: 'id = ?', whereArgs: [bookId]);
    return result.isNotEmpty;
  }

  // Save reading progress
  Future<void> saveReadingProgress(int bookId, int currentPage, int totalPages) async {
    final db = await database;
    await db.insert(
      'reading_progress',
      {
        'book_id': bookId,
        'current_page': currentPage,
        'total_pages': totalPages,
        'last_read_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Get reading progress
  Future<Map<String, dynamic>?> getReadingProgress(int bookId) async {
    final db = await database;
    final result = await db.query('reading_progress', where: 'book_id = ?', whereArgs: [bookId]);
    return result.isNotEmpty ? result.first : null;
  }

  // Delete downloaded book
  Future<void> deleteDownloadedBook(int bookId) async {
    final db = await database;
    await db.delete('downloaded_books', where: 'id = ?', whereArgs: [bookId]);
    await db.delete('reading_progress', where: 'book_id = ?', whereArgs: [bookId]);
  }
}
