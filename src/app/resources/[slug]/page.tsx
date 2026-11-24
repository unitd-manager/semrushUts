import MarketingNav from "@/components/marketing/MarketingNav";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { marketingMenus } from "@/lib/marketing";
export default async function Resource({ params }: { params: Promise<{slug:string}> }) { const {slug}=await params; return <><MarketingNav {...marketingMenus}/><MarketingPage kind="resources" slug={slug}/></>; }
