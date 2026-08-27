import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/library_provider.dart';
import '../../../core/models/book.dart';
import '../../../core/localization.dart';
import '../../reader/screens/reader_screen.dart';
import 'search_screen.dart';
import 'catalog_screen.dart';
import '../../profile/screens/profile_screen.dart';



class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    // Fetch on startup
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LibraryProvider>(context, listen: false).fetchLibrary();
      Provider.of<LibraryProvider>(context, listen: false).fetchRecommendations();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context);

    return Scaffold(

      appBar: AppBar(
        title: Text(loc?.translate('my_library') ?? 'My Library'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            tooltip: 'Search Books',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.storefront),
            tooltip: 'Browse Catalog',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CatalogScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: 'Profile & Settings',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: loc?.translate('my_books') ?? 'My Books'),
            Tab(text: loc?.translate('recommended') ?? 'Recommended'),
          ],
        ),
      ),

      body: TabBarView(
        controller: _tabController,
        children: [
          _MyBooksTab(),
          _RecommendationsTab(),
        ],
      ),
    );
  }
}

class _MyBooksTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context);
    return Consumer<LibraryProvider>(
      builder: (context, library, child) {
        if (library.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (library.library.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.library_books_outlined, size: 80, color: Colors.grey),
                const SizedBox(height: 16),
                Text(loc?.translate('library_empty') ?? 'Your library is empty.', style: const TextStyle(color: Colors.grey)),
                const SizedBox(height: 8),
                Text(loc?.translate('library_empty_desc') ?? 'Purchase books to add them here.', style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          );
        }
        return Column(
          children: [
            if (library.error != null)
              Container(
                color: Colors.amber[100],
                padding: const EdgeInsets.all(8),
                child: Row(children: [
                  const Icon(Icons.wifi_off, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(library.error!, style: const TextStyle(fontSize: 12))),
                ]),
              ),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.6,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: library.library.length,
                itemBuilder: (ctx, i) => _BookCard(book: library.library[i]),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _BookCard extends StatelessWidget {
  final Book book;
  const _BookCard({required this.book});

  @override
  Widget build(BuildContext context) {
    final library = Provider.of<LibraryProvider>(context);
    final progress = library.downloadProgress[int.tryParse(book.id) ?? -1];
    final loc = AppLocalizations.of(context);

    return GestureDetector(
      onTap: () {
        if (book.isDownloaded && book.localPath != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ReaderScreen(
                bookId: book.id,
                bookTitle: book.title,
                localPath: book.localPath!,
              ),
            ),
          );
        }
      },
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: book.coverImageUrl.startsWith('http')
                    ? Image.network(book.coverImageUrl, fit: BoxFit.cover,
                        errorBuilder: (_, e, s) => Container(
                          color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                          child: const Icon(Icons.book, size: 60, color: Colors.grey),
                        ))
                    : Container(
                        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                        child: const Icon(Icons.book, size: 60, color: Colors.grey),
                      ),
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(book.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 2),
                    Text(book.author,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                    const Spacer(),
                    if (progress != null)
                      LinearProgressIndicator(value: progress)
                    else if (book.isDownloaded)
                      Row(
                        children: [
                          Icon(Icons.check_circle, size: 14, color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 4),
                          Text(loc?.translate('read_offline') ?? 'Read Offline', style: const TextStyle(fontSize: 10, color: Colors.green)),
                        ],
                      )
                    else
                      GestureDetector(
                        onTap: () => library.downloadBook(book),
                        child: Row(
                          children: [
                            Icon(Icons.download, size: 14, color: Theme.of(context).colorScheme.primary),
                            const SizedBox(width: 4),
                            Text(loc?.translate('download') ?? 'Download', style: const TextStyle(fontSize: 10)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecommendationsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context);
    return Consumer<LibraryProvider>(
      builder: (context, library, child) {
        if (library.recommendations.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.auto_awesome, size: 80, color: Colors.grey),
                const SizedBox(height: 16),
                Text(loc?.translate('no_recommendations') ?? 'No recommendations yet.', style: const TextStyle(color: Colors.grey)),
                const SizedBox(height: 8),
                Text(loc?.translate('no_recommendations_desc') ?? 'Purchase more books to get personalized suggestions!',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: library.recommendations.length,
          itemBuilder: (ctx, i) {
            final book = library.recommendations[i];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: Container(
                  width: 48, height: 64,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(Icons.book, color: Colors.grey),
                ),
                title: Text(book.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(book.author),
                trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              ),
            );
          },
        );
      },
    );
  }
}
