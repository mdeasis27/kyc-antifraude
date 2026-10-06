export type Locale = 'en' | 'es';
export function isLocale(value: string): value is Locale { return value === 'en' || value === 'es'; }
export function localizedPath(path: string, locale: Locale): string {
  const stripped = path.replace(/^\/(en|es)(?=\/|\?|#|$)/, '');
  return `/${locale}${stripped === '/' ? '' : stripped.startsWith('/') || stripped.startsWith('?') || stripped.startsWith('#') ? stripped : `/${stripped}`}`;
}
