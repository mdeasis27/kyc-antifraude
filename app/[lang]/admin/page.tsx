import { notFound } from "next/navigation";
import AdminPage from "@/app/admin/page";
export default async function LocalizedAdmin({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(lang!=="en"&&lang!=="es")notFound();return <AdminPage lang={lang}/>}
