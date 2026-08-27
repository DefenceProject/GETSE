import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'core/localization.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/library/providers/library_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/profile/providers/notification_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => LibraryProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: const GetseMobileApp(),
    ),
  );
}


class GetseMobileApp extends StatelessWidget {
  const GetseMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return MaterialApp(
      title: 'GETSE',
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
      debugShowCheckedModeBanner: false,
      locale: auth.locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', ''),  // English
        Locale('am', ''),  // Amharic
      ],
    );
  }
}
