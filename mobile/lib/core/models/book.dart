class Book {
  final String id;
  final String title;
  final String author;
  final String description;
  final String coverImageUrl;
  final String bookUrl; // URL to download the PDF
  final bool isDownloaded;
  final String? localPath; // Path where the PDF is stored locally

  Book({
    required this.id,
    required this.title,
    required this.author,
    required this.description,
    required this.coverImageUrl,
    required this.bookUrl,
    this.isDownloaded = false,
    this.localPath,
  });

  Book copyWith({
    String? id,
    String? title,
    String? author,
    String? description,
    String? coverImageUrl,
    String? bookUrl,
    bool? isDownloaded,
    String? localPath,
  }) {
    return Book(
      id: id ?? this.id,
      title: title ?? this.title,
      author: author ?? this.author,
      description: description ?? this.description,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      bookUrl: bookUrl ?? this.bookUrl,
      isDownloaded: isDownloaded ?? this.isDownloaded,
      localPath: localPath ?? this.localPath,
    );
  }
}
