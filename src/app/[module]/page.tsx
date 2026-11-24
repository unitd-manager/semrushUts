"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Providers } from "@/components/Providers";

const WorkspaceApp = dynamic(() => import("@/components/App"), { ssr: false, loading: () => <div className="loading-screen"><span className="brand-mark">✳</span><span>Loading your workspace…</span></div> });
export default function ModuleRoute() { const params = useParams<{ module: string }>(); return <Providers><WorkspaceApp active={params.module} /></Providers>; }
