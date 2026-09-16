import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium, type Page } from "@playwright/test";

const DEFAULT_PATHS = [
  "/society",
  "/academy",
  "/companhia-de-artes",
  "/wessex",
  "/bilheteira",
  "/en/society",
  "/en/academy",
  "/en/companhia-de-artes",
  "/en/wessex",
  "/en/bilheteira",
];
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

type Finding = {
  check: string;
  severity: "error" | "warning";
  message: string;
  selector?: string;
};

type PageResult = {
  path: string;
  viewport: string;
  url: string;
  status: number | null;
  title: string;
  h1: string[];
  findings: Finding[];
  internalLinks: string[];
};

function parseBaseUrl(): URL {
  const value = process.env.BASE_URL ?? "http://127.0.0.1:3000";
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("BASE_URL must use http or https");
  return url;
}

async function auditPage(page: Page, baseUrl: URL, path: string, viewport: string) {
  const findings: Finding[] = [];
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];

  // tsx/esbuild annotates nested functions with this helper before Playwright
  // serializes them into the browser context.
  await page.addInitScript("globalThis.__name = (target) => target;");

  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "failed";
    // Next cancels speculative RSC prefetches when navigation priorities change.
    if (reason === "net::ERR_ABORTED") return;
    failedRequests.push(`${request.method()} ${request.url()}: ${reason}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await page.goto(new URL(path, baseUrl).toString(), {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  const title = await page.title();
  const h1 = await page.locator("h1").allTextContents();
  const url = page.url();

  if (!response || response.status() >= 400) {
    findings.push({
      check: "http",
      severity: "error",
      message: `Navigation returned ${response?.status() ?? "no response"}`,
    });
  }
  if (!title.trim()) findings.push({ check: "title", severity: "error", message: "Missing document title" });
  if (h1.length !== 1 || !h1[0]?.trim()) {
    findings.push({ check: "h1", severity: "error", message: `Expected one non-empty h1, found ${h1.length}` });
  }
  for (const message of consoleErrors) {
    findings.push({ check: "console", severity: "error", message });
  }
  for (const message of failedRequests) {
    findings.push({ check: "request", severity: "error", message });
  }

  const domAudit = await page.evaluate((idealTargetSize) => {
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        style.clip === "auto" &&
        style.clipPath === "none" &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < innerHeight &&
        rect.left < innerWidth &&
        rect.width > 0 &&
        rect.height > 0;
    };
    const describe = (element: Element) => {
      const landmark = element.closest("header, nav, main, footer, [role=dialog]");
      const context = landmark
        ? landmark.getAttribute("aria-label") || landmark.tagName.toLowerCase()
        : "body";
      const id = element.id ? `#${element.id}` : "";
      const classes = [...element.classList].slice(0, 2).map((name) => `.${name}`).join("");
      const href = element instanceof HTMLAnchorElement
        ? ` href=${JSON.stringify(`${element.pathname}${element.search}${element.hash}`)}`
        : "";
      const name = element.getAttribute("aria-label") || element.textContent?.replace(/\s+/g, " ").trim();
      const accessibleName = name ? ` name=${JSON.stringify(name.slice(0, 80))}` : "";
      return `${context} > ${element.tagName.toLowerCase()}${id}${classes}${href}${accessibleName}`;
    };
    const targets = [...document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link]")]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { selector: describe(element), width: Math.round(rect.width), height: Math.round(rect.height) };
      })
      .filter(({ width, height }) => width < idealTargetSize || height < idealTargetSize);
    const autocomplete = [...document.querySelectorAll("input")]
      .filter(visible)
      .filter((element) => {
        const input = element as HTMLInputElement;
        return !["button", "checkbox", "file", "hidden", "radio", "range", "reset", "submit"].includes(input.type);
      })
      .filter((element) => !(element as HTMLInputElement).autocomplete)
      .map(describe);
    const internalLinks = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
      .map((anchor) => new URL(anchor.href, location.href))
      .filter((url) => url.origin === location.origin && /^https?:$/.test(url.protocol))
      .map((url) => `${url.pathname}${url.search}`);
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      targets,
      autocomplete,
      internalLinks: [...new Set(internalLinks)],
    };
  }, 44);

  if (domAudit.overflow > 1) {
    findings.push({ check: "overflow", severity: "error", message: `Horizontal overflow of ${domAudit.overflow}px` });
  }
  for (const target of domAudit.targets) {
    const minimum = target.width < 24 || target.height < 24;
    findings.push({
      check: "tap-target",
      severity: minimum ? "error" : "warning",
      message: `${target.width}x${target.height}px (minimum 24px, ideal 44px)`,
      selector: target.selector,
    });
  }
  for (const selector of domAudit.autocomplete) {
    findings.push({ check: "autocomplete", severity: "warning", message: "Input has no autocomplete attribute", selector });
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  const moving = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        const durations = `${style.animationDuration},${style.transitionDuration}`
          .split(",")
          .map((value) => value.trim())
          .map((value) => value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000);
        return durations.some((duration) => Number.isFinite(duration) && duration > 10);
      })
      .slice(0, 20)
      .map((element) => ({ selector: element.tagName.toLowerCase(), duration: getComputedStyle(element).animationDuration })),
  );
  for (const item of moving) {
    findings.push({
      check: "reduced-motion",
      severity: "warning",
      message: `Motion duration remains enabled (${item.duration || "transition"})`,
      selector: item.selector,
    });
  }

  return {
    path,
    viewport,
    url,
    status: response?.status() ?? null,
    title,
    h1: h1.map((value) => value.trim()),
    findings,
    internalLinks: domAudit.internalLinks,
  } satisfies PageResult;
}

async function main() {
  const baseUrl = parseBaseUrl();
  const paths = process.env.AUDIT_PATHS?.split(",").map((path) => path.trim()).filter(Boolean) ?? DEFAULT_PATHS;
  const outputPath = resolve(process.env.AUDIT_OUTPUT ?? "audit-results/site-audit.json");
  const browser = await chromium.launch({ headless: true });
  const results: PageResult[] = [];

  try {
    for (const viewport of VIEWPORTS) {
      for (const path of paths) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        results.push(await auditPage(page, baseUrl, path, viewport.name));
        await context.close();
      }
    }

    const internalLinks = [...new Set(results.flatMap((result) => result.internalLinks))];
    const linkChecks: Array<{ path: string; status: number | null; ok: boolean; skipped?: boolean }> = [];
    const request = await browser.newContext();
    for (const path of internalLinks) {
      if (/^\/api\/|\/bilhete\/|\/bilheteira\/verify\/|\/wepacker\/invite\/|\/logout(?:[/?]|$)/.test(path)) {
        linkChecks.push({ path, status: null, ok: true, skipped: true });
        continue;
      }
      const response = await request.request.get(new URL(path, baseUrl).toString(), { timeout: 20_000 });
      linkChecks.push({ path, status: response.status(), ok: response.status() < 400 });
    }
    await request.close();

    const summary = {
      pages: results.length,
      errors: results.flatMap((result) => result.findings).filter((finding) => finding.severity === "error").length,
      warnings: results.flatMap((result) => result.findings).filter((finding) => finding.severity === "warning").length,
      brokenInternalLinks: linkChecks.filter((link) => !link.ok).length,
    };
    const report = { generatedAt: new Date().toISOString(), baseUrl: baseUrl.toString(), summary, pages: results, internalLinks: linkChecks };
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ output: outputPath, ...summary }));

    if (process.env.AUDIT_STRICT === "1" && (summary.errors > 0 || summary.brokenInternalLinks > 0)) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
