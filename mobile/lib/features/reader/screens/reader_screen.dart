import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import '../../../core/database/local_database.dart';

class ReaderScreen extends StatefulWidget {
  final String bookId;
  final String bookTitle;
  final String localPath;

  const ReaderScreen({
    super.key,
    required this.bookId,
    required this.bookTitle,
    required this.localPath,
  });

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  final LocalDatabase _db = LocalDatabase();
  int _currentPage = 0;
  int _totalPages = 0;
  bool _isReady = false;
  // ignore: unused_field
  PDFViewController? _controller;

  @override
  void dispose() {
    // Save progress when leaving
    if (_totalPages > 0) {
      _db.saveReadingProgress(int.parse(widget.bookId), _currentPage, _totalPages);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.bookTitle,
          style: const TextStyle(fontSize: 16),
        ),
        actions: [
          if (_isReady)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Text(
                '${_currentPage + 1} / $_totalPages',
                style: const TextStyle(fontSize: 14, color: Colors.white70),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          if (_isReady)
            LinearProgressIndicator(
              value: _totalPages > 0 ? (_currentPage + 1) / _totalPages : 0,
              backgroundColor: Colors.grey[200],
              color: Theme.of(context).colorScheme.primary,
            ),
          Expanded(
            child: PDFView(
              filePath: widget.localPath,
              enableSwipe: true,
              swipeHorizontal: false,
              autoSpacing: false,
              pageFling: false,
              onRender: (pages) {
                setState(() {
                  _totalPages = pages ?? 0;
                  _isReady = true;
                });
              },
              onPageChanged: (page, total) {
                setState(() {
                  _currentPage = page ?? 0;
                });
              },
              onError: (error) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error opening PDF: $error')),
                );
              },
              onViewCreated: (controller) {
                _controller = controller;
                // Restore last reading progress
                _db.getReadingProgress(int.parse(widget.bookId)).then((progress) {
                  if (progress != null && progress['current_page'] > 0) {
                    controller.setPage(progress['current_page']);
                  }
                });
              },
            ),
          ),
        ],
      ),
    );
  }
}
