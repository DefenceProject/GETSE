import 'package:flutter/material.dart';
import '../../../core/database/local_database.dart';
import 'reader_screen.dart';

class DownloadsScreen extends StatefulWidget {
  const DownloadsScreen({super.key});

  @override
  State<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends State<DownloadsScreen> {
  List<Map<String, dynamic>> _downloads = [];
  bool _isLoading = true;

  final LocalDatabase _localDb = LocalDatabase();

  @override
  void initState() {
    super.initState();
    _loadDownloads();
  }

  Future<void> _loadDownloads() async {
    setState(() => _isLoading = true);
    final data = await _localDb.getDownloadedBooks();
    setState(() {
      _downloads = data;
      _isLoading = false;
    });
  }

  Future<void> _deleteDownload(int bookId, String title) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Download'),
        content: Text('Delete offline copy of "$title"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _localDb.deleteDownloadedBook(bookId);
      _loadDownloads();
    }
  }


  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF006400);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Downloaded Books'),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryColor))
          : _downloads.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.download_for_offline_outlined, size: 64, color: Colors.grey.shade400),
                      const SizedBox(height: 12),
                      Text(
                        'No downloaded books',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Download books from your library for offline reading.',
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _downloads.length,
                  itemBuilder: (context, index) {
                    final book = _downloads[index];
                    final title = book['title'] ?? 'Untitled';
                    final author = book['author_name'] ?? 'Unknown Author';
                    final path = book['local_pdf_path'] ?? '';
                    final bookId = book['id'] is int ? book['id'] : int.parse(book['id'].toString());

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        leading: Container(
                          width: 44,
                          height: 56,
                          decoration: BoxDecoration(
                            color: primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(Icons.picture_as_pdf, color: primaryColor),
                        ),
                        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(author),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _deleteDownload(bookId, title),
                            ),
                            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                          ],
                        ),
                        onTap: () {
                          if (path.isNotEmpty) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ReaderScreen(
                                  bookId: bookId.toString(),
                                  bookTitle: title,
                                  localPath: path,
                                ),
                              ),
                            );
                          }

                        },
                      ),
                    );
                  },
                ),
    );
  }
}
