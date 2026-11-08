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
  assert.match(edge, /redirect:\s*"manual"/);
});
test("scanner rejects private/local destinations before requesting them", () => {
  assert.match(edge, /await resolvePublicHost\(host\)/);
  assert.match(edge, /localhost/);
  assert.match(edge, /\.internal/);
});
test("redirect security settings cannot disable DNS and HTTPS protection", () => {
  assert.match(edge, /DNS-\/IP-Schutz und HTTPS bleiben immer aktiv/);
  assert.match(edge, /requireDomainAck/);
  assert.match(edge, /requireExternalAck/);
});
test("scanner reports HTTP security headers without following redirects", () => {
  assert.match(edge, /strict-transport-security/);
  assert.match(edge, /content-security-policy/);
  assert.match(edge, /redirect:\s*"manual"/);
});
test("dashboard exposes all four independent redirect modes", () => {
  const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const mode of ["direct", "simple", "secure", "strict"]) assert.match(page, new RegExp('value="' + mode + '"'));
  assert.match(edge, /redirectModes/);
  assert.match(edge, /activeRedirectMode/);
  assert.match(edge, /update_redirect_modes/);
});
test("legacy direct mode keeps the previous safety defaults", () => {
  assert.match(edge, /direct: \{ checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: true, requireStrictAck: false \}/);
  assert.match(edge, /mode === "direct" \? site\.registration_data\?\.redirectSecurity/);
});

