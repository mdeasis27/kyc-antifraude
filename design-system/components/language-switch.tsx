"use client";
import {usePathname} from 'next/navigation';
import {localizedPath, type Locale} from '../i18n/locale';
export function LanguageSwitch({locale}: {locale:Locale}) {
 const pathname=usePathname();
 return <nav aria-label={locale==='en'?'Language':'Idioma'} className="flex gap-1 font-mono text-xs">{(['en','es'] as const).map(lang=><a key={lang} href={localizedPath(pathname,lang)} hrefLang={lang} aria-current={locale===lang?'page':undefined} onClick={e=>{e.preventDefault(); window.location.assign(localizedPath(window.location.pathname+window.location.search+window.location.hash,lang));}} className={`rounded-md border px-2 py-1.5 ${locale===lang?'border-foreground/40 bg-foreground/10':'border-transparent'}`}>{lang.toUpperCase()}</a>)}</nav>;
}
