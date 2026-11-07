import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const edge = readFileSync(new URL("../supabase/functions/subfree-api/index.ts", import.meta.url), "utf8");
const checker = readFileSync(new URL("../check.html", import.meta.url), "utf8");
const wrapper = edge.slice(edge.indexOf("function publicWrapper"), edge.indexOf("const diagnosticRate"));
test("public redirect wrapper never auto-navigates", () => {
  assert.doesNotMatch(wrapper, /location\.(assign|replace)\s*\(/);
  assert.match(wrapper, /button\.target="_blank"/);
  assert.match(wrapper, /refreshConsent\(\)/);
});
test("redirect target is never embedded in meta refresh", () => {
  assert.doesNotMatch(edge, /http-equiv="refresh"/i);
});
test("website checker does not open or navigate to the submitted URL", () => {
  assert.match(checker, /action:"site_check"/);
  assert.doesNotMatch(checker, /location\.(assign|replace)\s*\(/);
  assert.match(checker, /redirect:"manual"/) === false; // scanner behavior belongs to backend
  assert.match(edge, /redirect:\s*"manual"/);
});
test("scanner rejects private/local destinations before requesting them", () => {
  assert.match(edge, /await resolvePublicHost\(host\)/);
  assert.match(edge, /localhost/);
  assert.match(edge, /\.internal/);
});
test("redirect security settings cannot disable DNS and HTTPS protection", () => {
  assert.match(edge, /DNS-\/IP-Schutz und HTTPS-Prüfung bleiben immer aktiv/);
  assert.match(edge, /requireDomainAck/);
  assert.match(edge, /requireExternalAck/);
});
test("scanner reports HTTP security headers without following redirects", () => {
  assert.match(edge, /strict-transport-security/);
  assert.match(edge, /content-security-policy/);
  assert.match(edge, /redirect:\s*"manual"/);
});