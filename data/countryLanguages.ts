export const countryLanguages: Record<string, string[]> = {
  'Afghanistan': ['Pashto', 'Dari', 'Uzbek', 'Turkmen', 'Balochi', 'Pashayi', 'Nuristani'],
  'Albania': ['Albanian', 'Gheg (Dialect)', 'Tosk (Dialect)', 'Greek', 'Macedonian'],
  'Algeria': ['Arabic', 'Darja (Algerian Arabic)', 'Tamazight', 'Kabyle', 'French'],
  'Argentina': ['Spanish', 'Rioplatense Spanish', 'Guarani', 'Quechua', 'Qom', 'Wichi'],
  'Armenia': ['Armenian', 'Eastern Armenian', 'Russian', 'Kurdish'],
  'Australia': ['English', 'Australian English', 'Mandarin', 'Arabic', 'Cantonese', 'Vietnamese', 'Italian', 'Greek'],
  'Austria': ['German', 'Austrian German', 'Alemannic', 'Austro-Bavarian', 'Turkish', 'Serbian'],
  'Bangladesh': ['Bengali', 'Chittagonian', 'Sylheti', 'Chakma', 'Garo', 'Khasi', 'Santali', 'English'],
  'Belgium': ['Dutch', 'Flemish', 'French', 'Walloon', 'German'],
  'Brazil': ['Portuguese', 'Brazilian Portuguese', 'Spanish', 'German', 'Italian', 'Tupi', 'Guarani'],
  'Canada': ['English', 'French', 'Quebec French', 'Inuktitut', 'Cree', 'Ojibwe', 'Punjabi', 'Mandarin'],
  'China': ['Mandarin', 'Cantonese (Yue)', 'Shanghainese (Wu)', 'Hakka', 'Min Nan', 'Xiang', 'Gan', 'Jin', 'Tibetan', 'Uyghur'],
  'Colombia': ['Spanish', 'Paisa (Dialect)', 'Costeño (Dialect)', 'Wayuu', 'Paez'],
  'Egypt': ['Arabic', 'Egyptian Arabic', 'Saidi Arabic', 'Domari', 'Nubian'],
  'France': ['French', 'Occitan', 'Breton', 'Corsican', 'Alsatian', 'Basque', 'Catalan'],
  'Germany': ['German', 'High German', 'Low German', 'Bavarian', 'Swabian', 'Turkish', 'Kurdish', 'Polish'],
  'India': ['Hindi', 'English', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Urdu', 'Bhojpuri', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili', 'Santhali', 'Kashmiri', 'Nepali', 'Konkani', 'Sindhi', 'Dogri', 'Manipuri', 'Bodo', 'Awadhi', 'Marwari'],
  'Indonesia': ['Indonesian', 'Javanese', 'Sundanese', 'Madurese', 'Minangkabau', 'Buginese', 'Balinese'],
  'Iran': ['Persian (Farsi)', 'Azerbaijani', 'Kurdish', 'Luri', 'Gilaki', 'Mazandarani', 'Arabic', 'Balochi'],
  'Iraq': ['Arabic', 'Mesopotamian Arabic', 'Kurdish', 'Sorani', 'Kurmanji', 'Turkmen', 'Assyrian Neo-Aramaic'],
  'Italy': ['Italian', 'Neapolitan', 'Sicilian', 'Venetian', 'Lombard', 'Piedmontese', 'Sardinian'],
  'Japan': ['Japanese', 'Kansai-ben (Dialect)', 'Tohoku-ben (Dialect)', 'Okinawan', 'Ainu'],
  'Kenya': ['Swahili', 'English', 'Kikuyu', 'Luhya', 'Kalenjin', 'Luo', 'Kamba', 'Somali'],
  'Mexico': ['Spanish', 'Mexican Spanish', 'Nahuatl', 'Maya', 'Zapotec', 'Mixtec', 'Otomi', 'Totonac'],
  'Nigeria': ['English', 'Nigerian Pidgin', 'Hausa', 'Yoruba', 'Igbo', 'Fulfulde', 'Kanuri', 'Ibibio', 'Tiv'],
  'Pakistan': ['Urdu', 'English', 'Punjabi', 'Pashto', 'Sindhi', 'Saraiki', 'Balochi', 'Hindko', 'Brahui'],
  'Philippines': ['Filipino (Tagalog)', 'English', 'Cebuano', 'Ilocano', 'Hiligaynon', 'Bicolano', 'Waray', 'Kapampangan', 'Pangasinan'],
  'Russia': ['Russian', 'Tatar', 'Chechen', 'Bashkir', 'Ukrainian', 'Chuvash', 'Avar'],
  'Saudi Arabia': ['Arabic', 'Hejazi Arabic', 'Najdi Arabic', 'Gulf Arabic'],
  'South Africa': ['Zulu', 'Xhosa', 'Afrikaans', 'English', 'Pedi', 'Tswana', 'Sotho', 'Tsonga', 'Swati', 'Venda', 'Ndebele'],
  'South Korea': ['Korean', 'Seoul Dialect', 'Gyeongsang Dialect', 'Jeolla Dialect', 'Jeju'],
  'Spain': ['Spanish (Castilian)', 'Catalan', 'Galician', 'Basque', 'Andalusian (Dialect)', 'Valencian'],
  'Turkey': ['Turkish', 'Kurdish (Kurmanji)', 'Zaza', 'Arabic', 'Azerbaijani', 'Circassian'],
  'United Kingdom': ['English', 'Scots', 'Welsh', 'Irish', 'Scottish Gaelic', 'Cornish'],
  'United States': ['English', 'American English', 'Spanish', 'Chinese (Mandarin/Cantonese)', 'Tagalog', 'Vietnamese', 'Arabic', 'French', 'Korean', 'Russian'],
  'Vietnam': ['Vietnamese', 'Northern Dialect', 'Central Dialect', 'Southern Dialect', 'Tay', 'Thai', 'Muong', 'Khmer', 'Hmong'],
  // Add fallback regions for massive continent sweeps
  'Africa': ['Swahili', 'Arabic', 'French', 'English', 'Hausa', 'Yoruba', 'Igbo', 'Amharic', 'Oromo', 'Somali', 'Zulu'],
  'Europe': ['English', 'German', 'French', 'Spanish', 'Italian', 'Russian', 'Polish', 'Ukrainian', 'Dutch'],
  'Asia': ['Mandarin', 'Hindi', 'Arabic', 'Bengali', 'Russian', 'Japanese', 'Punjabi', 'Javanese', 'Telugu', 'Wu', 'Turkish'],
  'South America': ['Spanish', 'Portuguese', 'Guarani', 'Quechua', 'Aymara'],
};

export const defaultLanguages = ['English', 'Spanish', 'French', 'Mandarin', 'Hindi', 'Arabic', 'Russian', 'Portuguese', 'Bengali', 'Urdu', 'Indonesian', 'German', 'Japanese'];

export const getLanguagesForCountry = (countryName: string): string[] => {
  if (!countryName) return defaultLanguages;
  
  // Extract country name by removing emojis/flags and trimming
  const cleanName = countryName.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
  
  if (countryLanguages[cleanName]) {
    return countryLanguages[cleanName];
  }
  return defaultLanguages;
};
