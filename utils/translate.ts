// Language name → Google Translate language code mapping
// Covers all languages from countryLanguages.ts
// Dialects that don't have a separate Google Translate code fall back to the parent language
export const languageToCode: Record<string, string> = {
  // Major world languages
  'English': 'en',
  'American English': 'en',
  'Australian English': 'en',
  'Spanish': 'es',
  'Spanish (Castilian)': 'es',
  'Rioplatense Spanish': 'es',
  'Mexican Spanish': 'es',
  'French': 'fr',
  'Quebec French': 'fr',
  'Mandarin': 'zh-CN',
  'Chinese (Mandarin/Cantonese)': 'zh-CN',
  'Hindi': 'hi',
  'Arabic': 'ar',
  'Egyptian Arabic': 'ar',
  'Mesopotamian Arabic': 'ar',
  'Hejazi Arabic': 'ar',
  'Najdi Arabic': 'ar',
  'Gulf Arabic': 'ar',
  'Saidi Arabic': 'ar',
  'Darja (Algerian Arabic)': 'ar',
  'Russian': 'ru',
  'Portuguese': 'pt',
  'Brazilian Portuguese': 'pt',
  'Bengali': 'bn',
  'Urdu': 'ur',
  'Indonesian': 'id',
  'German': 'de',
  'High German': 'de',
  'Low German': 'de',
  'Austrian German': 'de',
  'Japanese': 'ja',

  // Indian languages
  'Marathi': 'mr',
  'Telugu': 'te',
  'Tamil': 'ta',
  'Gujarati': 'gu',
  'Kannada': 'kn',
  'Odia': 'or',
  'Malayalam': 'ml',
  'Punjabi': 'pa',
  'Assamese': 'as',
  'Maithili': 'hi',    // closest supported
  'Santhali': 'hi',    // closest supported
  'Santali': 'hi',     // closest supported
  'Kashmiri': 'hi',    // closest supported
  'Nepali': 'ne',
  'Konkani': 'hi',     // closest supported
  'Sindhi': 'sd',
  'Dogri': 'hi',       // closest supported
  'Manipuri': 'hi',    // closest supported
  'Bodo': 'hi',        // closest supported
  'Awadhi': 'hi',      // closest supported
  'Marwari': 'hi',     // closest supported
  'Bhojpuri': 'hi',    // closest supported
  'Chittagonian': 'bn', // closest supported
  'Sylheti': 'bn',     // closest supported
  'Saraiki': 'ur',     // closest supported
  'Hindko': 'ur',      // closest supported

  // European languages
  'Italian': 'it',
  'Neapolitan': 'it',
  'Sicilian': 'it',
  'Venetian': 'it',
  'Lombard': 'it',
  'Piedmontese': 'it',
  'Sardinian': 'it',
  'Dutch': 'nl',
  'Flemish': 'nl',
  'Turkish': 'tr',
  'Polish': 'pl',
  'Ukrainian': 'uk',
  'Greek': 'el',
  'Swedish': 'sv',
  'Romanian': 'ro',
  'Czech': 'cs',
  'Hungarian': 'hu',
  'Danish': 'da',
  'Finnish': 'fi',
  'Norwegian': 'no',
  'Serbian': 'sr',
  'Albanian': 'sq',
  'Macedonian': 'mk',
  'Catalan': 'ca',
  'Valencian': 'ca',
  'Galician': 'gl',
  'Basque': 'eu',
  'Welsh': 'cy',
  'Irish': 'ga',
  'Scottish Gaelic': 'gd',
  'Cornish': 'en',     // no code, fallback
  'Scots': 'en',       // no code, fallback
  'Occitan': 'fr',     // closest supported
  'Breton': 'fr',      // closest supported
  'Corsican': 'co',
  'Alsatian': 'de',    // closest supported
  'Bavarian': 'de',
  'Swabian': 'de',
  'Alemannic': 'de',
  'Austro-Bavarian': 'de',
  'Walloon': 'fr',     // closest supported
  'Andalusian (Dialect)': 'es',

  // Asian languages
  'Korean': 'ko',
  'Seoul Dialect': 'ko',
  'Gyeongsang Dialect': 'ko',
  'Jeolla Dialect': 'ko',
  'Jeju': 'ko',
  'Vietnamese': 'vi',
  'Northern Dialect': 'vi',
  'Central Dialect': 'vi',
  'Southern Dialect': 'vi',
  'Thai': 'th',
  'Khmer': 'km',
  'Burmese': 'my',
  'Lao': 'lo',
  'Cantonese': 'zh-TW',
  'Cantonese (Yue)': 'zh-TW',
  'Shanghainese (Wu)': 'zh-CN',
  'Wu': 'zh-CN',
  'Hakka': 'zh-CN',
  'Min Nan': 'zh-CN',
  'Xiang': 'zh-CN',
  'Gan': 'zh-CN',
  'Jin': 'zh-CN',
  'Tibetan': 'zh-CN',  // closest supported
  'Uyghur': 'zh-CN',   // closest supported
  'Kansai-ben (Dialect)': 'ja',
  'Tohoku-ben (Dialect)': 'ja',
  'Okinawan': 'ja',
  'Ainu': 'ja',         // closest supported
  'Javanese': 'jw',
  'Sundanese': 'su',
  'Madurese': 'id',     // closest supported
  'Minangkabau': 'id',  // closest supported
  'Buginese': 'id',     // closest supported
  'Balinese': 'id',     // closest supported
  'Malay': 'ms',
  'Filipino (Tagalog)': 'tl',
  'Tagalog': 'tl',
  'Cebuano': 'ceb',
  'Ilocano': 'tl',      // closest supported
  'Hiligaynon': 'tl',   // closest supported
  'Bicolano': 'tl',     // closest supported
  'Waray': 'tl',        // closest supported
  'Kapampangan': 'tl',  // closest supported
  'Pangasinan': 'tl',   // closest supported
  'Hmong': 'hmn',
  'Tay': 'vi',          // closest supported
  'Muong': 'vi',        // closest supported

  // Middle Eastern / Central Asian
  'Persian (Farsi)': 'fa',
  'Dari': 'fa',
  'Kurdish': 'ku',
  'Kurdish (Kurmanji)': 'ku',
  'Kurmanji': 'ku',
  'Sorani': 'ku',
  'Azerbaijani': 'az',
  'Uzbek': 'uz',
  'Turkmen': 'tk',
  'Pashto': 'ps',
  'Balochi': 'ur',      // closest supported
  'Brahui': 'ur',       // closest supported
  'Luri': 'fa',         // closest supported
  'Gilaki': 'fa',       // closest supported
  'Mazandarani': 'fa',  // closest supported
  'Zaza': 'tr',         // closest supported
  'Circassian': 'tr',   // closest supported
  'Armenian': 'hy',
  'Eastern Armenian': 'hy',
  'Assyrian Neo-Aramaic': 'ar', // closest supported
  'Hebrew': 'he',

  // African languages
  'Swahili': 'sw',
  'Afrikaans': 'af',
  'Zulu': 'zu',
  'Xhosa': 'xh',
  'Amharic': 'am',
  'Somali': 'so',
  'Hausa': 'ha',
  'Yoruba': 'yo',
  'Igbo': 'ig',
  'Kikuyu': 'sw',      // closest supported
  'Luhya': 'sw',       // closest supported
  'Kalenjin': 'sw',    // closest supported
  'Luo': 'sw',         // closest supported
  'Kamba': 'sw',       // closest supported
  'Oromo': 'om',
  'Pedi': 'af',        // closest supported
  'Tswana': 'af',      // closest supported
  'Sotho': 'st',
  'Tsonga': 'af',      // closest supported
  'Swati': 'af',       // closest supported
  'Venda': 'af',       // closest supported
  'Ndebele': 'af',     // closest supported
  'Nigerian Pidgin': 'en',
  'Fulfulde': 'ha',    // closest supported
  'Kanuri': 'ha',      // closest supported
  'Ibibio': 'ig',      // closest supported
  'Tiv': 'ig',         // closest supported
  'Domari': 'ar',      // closest supported
  'Nubian': 'ar',      // closest supported

  // South American indigenous
  'Guarani': 'es',     // closest supported
  'Quechua': 'qu',
  'Aymara': 'ay',
  'Nahuatl': 'es',     // closest supported
  'Maya': 'es',        // closest supported
  'Zapotec': 'es',     // closest supported
  'Mixtec': 'es',      // closest supported
  'Otomi': 'es',       // closest supported
  'Totonac': 'es',     // closest supported
  'Tupi': 'pt',        // closest supported
  'Wayuu': 'es',       // closest supported
  'Paez': 'es',        // closest supported
  'Qom': 'es',         // closest supported
  'Wichi': 'es',       // closest supported

  // Other / Dialects (map to parent)
  'Gheg (Dialect)': 'sq',
  'Tosk (Dialect)': 'sq',
  'Tamazight': 'fr',   // closest supported
  'Kabyle': 'fr',      // closest supported
  'Pashayi': 'ps',     // closest supported
  'Nuristani': 'ps',   // closest supported
  'Paisa (Dialect)': 'es',
  'Costeño (Dialect)': 'es',
  'Chakma': 'bn',      // closest supported
  'Garo': 'bn',        // closest supported
  'Khasi': 'bn',       // closest supported

  // Russian minority languages
  'Tatar': 'tt',
  'Chechen': 'ru',     // closest supported
  'Bashkir': 'ru',     // closest supported
  'Chuvash': 'ru',     // closest supported
  'Avar': 'ru',        // closest supported

  // Canadian indigenous
  'Inuktitut': 'en',   // closest supported
  'Cree': 'en',        // closest supported
  'Ojibwe': 'en',      // closest supported
};

// Translate text using Google Translate free API
export async function translateText(
  text: string,
  targetLanguageName: string,
  sourceLanguageName: string = 'English'
): Promise<string> {
  try {
    const targetCode = languageToCode[targetLanguageName] || 'en';
    const sourceCode = sourceLanguageName === 'auto'
      ? 'auto'
      : (languageToCode[sourceLanguageName] || 'en');

    // Skip if same language
    if (targetCode === sourceCode && sourceCode !== 'auto') {
      return text;
    }

    // No local limits applied — Google Translate API handles the full string length directly.
    return await translateSingleChunk(text, sourceCode, targetCode);
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

async function translateSingleChunk(
  text: string,
  sourceCode: string,
  targetCode: string
): Promise<string> {
  // Use Google Translate API (Unlimited free usage for native apps)
  try {
    const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(fallbackUrl);
    const gData = await res.json();
    let translatedText = '';
    if (gData && gData[0]) {
      gData[0].forEach((item: any) => {
        if (item[0]) translatedText += item[0];
      });
    }
    return translatedText || text;
  } catch {
    return text;
  }
}
