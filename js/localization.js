const supportedLanguages = [
  ['ar', 'العربية', true], ['en', 'English', false], ['fr', 'Français', false], ['es', 'Español', false], ['de', 'Deutsch', false], ['it', 'Italiano', false], ['pt', 'Português', false], ['tr', 'Türkçe', false], ['ru', 'Русский', false], ['zh-CN', '简体中文', false], ['zh-TW', '繁體中文', false], ['ja', '日本語', false], ['ko', '한국어', false], ['hi', 'हिन्दी', false], ['bn', 'বাংলা', false], ['ur', 'اردو', true], ['fa', 'فارسی', true], ['id', 'Bahasa Indonesia', false], ['ms', 'Melayu', false], ['th', 'ไทย', false], ['vi', 'Tiếng Việt', false], ['nl', 'Nederlands', false], ['pl', 'Polski', false], ['uk', 'Українська', false], ['ro', 'Română', false], ['el', 'Ελληνικά', false], ['cs', 'Čeština', false], ['sv', 'Svenska', false], ['da', 'Dansk', false], ['no', 'Norsk', false], ['fi', 'Suomi', false], ['hu', 'Magyar', false], ['he', 'עברית', true], ['auto', 'Auto detect', false], ['fil', 'Filipino', false]
];

const localeCache = new Map();
const valueFor = (object, path) => path.split('.').reduce((value, key) => value && value[key], object);
const isRtl = (language) => supportedLanguages.find(([code]) => code === language)?.[2] ?? false;

async function loadLocale(language) {
  if (localeCache.has(language)) return localeCache.get(language);
  const response = await fetch(`locales/${language}.json`);
  if (!response.ok) throw new Error(`Locale ${language} is unavailable.`);
  const dictionary = await response.json();
  localeCache.set(language, dictionary);
  return dictionary;
}

function translatePage(dictionary) {
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const value = valueFor(dictionary, node.dataset.i18n);
    if (value) node.innerHTML = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const value = valueFor(dictionary, node.dataset.i18nPlaceholder);
    if (value) node.placeholder = value;
  });
}

async function setLanguage(language) {
  let dictionary;
  try { dictionary = await loadLocale(language); } catch { dictionary = await loadLocale('en'); }
  document.documentElement.lang = language;
  document.documentElement.dir = isRtl(language) ? 'rtl' : 'ltr';
  document.querySelector('#language-toggle').value = language;
  translatePage(dictionary);
  localStorage.setItem('finovate-language', language);
}

function populateLanguageSelector() {
  const selector = document.querySelector('#language-toggle');
  supportedLanguages.forEach(([code, label]) => selector.add(new Option(label, code)));
}
