import MarketingNav from "@/components/marketing/MarketingNav";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { marketingMenus } from "@/lib/marketing";
export default async function FreeTool({ params }: { params: Promise<{slug:string}> }) { const {slug}=await params; return <><MarketingNav {...marketingMenus}/><MarketingPage kind="free-tools" slug={slug}/></>; }
