import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import "./keyword-groups.css";
import "./marketing.css";
import "./ai-agents.css";
import "./seo-task-management.css";

export const metadata: Metadata = { title: "Searchlight — SEO intelligence for focused teams", description: "Research your market, find technical issues, track observations, and turn what you learn into work your team can ship." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
