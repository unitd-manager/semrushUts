import MarketingNav from "@/components/marketing/MarketingNav";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { marketingMenus } from "@/lib/marketing";
export default function Enterprise() { return <><MarketingNav {...marketingMenus}/><MarketingPage kind="enterprise"/></>; }
