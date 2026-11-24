import { describe, expect, it } from "vitest";
import { joinOrganicTrafficReports, normalizePagePath, propertyMatchesDomain } from "./organic-traffic-insights";

describe("organic traffic insight joins", () => {
  it("joins GSC page metrics and GA4 landing metrics by path", () => {
    const rows = joinOrganicTrafficReports(
      { rows: [{ keys: ["https://www.example.com/guides/seo?ref=search"], clicks: 12, impressions: 300, ctr: 0.04, position: 4.5 }] },
      { dimensionHeaders: [{ name: "landingPage" }], metricHeaders: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "conversions" }], rows: [{ dimensionValues: [{ value: "/guides/seo" }], metricValues: [{ value: "45" }, { value: "30" }, { value: "2" }] }] },
    );
    expect(rows).toEqual([{ path: "/guides/seo", clicks: 12, impressions: 300, ctr: 0.04, position: 4.5, sessions: 45, engagedSessions: 30, conversions: 2 }]);
  });

  it("normalizes project URLs and only matches explicitly selected Search Console properties", () => {
    expect(normalizePagePath("https://example.com/page?x=1")).toBe("/page");
    expect(propertyMatchesDomain("sc-domain:example.com", "www.example.com")).toBe(true);
    expect(propertyMatchesDomain("https://other.example/", "example.com")).toBe(false);
  });
});
