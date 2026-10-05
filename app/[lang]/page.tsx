import Link from 'next/link';
import {notFound} from 'next/navigation';
import {copy as en} from '@/lib/experience/copy.en';
import {copy as es} from '@/lib/experience/copy.es';

export default async function Page({params}:{params:Promise<{lang:string}>}) {
 const {lang}=await params;
 if(lang!=='en'&&lang!=='es')notFound();
 const copy=lang==='es'?es:en;
 return <main className="mx-auto max-w-4xl px-6 py-24">
  <p className="text-sm text-muted-foreground">{lang==='es'?'Portafolio AI Product':'AI Product portfolio'}</p>
  <h1 className="mt-3 text-5xl font-bold">{copy.title}</h1>
  <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{copy.briefing}</p>
  <Link className="mt-8 inline-block rounded-lg bg-accent px-5 py-3 font-semibold text-white" href={'/'+lang+'/app'}>
   {lang==='es'?'Probar la demo interactiva':'Try the interactive demo'}
  </Link>
 </main>;
}
