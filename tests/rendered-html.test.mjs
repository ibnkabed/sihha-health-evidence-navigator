import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the finished Sihha product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /صحة/);
  assert.match(html, /Health Evidence Navigator/);
  assert.match(html, /Safe demo/);
  assert.match(html, /Apple Health ZIP/);
  assert.match(html, /تقرير المختص/);
  assert.match(html, /مؤشر اليوم/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("contains no private medical source artifacts", async () => {
  const topFiles = await readdir(root);
  assert.equal(topFiles.some((name) => /\.(pdf|zip|xlsx|xls|docx|csv)$/i.test(name)), false);

  const sources = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/sample-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/apple-health-import.ts", import.meta.url), "utf8"),
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /Abdullah|عبدالله|Wareed|PCMC|بياناتي من تطبيق صحة|الفحوصات والمكملات/);
  assert.match(combined, /مصطنعة|تجريبي/);
});

test("Apple Health import stays local", async () => {
  const importer = await readFile(new URL("../lib/apple-health-import.ts", import.meta.url), "utf8");
  assert.match(importer, /export\.xml/);
  assert.match(importer, /HKQuantityTypeIdentifierStepCount/);
  assert.match(importer, /HKCategoryTypeIdentifierSleepAnalysis/);
  assert.doesNotMatch(importer, /fetch\s*\(|XMLHttpRequest|axios/i);
  const sampleZip = await readFile(new URL("../public/samples/apple-health-demo.zip", import.meta.url));
  assert.ok(sampleZip.length > 0 && sampleZip.length < 50_000);
});