test("website checker runs a broader non-following security test suite", () => {
  for (const header of ["strict-transport-security","content-security-policy","x-content-type-options","referrer-policy","permissions-policy","x-frame-options","access-control-allow-origin","set-cookie"]) assert.ok(edge.toLowerCase().includes(header));
  assert.match(edge, /testCount:/);
  assert.match(edge, /redirect:\s*"manual"/);
  assert.doesNotMatch(checker, /window\.open\s*\(|location\.(assign|replace)\s*\(/);
});
test("domain application requires project ownership, HTTPS target, purpose and terms", () => {
  const block = edge.slice(edge.indexOf('if (action === "domain_application")'), edge.indexOf('if (action === "sync_domain_approval")'));
  assert.match(block, /accessKey/);
  assert.match(block, /termsAccepted/);
  assert.match(block, /purpose\.length < 30/);
  assert.match(block, /target\.protocol !== "https:"/);
  assert.match(block, /runWebsiteCheck/);
  assert.match(block, /openDomainApplicationPullRequest/);
  assert.ok(block.indexOf("openDomainApplicationPullRequest") < block.indexOf("runWebsiteCheck"), "PR must be created before technical checks");
  assert.ok(block.indexOf("openDomainApplicationPullRequest") < block.indexOf("reviewDomainApplicationWithAI"), "PR must be created before AI review");
});
test("public pull request excludes applicant private information", () => {
  const block = edge.slice(edge.indexOf("async function openDomainApplicationPullRequest"), edge.indexOf("async function writeGitHubFile"));
  assert.match(block, /applicantName: application\.applicant_name/);
  assert.match(block, /websiteUrl: application\.website_url/);
  assert.match(block, /purpose: application\.purpose/);
  assert.doesNotMatch(block, /applicant_email|accessKey|check_results: ai|checks: application/);
  assert.match(block, /Kein automatischer Merge/);
  assert.match(block, /Pull Request wird zuerst erstellt/);
});
test("domain application requires a real Groq review and blocks explicit illegal drug sales", () => {
  assert.match(edge, /Deno\.env\.get\("GROQ_SUBFREE"\)/);
  assert.match(edge, /reviewDomainApplicationWithAI\(purpose, target\.toString\(\)\)/);
  assert.match(edge, /controlledDrugMention && salesIntent/);
  assert.match(edge, /decision = "rejected"/);
  assert.match(edge, /KI-Prüfung fehlgeschlagen/);
});
test("domain PR summarizes AI and technical checks without dumping the JSON payload", () => {
  const block = edge.slice(edge.indexOf("async function openDomainApplicationPullRequest"), edge.indexOf("async function writeGitHubFile"));
  assert.match(block, /SubFree-Prüfergebnis/);
  assert.match(block, /Technischer Website-Check/);
  assert.doesNotMatch(block, /JSON\.stringify\(application\.check_results, null, 2\)/);
});
test("approved path only activates after a merged GitHub pull request", () => {
  const block = edge.slice(edge.indexOf('if (action === "sync_domain_approval")'), edge.indexOf('if (action === "site_check")'));
  assert.match(block, /pr\.merged_at/);
  assert.match(block, /aiDecision/);
  assert.match(block, /approved.*manual_review/);
  assert.match(block, /domain-requests\//);
  assert.match(block, /domainMode: "active"/);
  assert.match(block, /domainPrevious:/);
  assert.match(block, /site_type: "redirect"/);
});
test("approved domain mode keeps old project data and blocks writes", () => {
  assert.match(edge, /domainWriteActions/);
  assert.match(edge, /domainMode === "active"/);
  assert.match(edge, /registration_data: registrationData/);
  assert.match(edge, /apiSite\.registration_data\?\.domainMode === "active"/);
});
test("domain application form requests terms and purpose and links to the correct path base", () => {
  const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(page, /subfree\.pntr\.dev\//);
  assert.match(page, /id="domain-request-form"/);
  assert.match(page, /id="domain-terms"/);
  assert.match(page, /id="domain-purpose"/);
  assert.match(page, /href="agb\.html"/);
});
test("domain request workflow never merges automatically", () => {
  const workflow = readFileSync(new URL("../.github/workflows/domain-requests.yml", import.meta.url), "utf8");
  assert.match(workflow, /Post validation result/);
  assert.match(workflow, /KEINE Inhaltsfreigabe/);
  assert.doesNotMatch(workflow, /OPENAI_API_KEY|api.openai.com/);
  assert.match(workflow, /gh pr comment/);
  assert.match(workflow, /sync_domain_approval/);
  assert.doesNotMatch(workflow, /gh pr merge/);
});
test("redirect mode selection persists and rolls back on save failure", () => {
  const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
  assert.match(script, /const previousMode=activeRedirectMode/);
  assert.match(script, /if\(!saved\)\{activeRedirectMode=previousMode/);
});

test("direct mode remains unchanged while strict mode adds a third confirmation", () => {
  const direct = edge.match(/direct: \{[^}]+\}/)?.[0] || "";
  const strict = edge.match(/strict: \{[^}]+\}/)?.[0] || "";
  assert.match(direct, /requireStrictAck: false/);
  assert.match(strict, /requireStrictAck: true/);
  assert.match(edge, /security\.requireStrictAck===true/);
  assert.match(edge, /strictCheck\.checked/);
  const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(page, /id="sec-strict-ack"/);
});

test("approved domain mode can restore the original project settings without deleting them", () => {
  assert.match(edge, /if \(action === "restore_domain_mode"\)/);
  assert.match(edge, /site\.registration_data\.domainPrevious/);
  assert.match(edge, /previous\.registrationData/);
  assert.match(edge, /previous\.siteType/);
  const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
  assert.match(page, /id="restore-domain-mode"/);
  assert.match(script, /restore_domain_mode/);
});


test("Vercel automatic deployments and GitHub bot comments are disabled", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.git.deploymentEnabled, false);
  assert.equal(config.github.silent, true);
});


test("domain request PR is created before public path availability is checked", () => {
  assert.ok(!edge.includes("async function domainRequestPathIsFree"));
  const pr = edge.slice(edge.indexOf("async function openDomainApplicationPullRequest"), edge.indexOf("async function finalizeDomainApplicationPullRequest"));
  assert.ok(pr.includes("domain-requests/pending/"));
  assert.ok(pr.includes("application.id"));
  const block = edge.slice(edge.indexOf('if (action === "domain_application")'), edge.indexOf('if (action === "sync_domain_approval")'));
  assert.ok(!block.includes("domainRequestPathIsFree"));
  assert.ok(block.indexOf("openDomainApplicationPullRequest") < block.indexOf("runWebsiteCheck"));
  assert.ok(!block.includes("domainMode === \"active\""));
});

test("post-creation validation checks collisions without overwriting request files", () => {
  const workflow = readFileSync(new URL("../.github/workflows/domain-requests.yml", import.meta.url), "utf8");
  assert.ok(workflow.includes("domain-requests/pending/*.json"));
  assert.ok(workflow.includes("git cat-file -e"));
  assert.ok(workflow.includes("Domain path already occupied"));
});

test("duplicate domain slugs are allowed to create independent PRs before checks", () => {
  const pr = edge.slice(edge.indexOf("async function openDomainApplicationPullRequest"), edge.indexOf("async function finalizeDomainApplicationPullRequest"));
  assert.ok(pr.includes("domain-requests/pending/"));
  assert.ok(pr.includes("application.id"));
  const block = edge.slice(edge.indexOf('if (action === "domain_application")'), edge.indexOf('if (action === "sync_domain_approval")'));
  assert.ok(!block.includes("domainRequestPathIsFree"));
  assert.ok(block.includes("const recent = await db("));
  assert.ok(block.indexOf("openDomainApplicationPullRequest") < block.indexOf("runWebsiteCheck"));
});

test("domain path collision is checked by GitHub Actions after the PR exists", () => {
  const workflow = readFileSync(new URL("../.github/workflows/domain-requests.yml", import.meta.url), "utf8");
  assert.ok(workflow.includes("pull_request:"));
  assert.ok(workflow.includes("domain-requests/pending/*.json"));
  assert.ok(workflow.includes("git cat-file -e"));
  assert.ok(workflow.includes("The PR was created and remains open"));
  assert.ok(workflow.includes("if: always()"));
});


test("domain request dashboard lists only applications belonging to the supplied project key", () => {
  const list = edge.slice(edge.indexOf('if (action === "domain_applications_list")'), edge.indexOf('if (action === "update_domain_target")'));
  assert.match(list, /sha256\(accessKey\)/);
  assert.match(list, /access_key_hash=eq\./);
  assert.match(list, /subfree_domain_applications/);
  assert.match(list, /select=id,slug,applicant_name,website_url,status,github_pr_number,github_pr_url,created_at,updated_at,check_results/);
  assert.doesNotMatch(list, /select=[^"]*(applicant_email|request_ip_hash|access_key_hash)/);
  const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
  assert.match(page, /id="domain-status"/);
  assert.match(page, /id="domain-manage-key"/);
  assert.match(script, /domain_applications_list/);
});

test("only the owner can change the target of the currently approved domain path", () => {
  const update = edge.slice(edge.indexOf('if (action === "update_domain_target")'), edge.indexOf('if (action === "sync_domain_approval")'));
  assert.match(update, /sha256\(accessKey\)/);
  assert.match(update, /domainMode !== "active"/);
  assert.match(update, /domainApplicationId !== applicationId/);
  assert.match(update, /status=eq\.approved/);
  assert.match(update, /target\.protocol !== "https:"/);
  assert.match(update, /redirect_url: normalizedTarget/);
  assert.match(update, /website_url: normalizedTarget/);
});

test("domain path UI explains why per-path CNAME records are unavailable", () => {
  const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
  assert.match(page, /keinen separaten CNAME-Eintrag/i);
  assert.match(page, /Weiterleitungsziel/);
  assert.match(script, /update_domain_target/);
});
