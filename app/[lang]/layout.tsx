"use client";
import { useEffect, type ReactNode } from "react";
export default function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) { useEffect(() => { void params.then(({ lang }) => { document.documentElement.lang = lang; }); }, [params]); return children; }
