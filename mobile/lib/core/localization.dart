import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;
  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'title': 'GETSE',
      'subtitle': 'Ethiopian Digital Library',
      'welcome_back': 'Welcome Back',
      'create_account': 'Create Account',
      'signin_prompt': 'Sign in to your GETSE account',
      'join_prompt': 'Join thousands of Ethiopian readers & authors',
      'username': 'Username',
      'email': 'Email',
      'password': 'Password',
      'role_prompt': 'I am a...',
      'reader': 'Reader',
      'author': 'Author',
      'login': 'LOGIN',
      'register': 'REGISTER',
      'has_account': 'Already have an account? Login',
      'no_account': "Don't have an account? Register",
      'username_required': 'Username required',
      'email_required': 'Email required',
      'password_length': 'Min 6 characters',
      'api_config': 'API Configuration',
      'server_settings': 'Server Settings',
      'my_library': 'My Library',
      'my_books': 'My Books',
      'recommended': 'Recommended',
      'library_empty': 'Your library is empty.',
      'library_empty_desc': 'Purchase books to add them here.',
      'no_recommendations': 'No recommendations yet.',
      'no_recommendations_desc': 'Purchase more books to get personalized suggestions!',
      'read_offline': 'Read Offline',
      'download': 'Download',
      'offline_mode': 'Offline mode: Showing downloaded books only.',
      'cancel': 'Cancel',
      'save': 'Save',
      'reset_default': 'Reset to Default',
      'base_url': 'Base URL',
      'server_url_reset': 'Server URL reset to platform default.',
      'server_url_updated': 'Server URL updated:',
      'url_start_error': 'URL must start with http:// or https://',
      'server_url_prompt': 'Enter the backend API server base URL:',
      'server_url_note': 'Note: If using a physical Android device, use your host machine\'s IP (e.g. http://192.168.x.x:5000/api).',
    },
    'am': {
      'title': 'ግጥሴ',
      'subtitle': 'የኢትዮጵያ ዲጂታል ቤተ-መጻሕፍት',
      'welcome_back': 'እንኳን ደህና መጡ',
      'create_account': 'አዲስ መለያ ፍጠር',
      'signin_prompt': 'ወደ ግጥሴ መለያዎ ይግቡ',
      'join_prompt': 'ሺዎችን የሚቆጠሩ ኢትዮጵያውያን አንባቢዎችን እና ደራሲዎችን ይቀላቀሉ',
      'username': 'የተጠቃሚ ስም',
      'email': 'ኢሜይል',
      'password': 'የይለፍ ቃል',
      'role_prompt': 'እኔ...',
      'reader': 'አንባቢ ነኝ',
      'author': 'ደራሲ ነኝ',
      'login': 'ግባ',
      'register': 'ተመዝገብ',
      'has_account': 'ቀድሞውኑ መለያ አለዎት? ይግቡ',
      'no_account': 'መለያ የለዎትም? ይመዝገቡ',
      'username_required': 'የተጠቃሚ ስም ያስፈልጋል',
      'email_required': 'ኢሜይል ያስፈልጋል',
      'password_length': 'ቢያንስ 6 ቁምፊዎች',
      'api_config': 'የኤፒአይ ቅንጅት',
      'server_settings': 'የአገልጋይ ቅንብሮች',
      'my_library': 'የእኔ ቤተ-መጽሐፍት',
      'my_books': 'የእኔ መጻሕፍት',
      'recommended': 'የሚመከሩ',
      'library_empty': 'ቤተ-መጽሐፍትዎ ባዶ ነው።',
      'library_empty_desc': 'ለመጀመር መጻሕፍትን ይግዙ።',
      'no_recommendations': 'ምንም ምክሮች የሉም።',
      'no_recommendations_desc': 'የግል ምክሮችን ለማግኘት ተጨማሪ መጻሕፍትን ይግዙ!',
      'read_offline': 'ከመስመር ውጭ አንብብ',
      'download': 'አውርድ',
      'offline_mode': 'ከመስመር ውጭ ሁነታ፡ የወረዱ መጻሕፍት ብቻ ይታያሉ',
      'cancel': 'ሰርዝ',
      'save': 'አስቀምጥ',
      'reset_default': 'ወደ ነባሪ መልስ',
      'base_url': 'የአገልጋይ ዩአርኤል',
      'server_url_reset': 'የአገልጋይ ዩአርኤል ወደ መድረክ ነባሪ ተመልሷል።',
      'server_url_updated': 'የአገልጋይ ዩአርኤል ተዘምኗል፡',
      'url_start_error': 'ዩአርኤል በ http:// ወይም https:// መጀመር አለበት',
      'server_url_prompt': 'የጀርባ ኤፒአይ አገልጋይ ዋና ዩአርኤልን ያስገቡ፡',
      'server_url_note': 'ማስታወሻ፡ እውነተኛ አንድሮይድ ስልክ የሚጠቀሙ ከሆነ የኮምፒተርዎን አይፒ ይጠቀሙ (ለምሳሌ http://192.168.x.x:5000/api)።',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? _localizedValues['en']?[key] ?? key;
  }
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'am'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(AppLocalizations(locale));
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
