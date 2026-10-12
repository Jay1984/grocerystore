"use client";

import { useState, useEffect, useCallback } from "react";

interface RetailerStat {
  retailer: string;
  products: number;
  fileSize: number;
  lastModified: string | null;
}

interface Stats {
  retailers: RetailerStat[];
  summary: { scrapedAt?: string; retailers?: { retailer: string; lastScrapedAt?: string }[] } | null;
}

type ScrapeStatus = "idle" | "running" | "done" | "error";

const RETAILER_META: Record<string, { name: string; color: string; bg: string; canScrape: boolean }> = {
  aladil: { name: "Al Adil", color: "text-orange-700", bg: "bg-orange-50", canScrape: true },
  hypermax: { name: "HyperMax", color: "text-blue-700", bg: "bg-blue-50", canScrape: true },
  lulu: { name: "LuLu", color: "text-green-700", bg: "bg-green-50", canScrape: false },
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<Record<string, ScrapeStatus>>({});
  const [scrapeResult, setScrapeResult] = useState<Record<string, string>>({});
  const [luluJson, setLuluJson] = useState("");
  const [importStatus, setImportStatus] = useState<ScrapeStatus>("idle");
  const [importResult, setImportResult] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin-pw");
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  const login = useCallback(async () => {
    setAuthError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem("admin-pw", password);
      setAuthed(true);
    } else {
      setAuthError("Invalid password");
    }
  }, [password]);

  const loadStats = useCallback(async () => {
    const pw = sessionStorage.getItem("admin-pw") || password;
    const res = await fetch("/api/admin/stats", { headers: { "x-admin-password": pw } });
    if (res.ok) setStats(await res.json());
  }, [password]);

  useEffect(() => {
    if (authed) loadStats();
  }, [authed, loadStats]);

  const runScrape = useCallback(async (retailer: string) => {
    const pw = sessionStorage.getItem("admin-pw") || password;
    setScrapeStatus((s) => ({ ...s, [retailer]: "running" }));
    setScrapeResult((s) => ({ ...s, [retailer]: "" }));
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ retailer }),
      });
      const data = await res.json();
      if (res.ok) {
        setScrapeStatus((s) => ({ ...s, [retailer]: "done" }));
        setScrapeResult((s) => ({ ...s, [retailer]: `${data.products} products from ${data.categories} categories` }));
        loadStats();
      } else {
        setScrapeStatus((s) => ({ ...s, [retailer]: "error" }));
        setScrapeResult((s) => ({ ...s, [retailer]: data.error }));
      }
    } catch (e) {
      setScrapeStatus((s) => ({ ...s, [retailer]: "error" }));
      setScrapeResult((s) => ({ ...s, [retailer]: e instanceof Error ? e.message : "Failed" }));
    }
  }, [password, loadStats]);

  const importLulu = useCallback(async () => {
    const pw = sessionStorage.getItem("admin-pw") || password;
    setImportStatus("running");
    setImportResult("");
    try {
      const parsed = JSON.parse(luluJson);
      const products = Array.isArray(parsed) ? parsed : parsed.products;
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ products }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus("done");
        setImportResult(`Imported ${data.products} LuLu products`);
        setLuluJson("");
        loadStats();
      } else {
        setImportStatus("error");
        setImportResult(data.error);
      }
    } catch (e) {
      setImportStatus("error");
      setImportResult(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [password, luluJson, loadStats]);

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <h1 className="text-2xl font-bold text-[#111827] mb-6">Admin Access</h1>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
          <label className="block text-sm font-medium text-[#475569] mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#087F5B] focus:ring-1 focus:ring-[#087F5B]"
            placeholder="Enter admin password"
          />
          {authError && <p className="mt-2 text-sm text-red-600">{authError}</p>}
          <button
            onClick={login}
            className="mt-4 w-full rounded-lg bg-[#087F5B] py-2 text-sm font-semibold text-white hover:bg-[#065F46]"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Data Management</h1>
        <button
          onClick={() => { sessionStorage.removeItem("admin-pw"); setAuthed(false); }}
          className="text-sm text-[#64748B] hover:text-[#111827]"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.retailers.map((r) => {
            const meta = RETAILER_META[r.retailer];
            const summaryEntry = stats.summary?.retailers?.find((sr) => sr.retailer === r.retailer);
            return (
              <div key={r.retailer} className={`rounded-xl border border-[#E2E8F0] ${meta?.bg || "bg-white"} p-4`}>
                <p className={`text-sm font-semibold ${meta?.color || "text-[#111827]"}`}>{meta?.name || r.retailer}</p>
                <p className="text-2xl font-bold text-[#111827] mt-1">{r.products.toLocaleString()}</p>
                <p className="text-[13px] text-[#64748B]">products</p>
                <p className="text-[12px] text-[#94A3B8] mt-2">
                  {r.lastModified
                    ? `Updated ${new Date(r.lastModified).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "No data"}
                </p>
                {summaryEntry?.lastScrapedAt && (
                  <p className="text-[12px] text-[#94A3B8]">
                    Scraped {new Date(summaryEntry.lastScrapedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrape controls */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Refresh Product Data</h2>
        <p className="text-sm text-[#64748B] mb-4">
          Scrape live prices from retailer websites. This may take a few minutes per retailer.
        </p>
        <div className="flex gap-3">
          {Object.entries(RETAILER_META)
            .filter(([, m]) => m.canScrape)
            .map(([id, meta]) => (
              <div key={id} className="flex-1">
                <button
                  onClick={() => runScrape(id)}
                  disabled={scrapeStatus[id] === "running"}
                  className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    scrapeStatus[id] === "running"
                      ? "bg-[#F1F5F9] text-[#94A3B8] cursor-wait"
                      : "bg-[#087F5B] text-white hover:bg-[#065F46]"
                  }`}
                >
                  {scrapeStatus[id] === "running" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Scraping {meta.name}…
                    </span>
                  ) : (
                    `Refresh ${meta.name}`
                  )}
                </button>
                {scrapeResult[id] && (
                  <p className={`mt-2 text-[13px] ${scrapeStatus[id] === "error" ? "text-red-600" : "text-[#059669]"}`}>
                    {scrapeResult[id]}
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* LuLu import */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-2">Import LuLu Data</h2>
        <p className="text-sm text-[#64748B] mb-4">
          LuLu uses Cloudflare protection so automated scraping is blocked. Paste the JSON data below
          (either a <code className="bg-[#F1F5F9] px-1 rounded">{"{ products: [...] }"}</code> object or a plain array).
          Each product needs: <code className="bg-[#F1F5F9] px-1 rounded">retailerProductId</code>,{" "}
          <code className="bg-[#F1F5F9] px-1 rounded">title</code>,{" "}
          <code className="bg-[#F1F5F9] px-1 rounded">price</code>,{" "}
          <code className="bg-[#F1F5F9] px-1 rounded">productUrl</code>.
        </p>
        <textarea
          value={luluJson}
          onChange={(e) => setLuluJson(e.target.value)}
          placeholder='Paste LuLu JSON here…'
          rows={8}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-mono outline-none focus:border-[#087F5B] focus:ring-1 focus:ring-[#087F5B] resize-y"
        />
        <button
          onClick={importLulu}
          disabled={!luluJson.trim() || importStatus === "running"}
          className={`mt-3 rounded-lg px-6 py-2 text-sm font-semibold transition-colors ${
            !luluJson.trim() || importStatus === "running"
              ? "bg-[#F1F5F9] text-[#94A3B8]"
              : "bg-[#087F5B] text-white hover:bg-[#065F46]"
          }`}
        >
          {importStatus === "running" ? "Importing…" : "Import LuLu Data"}
        </button>
        {importResult && (
          <p className={`mt-2 text-[13px] ${importStatus === "error" ? "text-red-600" : "text-[#059669]"}`}>
            {importResult}
          </p>
        )}
      </div>
    </div>
  );
}
