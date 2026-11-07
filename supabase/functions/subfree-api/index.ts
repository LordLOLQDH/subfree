import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
const OWNER = Deno.env.get("GITHUB_OWNER") ?? "LordLOLQDH";
const REPO = Deno.env.get("GITHUB_REPO") ?? "subfree";
const BRANCH = Deno.env.get("GITHUB_BRANCH") ?? "main";
const API_URL = `${SUPABASE_URL}/functions/v1/subfree-api`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-subfree-key, x-subfree-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });
const dbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json"
};

async function db(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...dbHeaders, ...(init.headers ?? {}) }
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Datenbankfehler (${response.status}): ${raw.slice(0, 300)}`);
  return raw ? JSON.parse(raw) : null;
}
const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
};
const makeKey = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return "sf_" + btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const makeApiToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return "sfa_" + [...bytes].map(x => x.toString(16).padStart(2, "0")).join("");
};
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, ch =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!)
);
function starterWebsite(displayName: string, slug: string) {
  const title = escapeHtml(displayName || slug);
  const project = escapeHtml(slug);
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#050805"><meta name="description" content="${title} | Eine Website mit SubFree">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--bg:#050805;--panel:#0a110b;--line:#244d2d;--green:#00ff66;--text:#eaffed;--muted:#9ab19d}
*{box-sizing:border-box}html{min-height:100%;scroll-behavior:smooth}body{min-height:100vh;display:flex;flex-direction:column;margin:0;background-color:var(--bg);background-image:linear-gradient(#00ff660b 1px,transparent 1px),linear-gradient(90deg,#00ff660b 1px,transparent 1px);background-size:18px 18px;color:var(--text);font-family:"VT323",monospace;font-size:22px}
a{color:var(--green)}.wrap{width:min(100% - 36px,1000px);margin:auto}.top{padding:18px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:18px;align-items:center}.logo{font:14px/1.6 "Press Start 2P",monospace;color:white}.logo span{color:var(--green)}.tag{font-size:18px;color:var(--green)}.hero{padding:clamp(64px,12vw,120px) 0 76px}.eyebrow{font:9px/2 "Press Start 2P",monospace;color:var(--green)}h1{font:clamp(25px,5vw,48px)/1.55 "Press Start 2P",monospace;margin:24px 0;color:#fff}h1 span{color:var(--green)}.lead{max-width:680px;color:var(--muted);font-size:26px;line-height:1.35}.actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:30px}.btn{display:inline-block;padding:13px 17px;border:1px solid var(--green);background:#07170b;color:var(--green);font:9px/1.8 "Press Start 2P",monospace;text-decoration:none;box-shadow:4px 4px 0 #173d25}.btn.primary{background:var(--green);color:#041006}.section{padding:48px 0;border-top:1px solid var(--line)}h2{font:15px/1.8 "Press Start 2P",monospace;color:white}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:24px}.card{padding:22px;background:var(--panel);border:1px solid var(--line);box-shadow:4px 4px 0 #102417}.card h3{font:10px/1.8 "Press Start 2P",monospace;color:var(--green)}.card p{color:var(--muted);line-height:1.35}.terminal{padding:20px;background:#020402;border:1px solid var(--line);color:var(--green);font-size:20px;line-height:1.5}.terminal small{display:block;color:var(--muted)}main.wrap{flex:1 0 auto}
footer{width:100%;margin-top:auto;padding:22px 0;border-top:2px solid var(--green);background-color:#020403;background-image:linear-gradient(#00ff6609 1px,transparent 1px),linear-gradient(90deg,#00ff6609 1px,transparent 1px);background-size:14px 14px;color:var(--green);font:9px/2 "Press Start 2P",monospace;text-align:center;letter-spacing:.5px}
footer .wrap{padding:0 12px}
footer:before{content:"[ SUBFREE SYSTEM // 32-BIT ]";display:block;margin:0 auto 8px;color:var(--muted);font:8px/2 "Press Start 2P",monospace}
@media(max-width:560px){footer{padding:18px 0;font-size:7px}footer:before{font-size:7px}}
@media(max-width:560px){.top{align-items:flex-start;flex-direction:column}.logo{font-size:11px}h1{font-size:23px}.eyebrow{font-size:8px}.btn{font-size:8px}}
</style>
</head>
<body>
<header class="top wrap"><div class="logo">SUBFREE<span>.</span></div><div class="tag">SYSTEM READY // ${project}</div></header>
<main class="wrap">
<section class="hero"><div class="eyebrow">▶ PERSONAL WEBSITE // ONLINE</div><h1>${title}<br><span>WELCOME.</span></h1><p class="lead">Deine neue Website ist bereit. Ersetze diesen Text, ergänze eigene Dateien und gestalte deinen Platz im Web ganz nach deinen Vorstellungen.</p><div class="actions"><a class="btn primary" href="#about">PROJEKT ANSEHEN</a><a class="btn" href="#contact">KONTAKT</a></div></section>
<section class="section" id="about"><div class="eyebrow">01 // ABOUT</div><h2>ÜBER DIESES PROJEKT</h2><p class="lead">Hier ist Platz für deine Vorstellung, dein Portfolio oder die Idee hinter deinem Projekt.</p><div class="grid"><article class="card"><h3>DEIN INHALT</h3><p>Schreibe hier, was Besucher über deine Website wissen sollen.</p></article><article class="card"><h3>DEIN DESIGN</h3><p>Bearbeite HTML und CSS direkt im SubFree-Dateimanager.</p></article><article class="card"><h3>DEIN WEBSPACE</h3><p>Ergänze Bilder, Skripte und weitere Dateien in deinem Projekt.</p></article></div></section>
<section class="section" id="contact"><div class="eyebrow">02 // STATUS</div><h2>PROJECT STATUS</h2><div class="terminal">&gt; SUBFREE SYSTEM CHECK<br>&gt; PROJECT: ${project}<br>&gt; STATUS: <strong>READY</strong><small>Diese Startseite ist eine Vorlage. Passe sie im Dashboard an.</small></div></section>
</main>
<footer><div class="wrap">POWERED BY SUBFREE // ${project}</div></footer>
</body></html>`;
}
const b64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
function parseJsonPayload(raw: string, label: string): any {
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed); } catch {
    const start = Math.min(...[trimmed.indexOf("{"), trimmed.indexOf("[")].filter(i => i >= 0));
    if (Number.isFinite(start)) {
      const opening = trimmed[start], closing = opening === "{" ? "}" : "]";
      let depth = 0, inString = false, escaped = false;
      for (let i = start; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (inString) {
          if (escaped) escaped = false;
          else if (ch === "\\\\") escaped = true;
          else if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') inString = true;
        else if (ch === opening) depth++;
        else if (ch === closing) {
          depth--;
          if (depth === 0) {
            try { return JSON.parse(trimmed.slice(start, i + 1)); } catch { break; }
          }
        }
      }
    }
    throw new Error(`${label}: ungültige JSON-Antwort: ${trimmed.slice(0, 180)}`);
  }
}
async function github(path: string, method = "GET", content?: string, sha?: string) {
  if (!GITHUB_TOKEN) throw new Error("GitHub-Veröffentlichung ist noch nicht konfiguriert.");
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    ...(method === "PUT" ? { body: JSON.stringify({
      message: `SubFree: update ${path}`,
      content: b64(content ?? ""),
      branch: BRANCH,
      ...(sha ? { sha } : {})
    }) } : method === "DELETE" ? { body: JSON.stringify({
      message: `SubFree: remove ${path}`,
      sha,
      branch: BRANCH
    }) } : {})
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`GitHub API (${response.status}): ${raw.slice(0, 250)}`);
  if (!raw.trim()) return null;
  return parseJsonPayload(raw, `GitHub API HTTP ${response.status}`);
}
async function githubApi(path: string, method = "GET", body?: unknown) {
  if (!GITHUB_TOKEN) throw new Error("GitHub ist für Domain-Anträge nicht konfiguriert.");
  const response = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + path, {
    method,
    headers: { Authorization: "Bearer " + GITHUB_TOKEN, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json", "User-Agent": "SubFree-Domain-Registry" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const raw = await response.text();
  if (!response.ok) throw new Error("GitHub API (" + response.status + "): " + raw.slice(0, 300));
  return raw ? JSON.parse(raw) : null;
}
async function openDomainApplicationPullRequest(application: any) {
  const baseRef = await githubApi("/git/ref/heads/" + encodeURIComponent(BRANCH));
  const branch = "domain-request/" + application.slug + "-" + application.id.slice(0, 8);
  await githubApi("/git/refs", "POST", { ref: "refs/heads/" + branch, sha: baseRef.object.sha });
  const publicApplication = {
    schemaVersion: 1, slug: application.slug, websiteUrl: application.website_url,
    purpose: application.purpose, termsVersion: application.terms_version,
    requestedAt: application.created_at, checks: application.check_results,
    note: "Applicant name, email, access key and IP data are intentionally excluded."
  };
  await githubApi("/contents/domain-requests/" + application.slug + ".json", "PUT", {
    message: "SubFree: review domain path request " + application.slug,
    content: b64(JSON.stringify(publicApplication, null, 2) + "\n"), branch
  });
  const body = [
    "## SubFree Domain-Antrag", "",
    "**Pfad:** https://subfree.pntr.dev/" + application.slug + "/",
    "**Website:** " + application.website_url, "",
    "### Verwendungszweck", application.purpose, "",
    "### Automatische Website-Prüfung", "Prüfergebnis (JSON):",
    JSON.stringify(application.check_results, null, 2), "",
    "### Freigabeprozess",
    "- [ ] Automatische Registry- und Sicherheitsprüfungen bestanden",
    "- [ ] KI-Prüfung durchgeführt und kommentiert (falls KI-API konfiguriert)",
    "- [ ] Betreiber hat Inhalt und Antrag manuell geprüft",
    "- [ ] Betreiber genehmigt den Merge", "",
    "Diese PR enthält keine privaten Kontaktdaten. **Nicht automatisch mergen.**"
  ].join("\n");
  const pr = await githubApi("/pulls", "POST", { title: "Domain-Antrag: /" + application.slug, head: branch, base: BRANCH, body });
  return { number: pr.number, url: pr.html_url, branch };
}

async function writeGitHubFile(path: string, content: string) {
  let sha: string | undefined;
  try {
    const current = await github(path);
    sha = current.sha;
  } catch (error) {
    if (!String(error).includes("(404)")) throw error;
  }
  return await github(path, "PUT", content, sha);
}
async function removeGitHubFile(path: string) {
  try {
    const current = await github(path);
    await github(path, "DELETE", undefined, current.sha);
  } catch (error) {
    if (!String(error).includes("(404)")) throw error;
  }
}
async function updatePublicRegistry(site: any) {
  const path = "subfree-registry.json";
  let data: any[] = [];
  let sha: string | undefined;
  try {
    const current = await github(path);
    sha = current.sha;
    const decoded = atob(current.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
    data = parseJsonPayload(new TextDecoder().decode(bytes), "SubFree-Registry");
  } catch (error) {
    if (!String(error).includes("(404)")) throw error;
  }
  data = data.filter((entry: any) => entry.slug !== site.slug);
  data.push({
    slug: site.slug,
    displayName: site.display_name,
    github: site.github_username === "subfree-user" ? null : site.github_username,
    description: site.description,
    type: site.site_type,
    createdAt: site.created_at
  });
  await github(path, "PUT", JSON.stringify(data, null, 2) + "\n", sha);
}
async function removePublicRegistry(slug: string) {
  const path = "subfree-registry.json";
  let data: any[] = [];
  let sha: string | undefined;
  try {
    const current = await github(path);
    sha = current.sha;
    const decoded = atob(current.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
    data = parseJsonPayload(new TextDecoder().decode(bytes), "SubFree-Registry");
  } catch (error) {
    if (!String(error).includes("(404)")) throw error;
  }
  data = data.filter((entry: any) => entry.slug !== slug);
  if (sha || data.length) await github(path, "PUT", JSON.stringify(data, null, 2) + "\\n", sha);
}
function safePath(value: string) {
  const path = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!path || path.length > 240 || path.split("/").some(p => !p || p === "." || p === "..") ||
      !/^[a-zA-Z0-9._/-]+$/.test(path) || path.startsWith(".github/") || path === "subfree.json") {
    throw new Error("Ungültiger Dateipfad.");
  }
  const lowerPath = path.toLowerCase();
  if ((lowerPath.endsWith(".html") || lowerPath.endsWith(".htm") || lowerPath.endsWith(".svg")) && path !== "index.html") {
    throw new Error("Aus Sicherheitsgründen ist vorerst nur index.html als HTML-Datei erlaubt. Weitere HTML-Seiten und SVG-Dateien sind noch nicht freigeschaltet.");
  }
  return path;
}
function publicWrapper(slug: string) {
  const slugJson = JSON.stringify(slug);
  const apiJson = JSON.stringify(API_URL);
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="theme-color" content="#050805"><title>${slug}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--sf-green:#00ff66;--sf-bg:#050805;--sf-panel:#090e0a;--sf-border:#24512e;--sf-muted:#8ba58e;--sf-text:#effff1}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;width:100%;font-family:"VT323",monospace}
body{display:flex;flex-direction:column;background:#000;color:var(--sf-text)}
#status{padding:24px;color:var(--sf-muted);font-size:20px}
iframe{display:block;flex:1 0 auto;width:100%;height:100vh;min-height:100vh;border:0;background:#fff}
.subfree-ad{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px 24px;width:100%;padding:17px clamp(14px,3vw,34px);overflow:hidden;background-color:#030604;background-image:linear-gradient(rgba(0,255,136,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,.045) 1px,transparent 1px);background-size:16px 16px;border-top:2px solid #00ff88;box-shadow:0 -4px 18px rgba(0,255,136,.08);color:#9db5a4;font:16px/1.45 "VT323",monospace}
.subfree-ad-copy{min-width:0}.subfree-ad-kicker{display:flex;align-items:center;gap:8px;margin:0 0 5px;color:#00ff88;font:8px/1.8 "Press Start 2P",monospace}
.subfree-ad-kicker:before{content:"";width:7px;height:7px;background:#00ff88;box-shadow:0 0 9px #00ff88}
.subfree-ad strong{display:block;margin:0 0 3px;color:#e8f5ec;font:clamp(13px,1.4vw,16px)/1.7 "Press Start 2P",monospace}
.subfree-ad p{margin:0;color:#9db5a4;font:17px/1.35 "VT323",monospace}
.subfree-ad a{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:42px;padding:10px 15px;border:1px solid #00ff88;background:#06170d;color:#00ff88;font:9px/1.7 "Press Start 2P",monospace;text-align:center;text-decoration:none;box-shadow:3px 3px 0 #092013}
.subfree-ad a:hover{background:#0b2a17;color:#dffff0}
@media(max-width:640px){.subfree-ad{grid-template-columns:minmax(0,1fr);gap:12px;padding:15px 14px}.subfree-ad strong{font-size:12px}.subfree-ad p{font-size:16px}.subfree-ad a{justify-self:start;font-size:8px}}
.redirect-mode{min-height:100vh;display:grid;place-items:center;padding:24px;background-color:var(--sf-bg);background-image:linear-gradient(rgba(0,255,102,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,102,.055) 1px,transparent 1px);background-size:16px 16px}
.redirect-shell{width:100%;max-width:720px}.redirect-header,.redirect-footer{display:flex;align-items:center;justify-content:space-between;gap:14px}
.redirect-brand{font:16px/1.6 "Press Start 2P",monospace;color:#fff}.redirect-brand span{color:var(--sf-green)}
.redirect-online{color:var(--sf-green);font-size:17px}.redirect-panel{margin-top:25px;padding:clamp(20px,5vw,34px);background:rgba(8,14,9,.96);border:2px solid var(--sf-border);box-shadow:6px 6px 0 #102b19}
.redirect-kicker{color:var(--sf-green);font:9px/2 "Press Start 2P",monospace}.redirect-title{margin:26px 0 12px;color:#fff;font:clamp(20px,4vw,30px)/1.6 "Press Start 2P",monospace}
.redirect-description{margin:0;color:#a8bca9;font-size:22px;line-height:1.35}.redirect-separator{height:2px;margin:25px 0;background:var(--sf-border)}
.redirect-status{color:var(--sf-green);font-size:21px}.redirect-progress-top{display:flex;justify-content:space-between;align-items:center;margin:14px 0 8px;color:var(--sf-green)}
.redirect-percent{font-size:34px}.redirect-bar{overflow-wrap:anywhere;color:var(--sf-green);font-size:clamp(16px,3.5vw,24px);letter-spacing:2px;line-height:1.5}
.redirect-log{min-height:95px;margin-top:20px;color:var(--sf-muted);font-size:18px;line-height:1.45}
.redirect-button{display:block;width:100%;margin-top:22px;padding:15px;border:2px solid var(--sf-green);background:var(--sf-green);color:#050805;text-align:center;text-decoration:none;font:9px/1.8 "Press Start 2P",monospace;cursor:pointer;box-shadow:4px 4px 0 #173d25}
.redirect-button:hover{background:#c5ffd8}.redirect-button[hidden]{display:none}
.redirect-footer{margin-top:20px;color:#6e8a73;font-size:16px}.redirect-error{color:#ff6666!important}.redirect-error-border{border-color:#743333!important;box-shadow:6px 6px 0 #351616}
@media(max-width:520px){.redirect-mode{padding:16px}.redirect-panel{padding:20px}.redirect-brand{font-size:12px}.redirect-kicker{font-size:8px}.redirect-footer{font-size:14px}}
</style></head>
<body><div id="status" role="status">SUBFREE // STARTING...</div><script>
(async()=>{
const slug=${slugJson},api=${apiJson};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
try{
const response=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"public_site",slug})});
const data=await response.json();if(!response.ok)throw new Error(data.error||"Website nicht verfügbar");
if(data.siteType==="redirect"){await renderRedirect(data.redirectUrl,data.username||slug,data.redirectSecurity||{});return;}
let html=data.html||"<h1>Diese Website ist noch leer.</h1>";
const base="<base href=\\""+location.pathname.replace(/[^/]*$/,"")+"\\">";
if(/<head[^>]*>/i.test(html))html=html.replace(/<head[^>]*>/i,m=>m+base);else html="<!doctype html><head>"+base+"</head>"+html;
const frame=document.createElement("iframe");frame.setAttribute("sandbox","allow-scripts allow-forms allow-popups");frame.title="SubFree-Projekt "+slug;frame.srcdoc=html;
const badge=document.createElement("footer");badge.className="subfree-ad";badge.setAttribute("aria-label","Hinweis auf SubFree");
badge.innerHTML='<div class="subfree-ad-copy"><div class="subfree-ad-kicker">HOSTED ON SUBFREE</div><strong>Diese Website läuft mit SubFree.</strong><p>Erstelle deine eigene Website. Kostenlos und unkompliziert.</p></div><a href="https://lordlolqdh.github.io/subfree/" target="_top" rel="noopener">Eigene Website starten</a>';
document.body.replaceChildren(frame,badge);
}catch(error){document.getElementById("status").textContent="Diese Website ist derzeit nicht verfügbar: "+error.message;}
async function renderRedirect(target,username,security){
const shell=el("main","redirect-shell"),header=el("header","redirect-header"),brand=el("div","redirect-brand");
brand.innerHTML='SUBFREE<span>.</span>';header.append(brand,el("div","redirect-online","● SYSTEM ONLINE"));
const panel=el("section","redirect-panel");panel.append(el("div","redirect-kicker","▶ SUBFREE_NET.EXE // NETWORK DIAGNOSTIC"));
panel.append(el("h1","redirect-title","REDIRECT.EXE"),el("p","redirect-description","Dein Ziel wird geprüft. Die Verbindung wird vorbereitet."),el("div","redirect-separator"));
const status=el("div","redirect-status","[ STATUS ] INITIALIZING"),top=el("div","redirect-progress-top");
const percent=el("strong","redirect-percent","0%"),timer=el("span","","0.0s");top.append(percent,timer);
const bar=el("div","redirect-bar","--------------------"),log=el("div","redirect-log","> SubFree system started");
const button=el("a","redirect-button","[ OPEN DESTINATION ]");button.href=target;button.hidden=true;
panel.append(status,top,bar,log);
const destination=el("p","redirect-description","Ziel: "+new URL(target).hostname);
const acknowledgements=el("div","redirect-log");
const domainLabel=el("label");const domainCheck=el("input");domainCheck.type="checkbox";domainLabel.append(domainCheck,document.createTextNode(" Ich habe die angezeigte Zieldomain geprüft."));
const externalLabel=el("label");const externalCheck=el("input");externalCheck.type="checkbox";externalLabel.append(externalCheck,document.createTextNode(" Mir ist bewusst, dass SubFree keine Garantie für die Vertrauenswürdigkeit der Zielwebsite geben kann."));
if(security.requireDomainAck!==false)acknowledgements.append(domainLabel);
if(security.requireExternalAck!==false)acknowledgements.append(externalLabel);
button.hidden=true;button.target="_blank";button.rel="noopener noreferrer";
const refreshConsent=()=>{button.hidden=(security.requireDomainAck!==false&&!domainCheck.checked)||(security.requireExternalAck!==false&&!externalCheck.checked);};
domainCheck.addEventListener("change",refreshConsent);externalCheck.addEventListener("change",refreshConsent);
panel.append(destination,acknowledgements,button);
const footer=el("footer","redirect-footer");footer.append(el("span","","SUBFREE OS // 32-BIT"),el("span","","@"+username));
shell.append(header,panel,footer);document.body.className="redirect-mode";document.body.replaceChildren(shell);
async function runTest(){
button.hidden=true;panel.classList.remove("redirect-error-border");status.classList.remove("redirect-error");
status.textContent="[ STATUS ] RUNNING DIAGNOSTIC";log.textContent="> Resolving DNS...";percent.textContent="0%";bar.textContent="--------------------";
const started=performance.now();let done=false;let progress=0;
function animate(){if(done)return;const elapsed=performance.now()-started;progress=Math.min(88,Math.floor(elapsed/55));
percent.textContent=progress+"%";const filled=Math.floor(progress/100*20);bar.textContent="#".repeat(filled)+"-".repeat(20-filled);timer.textContent=(elapsed/1000).toFixed(1)+"s";
if(progress<30){status.textContent="[ STATUS ] DNS LOOKUP";log.textContent="> Resolving public DNS records...";}
else if(progress<65){status.textContent="[ STATUS ] CONNECTING";log.textContent="> Opening HTTPS connection...";}
else{status.textContent="[ STATUS ] WAITING FOR RESPONSE";log.textContent="> Waiting for server response...";}
requestAnimationFrame(animate);}
requestAnimationFrame(animate);
const minimumWait=new Promise(resolve=>setTimeout(resolve,2000));let result;
try{const check=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"diagnostic",slug,security})});
result=await check.json();if(!check.ok)throw new Error(result.error||"Diagnostic request failed");}
catch(error){result={reachable:false,ok:false,error:error.message,dnsStatus:"unknown"};}
await minimumWait;done=true;percent.textContent="100%";bar.textContent="#".repeat(20);timer.textContent=((performance.now()-started)/1000).toFixed(1)+"s";
if(result.reachable){status.textContent=result.ok?"[ STATUS ] TARGET ONLINE":"[ STATUS ] SERVER RESPONSE // HTTP ERROR";
log.textContent="> DNS: "+result.dnsStatus+" | HTTP: "+result.httpStatus+" | RTT: "+result.responseTimeMs+" ms"+(result.securityWarnings?.length?" | WARNINGS: "+result.securityWarnings.join(", "):"");
button.hidden=false;button.textContent=result.ok?"[ OPEN DESTINATION ]":"[ OPEN ANYWAY ]";
if(result.ok){log.textContent+=" | CONNECTION SUCCESSFUL | MANUELLE BESTÄTIGUNG ERFORDERLICH";button.textContent="[ ICH HABE DAS ZIEL GEPRÜFT – WEITER ]";button.target="_blank";button.rel="noopener noreferrer";refreshConsent();}
else{status.classList.add("redirect-error");log.textContent+=" | Server antwortet, meldet aber einen HTTP-Fehler. Öffnen nur nach eigener Entscheidung.";button.textContent="[ TROTZDEM MANUELL ÖFFNEN ]";button.target="_blank";button.rel="noopener noreferrer";refreshConsent();}}
else{status.textContent="[ STATUS ] TARGET UNREACHABLE";status.classList.add("redirect-error");panel.classList.add("redirect-error-border");
log.textContent="> DNS: "+(result.dnsStatus||"UNKNOWN")+" | ERROR: "+(result.error||"No response");
const retry=el("button","redirect-button","[ RETRY DIAGNOSTIC ]");retry.type="button";retry.addEventListener("click",runTest);panel.append(retry);}
}
runTest();
}
})();
</script></body></html>`;
}


const diagnosticRate = new Map<string, number>();

function isPublicIPv4(value: string) {
  const p = value.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a,b,c] = p;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 0 || b === 168)) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
function isPublicIPv6(value: string) {
  const ip = value.toLowerCase().split("%")[0];
  if (!ip.includes(":")) return false;
  if (ip.startsWith("::ffff:")) {
    const mapped = ip.slice(7);
    return mapped.includes(".") ? isPublicIPv4(mapped) : false;
  }
  if (ip === "::" || ip === "::1") return false;
  if (/^(fc|fd|fe[89ab]|ff)/.test(ip)) return false;
  if (ip.startsWith("2001:db8:") || ip.startsWith("2001:10:")) return false;
  return true;
}
function isPublicAddress(value: string) {
  return value.includes(":") ? isPublicIPv6(value) : isPublicIPv4(value);
}
async function resolvePublicHost(host: string) {
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".home.arpa")) {
    throw new Error("Private oder lokale Zieladresse ist nicht erlaubt.");
  }
  if (/^[0-9.]+$/.test(host) || host.includes(":")) {
    if (!isPublicAddress(host)) throw new Error("Private oder reservierte IP-Adresse ist nicht erlaubt.");
    return;
  }
  const lookup = async (type: "A" | "AAAA") => {
    const response = await fetch(
      "https://cloudflare-dns.com/dns-query?name=" + encodeURIComponent(host) + "&type=" + type,
      { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(3000) }
    );
    if (!response.ok) throw new Error("DNS-Prüfung fehlgeschlagen.");
    const data = await response.json();
    if (data.Status !== 0) return [];
    return (data.Answer || []).filter((entry: any) => entry.type === (type === "A" ? 1 : 28)).map((entry: any) => String(entry.data));
  };
  const [ipv4, ipv6] = await Promise.all([lookup("A"), lookup("AAAA")]);
  const addresses = [...ipv4, ...ipv6];
  if (!addresses.length) throw new Error("DNS-Auflösung fehlgeschlagen. Keine öffentliche IP-Adresse gefunden.");
  if (addresses.some(address => !isPublicAddress(address))) {
    throw new Error("Das Ziel verweist auf eine private oder reservierte IP-Adresse und wurde blockiert.");
  }
}
async function runRedirectDiagnostic(slug: string, request: Request, settings: any = {}) {
  const rows = await db("subfree_sites?slug=eq." + encodeURIComponent(slug) +
    "&status=eq.active&site_type=eq.redirect&select=slug,redirect_url");
  const site = rows[0];
  if (!site?.redirect_url) throw new Error("Aktives Weiterleitungsprojekt nicht gefunden.");
  const clientIp = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = clientIp + ":" + slug;
  const now = Date.now();
  const previous = diagnosticRate.get(rateKey) || 0;
  if (now - previous < 2500) throw new Error("Bitte warte kurz vor dem nächsten Verbindungstest.");
  diagnosticRate.set(rateKey, now);
  if (diagnosticRate.size > 5000) {
    for (const [key, stamp] of diagnosticRate) if (now - stamp > 60000) diagnosticRate.delete(key);
  }
  const target = new URL(site.redirect_url);
  if (target.protocol !== "https:" || target.username || target.password || (target.port && target.port !== "443")) {
    throw new Error("Ungültiges oder nicht erlaubtes HTTPS-Ziel.");
  }
  const started = performance.now();
  try {
    await resolvePublicHost(target.hostname.replaceAll("[", "").replaceAll("]", "").toLowerCase());
  } catch (error) {
    return { reachable: false, ok: false, dnsStatus: "failed", httpStatus: null,
      responseTimeMs: Math.round(performance.now() - started),
      error: String(error instanceof Error ? error.message : error).slice(0, 220) };
  }
  try {
    let response = await fetch(target.toString(), {
      method: "HEAD", redirect: "manual", cache: "no-store",
      signal: AbortSignal.timeout(4500),
      headers: { "User-Agent": "SubFree-Network-Diagnostic/1.0" }
    });
    let method = "HEAD";
    if (response.status === 405 || response.status === 501) {
      try { await response.body?.cancel(); } catch {}
      response = await fetch(target.toString(), {
        method: "GET", redirect: "manual", cache: "no-store",
        signal: AbortSignal.timeout(4500),
        headers: { "Range": "bytes=0-0", "User-Agent": "SubFree-Network-Diagnostic/1.0" }
      });
      method = "GET";
    }
    try { await response.body?.cancel(); } catch {}
    const status = response.status;
    const securityWarnings: string[] = [];
    if (settings.checkStatus !== false && status >= 400) securityWarnings.push("HTTP-Fehler");
    if (settings.checkHeaders !== false) {
      if (!response.headers.has("strict-transport-security")) securityWarnings.push("HSTS fehlt");
      if (!response.headers.has("content-security-policy")) securityWarnings.push("CSP fehlt");
      if (response.headers.get("x-content-type-options")?.toLowerCase() !== "nosniff") securityWarnings.push("nosniff fehlt");
    }
    if (settings.checkRedirect !== false && status >= 300 && status < 400) securityWarnings.push("Weiterleitung erkannt");
    return { reachable: true, ok: status >= 200 && status < 400, dnsStatus: "ok", securityWarnings,
      httpStatus: status, responseTimeMs: Math.round(performance.now() - started),
      method, redirected: status >= 300 && status < 400,
      error: status >= 400 ? "Der Server antwortet, meldet aber einen HTTP-Fehler." : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { reachable: false, ok: false, dnsStatus: "ok", httpStatus: null,
      responseTimeMs: Math.round(performance.now() - started),
      error: /timed out|abort/i.test(message) ? "Zeitüberschreitung: Der Server hat nicht rechtzeitig geantwortet." :
        "Keine HTTPS-Verbindung möglich: " + message.slice(0, 150) };
  }
}


const scanRate = new Map<string, number>();
async function runWebsiteCheck(rawUrl: string, request: Request) {
  if (rawUrl.length > 2048) throw new Error("Die URL ist zu lang.");
  let target: URL;
  try { target = new URL(rawUrl); } catch { throw new Error("Bitte gib eine vollständige URL mit https:// oder http:// ein."); }
  if (!["https:", "http:"].includes(target.protocol) || target.username || target.password ||
      (target.port && !((target.protocol === "https:" && target.port === "443") || (target.protocol === "http:" && target.port === "80"))) ||
      !target.hostname || target.hostname.includes("%")) throw new Error("Nur öffentliche HTTP-/HTTPS-Websites auf Standardports sind erlaubt. Zugangsdaten in URLs sind verboten.");
  const host = target.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  await resolvePublicHost(host);
  const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = clientIp + ":" + host, now = Date.now(), previous = scanRate.get(key) || 0;
  if (now - previous < 5000) throw new Error("Bitte warte fünf Sekunden zwischen Website-Prüfungen.");
  scanRate.set(key, now);
  if (scanRate.size > 5000) for (const [k, stamp] of scanRate) if (now - stamp > 60000) scanRate.delete(k);
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(target.toString(), { method: "HEAD", redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(5000), headers: { "User-Agent": "SubFree-Site-Check/2.0" } });
    if (response.status === 405 || response.status === 501) {
      try { await response.body?.cancel(); } catch {}
      response = await fetch(target.toString(), { method: "GET", redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(5000), headers: { "Range": "bytes=0-32767", "User-Agent": "SubFree-Site-Check/2.0" } });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(/timed out|abort/i.test(msg) ? "Zeitüberschreitung beim Verbindungsaufbau." : "Verbindung fehlgeschlagen. TLS-Zertifikat oder Server prüfen.");
  }
  const status = response.status, headers = response.headers, redirected = status >= 300 && status < 400;
  const locationValue = headers.get("location") || "";
  let redirectHost = "";
  if (redirected) { try { redirectHost = new URL(locationValue, target).hostname; } catch {} }
  const checks: any[] = [];
  const add = (id: string, label: string, state: string, detail: string) => checks.push({ id, label, status: state, detail });
  add("https", "HTTPS / TLS", target.protocol === "https:" ? "pass" : "warn", target.protocol === "https:" ? "HTTPS-Verbindung und TLS-Zertifikatsprüfung erfolgreich." : "Die Website verwendet unverschlüsseltes HTTP.");
  add("http", "HTTP-Status", status >= 200 && status < 400 ? "pass" : "warn", "Serverantwort: HTTP " + status + (redirected ? " (Weiterleitung erkannt, nicht verfolgt)." : "."));
  add("redirect", "Weiterleitungsverhalten", redirected ? "warn" : "pass", redirected ? "Weiterleitung auf " + (redirectHost || "unbekanntes Ziel") + " erkannt. Nicht verfolgt." : "Keine Weiterleitung in der ersten Antwort erkannt.");
  const hsts = headers.get("strict-transport-security") || "";
  add("hsts", "HSTS", /^max-age=\d+/i.test(hsts) ? "pass" : "warn", hsts || "Strict-Transport-Security fehlt.");
  const csp = headers.get("content-security-policy") || "";
  add("csp", "Content Security Policy", csp ? (/(unsafe-inline|unsafe-eval)/i.test(csp) ? "warn" : "pass") : "warn", csp ? (/(unsafe-inline|unsafe-eval)/i.test(csp) ? "CSP enthält unsafe-inline oder unsafe-eval." : "CSP-Header vorhanden.") : "Content-Security-Policy fehlt.");
  const nosniff = headers.get("x-content-type-options") || "";
  add("nosniff", "MIME-Sniffing-Schutz", nosniff.toLowerCase() === "nosniff" ? "pass" : "warn", nosniff || "X-Content-Type-Options: nosniff fehlt.");
  const referrer = headers.get("referrer-policy") || "";
  add("referrer", "Referrer-Policy", referrer ? "pass" : "warn", referrer || "Referrer-Policy fehlt.");
  const permissions = headers.get("permissions-policy") || "";
  add("permissions", "Permissions-Policy", permissions ? "pass" : "info", permissions || "Permissions-Policy fehlt.");
  const frame = headers.get("x-frame-options") || "";
  add("frame", "Clickjacking-Schutz", frame || /frame-ancestors/i.test(csp) ? "pass" : "warn", frame || (/frame-ancestors/i.test(csp) ? "CSP frame-ancestors ist gesetzt." : "X-Frame-Options und CSP frame-ancestors fehlen."));
  const contentType = headers.get("content-type") || "";
  add("content-type", "Content-Type", contentType ? "pass" : "warn", contentType || "Server sendet keinen Content-Type.");
  const corsHeader = headers.get("access-control-allow-origin") || "";
  add("cors", "CORS-Freigabe", corsHeader === "*" ? "warn" : corsHeader ? "info" : "pass", corsHeader === "*" ? "CORS erlaubt jeder Website den Zugriff." : corsHeader ? "CORS-Origin: " + corsHeader : "Keine öffentliche CORS-Freigabe erkannt.");
  const server = headers.get("server") || "";
  add("server", "Server-Informationen", server ? "info" : "pass", server ? "Server-Header: " + server.slice(0, 120) : "Kein Server-Banner offengelegt.");
  const powered = headers.get("x-powered-by") || "";
  add("powered", "Technologie-Offenlegung", powered ? "warn" : "pass", powered ? "X-Powered-By: " + powered.slice(0, 120) : "Kein X-Powered-By-Header erkannt.");
  const cookies = headers.get("set-cookie") || "";
  add("cookies", "Cookie-Sicherheit", !cookies ? "info" : (/;\s*secure/i.test(cookies) && /;\s*httponly/i.test(cookies) && /samesite=/i.test(cookies) ? "pass" : "warn"), !cookies ? "Keine Set-Cookie-Header sichtbar." : "Secure, HttpOnly und SameSite werden auf Cookie-Headern geprüft.");
  const cache = headers.get("cache-control") || "";
  add("cache", "Cache-Control", cache ? "pass" : "info", cache || "Cache-Control fehlt; sensible Inhalte sollten Caching explizit steuern.");
  if (redirected && redirectHost && redirectHost !== host) add("redirect-host", "Externes Weiterleitungsziel", "warn", "Die Website leitet auf einen anderen Hostnamen weiter: " + redirectHost + ". Das Ziel wurde nicht aufgerufen.");
  try { await response.body?.cancel(); } catch {}
  const warnings = checks.filter(c => c.status === "warn").length;
  const errors = status >= 400 || checks.some(c => c.id === "https" && c.status === "warn");
  return { success: true, url: target.toString(), hostname: host, httpStatus: status,
    responseTimeMs: Math.round(performance.now() - started), redirected, redirectHost,
    checkedAt: new Date().toISOString(), testCount: checks.length,
    passCount: checks.filter(c => c.status === "pass").length,
    warningCount: warnings, infoCount: checks.filter(c => c.status === "info").length,
    verdict: errors ? "warning" : warnings ? "review" : "good", checks };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Nur POST ist erlaubt." }, 405);
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "domain_application") {
      const slug = String(body.slug ?? "").trim().toLowerCase();
      const applicantName = String(body.applicantName ?? "").trim().slice(0, 80);
      const applicantEmail = String(body.applicantEmail ?? "").trim().toLowerCase();
      const websiteUrl = String(body.websiteUrl ?? "").trim();
      const purpose = String(body.purpose ?? "").trim().slice(0, 1600);
      const accessKey = String(body.accessKey ?? "");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 30) return json({ error: "Ungültiger Projektordner." }, 400);
      if (!applicantName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail) || purpose.length < 30 || !body.termsAccepted || body.termsVersion !== "2026-11-07") return json({ error: "Bitte fülle Kontakt, Verwendungszweck (mindestens 30 Zeichen) und AGB-Zustimmung vollständig aus." }, 400);
      let target: URL;
      try { target = new URL(websiteUrl); } catch { return json({ error: "Bitte gib eine vollständige Website-Adresse an." }, 400); }
      if (target.protocol !== "https:" || target.username || target.password || target.port) return json({ error: "Die Ziel-Website muss eine öffentliche HTTPS-Adresse ohne Zugangsdaten sein." }, 400);
      if (!accessKey.startsWith("sf_")) return json({ error: "Bitte bestätige den Besitz des Projektordners mit deinem Zugangscode." }, 401);
      const projectRows = await db("subfree_sites?slug=eq." + encodeURIComponent(slug) + "&select=id,slug,site_type,status,registration_data,access_key_hash");
      const project = projectRows[0];
      if (!project || project.status !== "active" || project.access_key_hash !== await sha256(accessKey)) return json({ error: "Projektordner oder Zugangscode stimmt nicht. Nur der Projektinhaber kann einen Antrag stellen." }, 403);
      if (project.registration_data?.domainMode === "active") return json({ error: "Für diesen Projektordner ist bereits ein Domain-Modus aktiv." }, 409);
      if (!GITHUB_TOKEN) return json({ error: "GitHub-PR-Erstellung ist noch nicht konfiguriert." }, 503);
      const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const ipHash = await sha256("subfree-domain:" + ip);
      const recent = await db("subfree_domain_applications?request_ip_hash=eq." + ipHash + "&status=in.(pending,pr_open)&select=id&created_at=gt." + encodeURIComponent(new Date(Date.now()-86400000).toISOString()));
      if (recent.length >= 2) return json({ error: "Du hast bereits zwei offene Domain-Anträge gestellt. Bitte warte auf die Prüfung." }, 429);
      const existing = await db("subfree_domain_applications?slug=eq." + encodeURIComponent(slug) + "&status=in.(pending,pr_open)&select=id");
      if (existing.length) return json({ error: "Für diesen Projektordner gibt es bereits einen offenen Antrag." }, 409);
      let checkResults: any;
      try { checkResults = await runWebsiteCheck(target.toString(), req); }
      catch (error) { return json({ error: "Die angegebene Website konnte nicht geprüft werden: " + String(error instanceof Error ? error.message : error).slice(0, 160) }, 400); }
      const inserted = await db("subfree_domain_applications", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ slug, applicant_name: applicantName, applicant_email: applicantEmail, website_url: target.toString(), purpose, terms_version: "2026-11-07", status: "pending", request_ip_hash: ipHash, check_results: checkResults })
      });
      const application = inserted[0];
      try {
        const pr = await openDomainApplicationPullRequest({ id: application.id, slug, website_url: target.toString(), purpose, terms_version: "2026-11-07", created_at: application.created_at, check_results: checkResults });
        await db("subfree_domain_applications?id=eq." + application.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "pr_open", github_pr_number: pr.number, github_pr_url: pr.url, updated_at: new Date().toISOString() }) });
        return json({ success: true, prUrl: pr.url, prNumber: pr.number, message: "Antrag eingereicht. Die GitHub-Pull-Request wurde erstellt. Die Veröffentlichung bleibt bis zu deiner manuellen Genehmigung deaktiviert." }, 201);
      } catch (error) {
        await db("subfree_domain_applications?id=eq." + application.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "error", updated_at: new Date().toISOString() }) });
        return json({ error: "Antrag gespeichert, aber GitHub konnte die Pull-Request nicht erstellen: " + String(error instanceof Error ? error.message : error).slice(0, 180) }, 502);
      }
    }

    if (action === "sync_domain_approval") {
      const slug = String(body.slug ?? "").trim().toLowerCase(), prNumber = Number(body.prNumber);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isInteger(prNumber) || prNumber < 1) return json({ error: "Ungültige Freigabeangaben." }, 400);
      const pr = await githubApi("/pulls/" + prNumber);
      if (pr.state !== "closed" || !pr.merged_at || pr.base?.ref !== BRANCH) return json({ error: "Die Pull-Request wurde noch nicht durch einen manuellen Merge genehmigt." }, 409);
      const files = await githubApi("/pulls/" + prNumber + "/files?per_page=100");
      if (!files.some((file: any) => file.filename === "domain-requests/" + slug + ".json" && file.status !== "removed")) return json({ error: "Die Pull-Request enthält keinen passenden Domain-Antrag." }, 403);
      const apps = await db("subfree_domain_applications?slug=eq." + encodeURIComponent(slug) + "&github_pr_number=eq." + prNumber + "&status=eq.pr_open&select=*");
      const application = apps[0];
      if (!application) return json({ error: "Kein passender offener Domain-Antrag gefunden." }, 404);
      const sites = await db("subfree_sites?slug=eq." + encodeURIComponent(slug) + "&select=id,registration_data,site_type,redirect_url");
      const site = sites[0];
      if (!site) return json({ error: "Das zugehörige SubFree-Projekt wurde nicht gefunden." }, 404);
      const registrationData = { ...(site.registration_data || {}), domainMode: "active", domainApplicationId: application.id, domainWebsiteUrl: application.website_url, domainApprovedAt: pr.merged_at, domainPullRequest: prNumber, domainPrevious: { siteType: site.site_type, redirectUrl: site.redirect_url, registrationData: site.registration_data || {} } };
      await db("subfree_sites?id=eq." + site.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ site_type: "redirect", redirect_url: application.website_url, registration_data: registrationData, updated_at: new Date().toISOString() }) });
      await db("subfree_domain_applications?id=eq." + application.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "approved", updated_at: new Date().toISOString() }) });
      return json({ success: true, path: "https://subfree.pntr.dev/" + slug + "/", message: "Manuell genehmigte Domain-Anfrage aktiviert. Die bisherigen Projekteinstellungen bleiben gespeichert." });
    }

    if (action === "site_check") {
      try { return json(await runWebsiteCheck(String(body.url ?? "").trim(), req)); }
      catch (error) { return json({ error: String(error instanceof Error ? error.message : error).slice(0, 220) }, 400); }
    }

    if (action === "diagnostic") {
      const slug = String(body.slug ?? "").toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: "Ungültiger Projektname." }, 400);
      try {
        return json({ success: true, ...(await runRedirectDiagnostic(slug, req, body.security || {})) });
      } catch (error) {
        return json({ error: String(error instanceof Error ? error.message : error).slice(0, 220) }, 429);
      }
    }

    if (action === "public_site") {
      const slug = String(body.slug ?? "").toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: "Ungültiger Projektname." }, 400);
      const rows = await db(`subfree_sites?slug=eq.${encodeURIComponent(slug)}&status=eq.active&select=id,slug,display_name,description,site_type,redirect_url,github_username,registration_data`);
      const site = rows[0];
      if (!site) return json({ error: "Projekt nicht gefunden oder noch nicht veröffentlicht." }, 404);
      const files = await db(`subfree_site_files?site_id=eq.${site.id}&file_path=eq.index.html&select=content,is_private`);
      return json({
        success: true,
        siteType: site.site_type,
        redirectUrl: site.site_type === "redirect" ? site.redirect_url : null,
        redirectSecurity: site.site_type === "redirect" ? ((site.registration_data?.redirectModes?.[site.registration_data?.activeRedirectMode || "direct"]) ?? site.registration_data?.redirectSecurity ?? { checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: true }) : null,
        username: site.github_username === "subfree-user" ? site.slug : site.github_username,
        html: files[0] && !files[0].is_private ? files[0].content : "<h1>Diese Website ist noch nicht verfügbar.</h1>"
      });
    }

    if (action === "register") {
      const slug = String(body.slug ?? "").trim().toLowerCase();
      const displayName = String(body.displayName ?? "").trim().slice(0, 70);
      const accountType = body.accountType === "subfree" ? "subfree" : "github";
      const githubUsername = accountType === "subfree" ? "subfree-user" : String(body.githubUsername ?? "").trim().replace(/^@/, "");
      const email = String(body.email ?? "").trim().toLowerCase();
      const description = String(body.description ?? "").trim().slice(0, 600);
      const siteType = body.siteType === "redirect" ? "redirect" : "static";
      let redirectUrl: string | null = null;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 30 ||
          ["admin","api","auth","dashboard","login","signup","assets","static","users","settings","support","help","subfree-registry"].includes(slug)) {
        return json({ error: "Dieser Projektname ist ungültig oder reserviert." }, 400);
      }
      if (!displayName || (accountType === "github" && !/^[A-Za-z0-9-]{1,39}$/.test(githubUsername)) ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || description.length < 10) {
        return json({ error: "Bitte fülle Name, gültigen GitHub-Benutzernamen, E-Mail und eine Beschreibung (mindestens 10 Zeichen) aus." }, 400);
      }
      if (accountType === "github") {
        const verifyResponse = await fetch("https://api.github.com/users/" + encodeURIComponent(githubUsername), {
          headers: { Accept: "application/vnd.github+json", "User-Agent": "SubFree" }
        });
        if (verifyResponse.status === 404) return json({ error: "Der angegebene GitHub-Account existiert nicht. Bitte prüfe den Benutzernamen." }, 400);
        if (!verifyResponse.ok) return json({ error: "GitHub kann den Account gerade nicht prüfen. Bitte versuche es später erneut." }, 503);
      }
      if (siteType === "redirect") {
        try {
          const u = new URL(String(body.redirectUrl ?? ""));
          if (u.protocol !== "https:" || u.username || u.password) throw new Error();
          redirectUrl = u.toString();
        } catch {
          return json({ error: "Für eine Weiterleitung ist eine gültige HTTPS-Zieladresse erforderlich." }, 400);
        }
      }
      const clientIp = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const ipHash = await sha256("subfree-ip:" + clientIp);
      const allowed = await db("rpc/subfree_check_rate_limit", {
        method: "POST",
        body: JSON.stringify({ p_ip_hash: ipHash })
      });
      if (allowed !== true) return json({ error: "Zu viele Registrierungsversuche von diesem Anschluss. Bitte warte 24 Stunden." }, 429);
      if (GITHUB_TOKEN) {
        try {
          await github(slug);
          return json({ error: "Dieser Projektordner existiert bereits. Bitte wähle einen anderen Namen." }, 409);
        } catch (error) {
          if (!String(error).includes("(404)")) throw error;
        }
      }
      const key = makeKey();
      const keyHash = await sha256(key);
      const rows = await db("subfree_sites", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          slug, display_name: displayName, github_username: githubUsername,
          contact_email: email, description, site_type: siteType,
          redirect_url: redirectUrl, access_key_hash: keyHash,
          registration_data: { displayName, githubUsername: accountType === "subfree" ? null : githubUsername, accountType, email, description, siteType, redirectUrl }
        })
      });
      const site = rows[0];
      const initialHtml = siteType === "redirect"
        ? `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Weiterleitung | SubFree</title></head><body><h1>Weiterleitung vorbereitet</h1><p>Das Ziel wird erst nach einer manuellen Bestätigung geöffnet.</p></body></html>`
        : starterWebsite(displayName, slug);
      await db("subfree_site_files?on_conflict=site_id%2Cfile_path", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ site_id: site.id, file_path: "index.html", content: initialHtml, mime_type: "text/html" })
      });
      let folderCreated = false;
      let publishMessage = "Projekt und Angaben wurden gespeichert. Der Betreiber muss die GitHub-Veröffentlichung noch aktivieren.";
      if (GITHUB_TOKEN) {
        try {
          await writeGitHubFile(`${slug}/index.html`, publicWrapper(slug));
          folderCreated = true;
          await db(`subfree_sites?id=eq.${site.id}`, {
            method: "PATCH", headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ github_folder_created: true, status: "active", updated_at: new Date().toISOString() })
          });
          try {
            await updatePublicRegistry(site);
            publishMessage = "Dein Projekt wurde automatisch veröffentlicht. GitHub Pages braucht nach der Registrierung meist noch einen kurzen Moment, bis die Website erreichbar ist.";
          } catch {
            publishMessage = "Dein Projektordner wurde erstellt. Die öffentliche Projektliste wird beim nächsten Veröffentlichen aktualisiert.";
          }
        } catch (publishError) {
          publishMessage = "Registrierung gespeichert, aber GitHub konnte den Projektordner noch nicht erstellen. Du kannst später im Dashboard auf „Projekt veröffentlichen“ klicken. " + String(publishError).slice(0, 180);
        }
      }
      return json({
        success: true, slug, projectUrl: `https://subfree.pntr.dev/${slug}/`,
        accessKey: key, folderCreated, message: publishMessage,
        warning: "Speichere diesen Zugangscode sicher. Er wird nur einmal angezeigt und kann dein Projekt vollständig verwalten."
      }, 201);
    }

    if (action === "api_push") {
      const apiToken = req.headers.get("x-subfree-token") ?? "";
      if (!apiToken.startsWith("sfa_")) return json({ error: "API-Schlüssel fehlt oder ist ungültig." }, 401);
      const tokenHash = await sha256(apiToken);
      const tokenRows = await db("subfree_api_tokens?token_hash=eq." + tokenHash + "&revoked_at=is.null&select=id,site_id,scopes");
      const token = tokenRows[0];
      if (!token) return json({ error: "API-Schlüssel ist ungültig oder wurde widerrufen." }, 401);
      if (!(token.scopes || []).includes("files:write")) return json({ error: "Dem API-Schlüssel fehlt files:write." }, 403);
      const owned = await db("subfree_sites?id=eq." + token.site_id + "&select=id,slug,status,github_folder_created");
      const apiSite = owned[0];
      if (!apiSite) return json({ error: "Zugehöriges Projekt wurde nicht gefunden." }, 404);
      const path = safePath(String(body.path ?? "index.html"));
      const content = String(body.content ?? "");
      const isPrivate = path === "index.html" ? false : Boolean(body.isPrivate);
      if (new TextEncoder().encode(content).length > 500000) return json({ error: "Datei ist größer als 500 KB." }, 413);
      await db("subfree_api_tokens?id=eq." + token.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_used_at: new Date().toISOString() }) });
      await db("subfree_site_files?on_conflict=site_id%2Cfile_path", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ site_id: apiSite.id, file_path: path, content, is_private: isPrivate,
          mime_type: path.endsWith(".html") ? "text/html" : path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript" : "text/plain",
          updated_at: new Date().toISOString() })
      });
      let published = false;
      if (GITHUB_TOKEN && apiSite.status === "active") {
        if (isPrivate) await removeGitHubFile(apiSite.slug + "/" + path);
        else if (path === "index.html") await writeGitHubFile(apiSite.slug + "/index.html", publicWrapper(apiSite.slug));
        else await writeGitHubFile(apiSite.slug + "/" + path, content);
        published = true;
      }
      return json({ success: true, saved: true, published, path, message: published ? "Datei gespeichert und Veröffentlichung angestoßen." : "Datei gespeichert. Veröffentlichung ist noch nicht aktiv." });
    }

    const accessKey = req.headers.get("x-subfree-key") ?? String(body.accessKey ?? "");
    if (!accessKey.startsWith("sf_")) return json({ error: "Zugangscode fehlt oder ist ungültig." }, 401);
    const hash = await sha256(accessKey);
    const rows = await db(`subfree_sites?access_key_hash=eq.${hash}&select=id,slug,display_name,github_username,description,site_type,redirect_url,status,github_folder_created,created_at,registration_data`);
    const site = rows[0];
    if (!site) return json({ error: "Zugangscode ist ungültig." }, 401);

    const domainLocked = site.registration_data?.domainMode === "active";
    const domainWriteActions = new Set(["update_redirect_modes","update_redirect","save_file","create_folder","set_folder_privacy","publish","offline","api_push","create_api_token","revoke_api_token","delete_project"]);
    if (domainLocked && domainWriteActions.has(action)) return json({ error: "Dieser Projektpfad ist im genehmigten Domain-Modus schreibgeschützt. Die bisherigen Daten und Einstellungen bleiben erhalten." }, 423);

    if (action === "load") {
      const files = await db(`subfree_site_files?site_id=eq.${site.id}&select=file_path,content,mime_type,updated_at,is_private&order=file_path.asc`);
      const folders = await db(`subfree_site_folders?site_id=eq.${site.id}&select=folder_path,is_private&order=folder_path.asc`);
      const defaultModes = { direct: { checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: true }, simple: { checkStatus: true, checkHeaders: false, checkRedirect: false, requireDomainAck: true, requireExternalAck: false }, secure: { checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: false }, strict: { checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: true } };
      const savedModes = site.registration_data?.redirectModes || {};
      const redirectModes = Object.fromEntries(Object.keys(defaultModes).map(mode => [mode, { ...defaultModes[mode], ...(savedModes[mode] || (mode === "direct" ? site.registration_data?.redirectSecurity || {} : {})) }]));
      const activeRedirectMode = ["direct","simple","secure","strict"].includes(site.registration_data?.activeRedirectMode) ? site.registration_data.activeRedirectMode : "direct";
      return json({ success: true, site, redirectModes, activeRedirectMode, redirectSecurity: redirectModes[activeRedirectMode], files, folders, githubConfigured: Boolean(GITHUB_TOKEN) });
    }

    if (action === "update_redirect_modes") {
      if (site.site_type !== "redirect") return json({ error: "Dieses Projekt ist keine Weiterleitung." }, 400);
      const allowedModes = ["direct", "simple", "secure", "strict"];
      const activeMode = allowedModes.includes(body.activeMode) ? body.activeMode : "direct";
      const defaults = { direct: { checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: true }, simple: { checkStatus: true, checkHeaders: false, checkRedirect: false, requireDomainAck: true, requireExternalAck: false }, secure: { checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: false }, strict: { checkStatus: true, checkHeaders: true, checkRedirect: true, requireDomainAck: true, requireExternalAck: true } };
      const modes = Object.fromEntries(allowedModes.map(mode => { const input = body.modes?.[mode] || {}; return [mode, Object.fromEntries(Object.keys(defaults[mode]).map(key => [key, input[key] !== false]))]; }));
      const registrationData = { ...(site.registration_data || {}), redirectModes: modes, activeRedirectMode: activeMode, redirectSecurity: modes[activeMode] };
      await db(`subfree_sites?id=eq.${site.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ registration_data: registrationData, updated_at: new Date().toISOString() }) });
      return json({ success: true, activeMode, modes, message: "Modus und unabhängige Einstellungen gespeichert. DNS-/IP-Schutz und HTTPS bleiben immer aktiv." });
    }

    if (action === "update_redirect") {
      if (site.site_type !== "redirect") return json({ error: "Dieses Projekt ist keine Weiterleitung." }, 400);
      const target = String(body.redirectUrl ?? "").trim();
      if (!target || target.length > 2048) return json({ error: "Bitte gib eine gültige HTTPS-Zieladresse ein." }, 400);
      let parsed: URL;
      try { parsed = new URL(target); } catch { return json({ error: "Die Zieladresse ist ungültig." }, 400); }
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || (parsed.port && parsed.port !== "443") || !parsed.hostname) {
        return json({ error: "Nur gültige HTTPS-Zieladressen auf Port 443 sind erlaubt." }, 400);
      }
      const redirectUrl = parsed.toString();
      await db(`subfree_sites?id=eq.${site.id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ redirect_url: redirectUrl, updated_at: new Date().toISOString() })
      });
      let registryUpdated = true;
      if (GITHUB_TOKEN && site.status === "active") {
        try { await updatePublicRegistry({ ...site, redirect_url: redirectUrl }); }
        catch (error) { registryUpdated = false; console.error("SubFree redirect registry update failed", String(error)); }
      }
      return json({ success: true, redirectUrl, registryUpdated,
        message: registryUpdated ? "Weiterleitungsziel gespeichert. Die Änderung ist sofort aktiv." : "Ziel gespeichert. Die öffentliche Projektliste konnte noch nicht aktualisiert werden." });
    }

    if (action === "list_api_tokens") {
      const tokens = await db(`subfree_api_tokens?site_id=eq.${site.id}&select=id,name,token_prefix,scopes,created_at,last_used_at,revoked_at&order=created_at.desc`);
      return json({ success: true, tokens });
    }

    if (action === "create_api_token") {
      const name = String(body.name ?? "ChatGPT").trim().slice(0, 80) || "ChatGPT";
      const token = makeApiToken();
      await db("subfree_api_tokens", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ site_id: site.id, name, token_hash: await sha256(token),
          token_prefix: token.slice(0, 12), scopes: ["files:write", "deploy:write"] })
      });
      return json({ success: true, token, message: "API-Schlüssel erstellt. Er wird nur jetzt vollständig angezeigt." }, 201);
    }

    if (action === "revoke_api_token") {
      const id = String(body.id ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Ungültige Schlüssel-ID." }, 400);
      await db(`subfree_api_tokens?id=eq.${id}&site_id=eq.${site.id}&revoked_at=is.null`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ revoked_at: new Date().toISOString() })
      });
      return json({ success: true, message: "API-Schlüssel widerrufen." });
    }

    if (action === "delete_project") {
      if (site.github_folder_created && !GITHUB_TOKEN) {
        return json({ error: "Die GitHub-Verbindung fehlt. Die Website wurde nicht gelöscht, damit keine öffentlichen Dateien zurückbleiben." }, 503);
      }
      if (GITHUB_TOKEN && site.github_folder_created) {
        const files = await db(`subfree_site_files?site_id=eq.${site.id}&select=file_path`);
        for (const file of files) await removeGitHubFile(site.slug + "/" + safePath(file.file_path));
        await removeGitHubFile(site.slug + "/index.html");
        await removePublicRegistry(site.slug);
      }
      await db(`subfree_api_tokens?site_id=eq.${site.id}`, { method: "DELETE" });
      await db(`subfree_site_folders?site_id=eq.${site.id}`, { method: "DELETE" });
      await db(`subfree_site_files?site_id=eq.${site.id}`, { method: "DELETE" });
      await db(`subfree_sites?id=eq.${site.id}`, { method: "DELETE" });
      return json({ success: true, deleted: true, message: "Projekt, Zugang und gespeicherte Daten wurden gelöscht." });
    }

    if (action === "save_file") {
      const path = safePath(String(body.path ?? "index.html"));
      const content = String(body.content ?? "");
      let isPrivate = path === "index.html" ? false : Boolean(body.isPrivate);
      if (path !== "index.html") {
        const folders = await db(`subfree_site_folders?site_id=eq.${site.id}&select=folder_path,is_private`);
        if (folders.some((folder: any) => folder.is_private && path.startsWith(folder.folder_path + "/"))) isPrivate = true;
      }
      if (new TextEncoder().encode(content).length > 500000) return json({ error: "Datei ist größer als 500 KB." }, 413);
      await db("subfree_site_files?on_conflict=site_id%2Cfile_path", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          site_id: site.id, file_path: path, content, is_private: isPrivate,
          mime_type: path.endsWith(".html") ? "text/html" : path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript" : "text/plain",
          updated_at: new Date().toISOString()
        })
      });
      let published = false;
      let publishError = "";
      if (GITHUB_TOKEN && site.status === "active" && path !== "index.html") {
        try {
          if (isPrivate) await removeGitHubFile(`${site.slug}/${path}`);
          else await writeGitHubFile(`${site.slug}/${path}`, content);
          published = true;
        } catch (e) { publishError = String(e); }
      } else if (GITHUB_TOKEN && site.status === "active") {
        published = true;
      }
      return json({ success: true, saved: true, published, isPrivate, message: isPrivate ? "Datei privat gespeichert. Sie wird nicht öffentlich ausgeliefert." : published ? "Datei gespeichert. GitHub Pages braucht kurz, bis Änderungen sichtbar sind." : "Datei in SubFree gespeichert. Veröffentlichung steht noch aus.", publishError });
    }

    if (action === "create_folder") {
      const folderPath = safePath(String(body.path ?? ""));
      if (folderPath.includes(".")) return json({ error: "Ordnernamen dürfen keinen Punkt enthalten." }, 400);
      const isPrivate = Boolean(body.isPrivate);
      await db("subfree_site_folders?on_conflict=site_id%2Cfolder_path", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ site_id: site.id, folder_path: folderPath, is_private: isPrivate })
      });
      if (isPrivate && GITHUB_TOKEN) {
        const files = await db(`subfree_site_files?site_id=eq.${site.id}&select=file_path`);
        for (const file of files) if (file.file_path.startsWith(folderPath + "/")) await removeGitHubFile(`${site.slug}/${file.file_path}`);
      }
      return json({ success: true, message: isPrivate ? "Privater Ordner angelegt." : "Ordner angelegt." });
    }

    if (action === "set_folder_privacy") {
      const folderPath = safePath(String(body.path ?? ""));
      const isPrivate = Boolean(body.isPrivate);
      await db(`subfree_site_folders?site_id=eq.${site.id}&folder_path=eq.${encodeURIComponent(folderPath)}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ is_private: isPrivate })
      });
      if (GITHUB_TOKEN && isPrivate) {
        const files = await db(`subfree_site_files?site_id=eq.${site.id}&select=file_path`);
        for (const file of files) if (file.file_path.startsWith(folderPath + "/")) await removeGitHubFile(`${site.slug}/${file.file_path}`);
      }
      return json({ success: true, message: isPrivate ? "Ordner und enthaltene Dateien sind jetzt privat." : "Ordner ist wieder öffentlich. Veröffentliche das Projekt, um die Dateien bereitzustellen." });
    }

    if (action === "offline") {
      if (!GITHUB_TOKEN) return json({ error: "Die GitHub-Verbindung ist noch nicht eingerichtet." }, 503);
      const files = await db(`subfree_site_files?site_id=eq.${site.id}&select=file_path,is_private`);
      for (const file of files) if (!file.is_private) await removeGitHubFile(`${site.slug}/${safePath(file.file_path)}`);
      await removeGitHubFile(`${site.slug}/index.html`);
      await removePublicRegistry(site.slug);
      await db(`subfree_sites?id=eq.${site.id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "inactive", github_folder_created: false, updated_at: new Date().toISOString() })
      });
      return json({ success: true, status: "inactive", message: "Projekt ist offline. Beim erneuten Veröffentlichen wird es wieder online gestellt." });
    }

    if (action === "publish") {
      if (!GITHUB_TOKEN) return json({ error: "Die GitHub-Verbindung wurde vom Betreiber noch nicht eingerichtet." }, 503);
      if (!site.github_folder_created) {
        try {
          await github(site.slug);
          return json({ error: "Der Projektordner ist bereits belegt. Bitte kontaktiere den SubFree-Betreiber." }, 409);
        } catch (error) {
          if (!String(error).includes("(404)")) throw error;
        }
      }
      try {
        const files = await db(`subfree_site_files?site_id=eq.${site.id}&select=file_path,content,is_private`);
        const folders = await db(`subfree_site_folders?site_id=eq.${site.id}&select=folder_path,is_private`);
        const privateFolders = folders.filter((folder: any) => folder.is_private).map((folder: any) => folder.folder_path);
        for (const file of files) {
          const insidePrivateFolder = privateFolders.some((folder: string) => file.file_path.startsWith(folder + "/"));
          if (file.file_path !== "index.html" && !file.is_private && !insidePrivateFolder) {
            await writeGitHubFile(`${site.slug}/${safePath(file.file_path)}`, file.content);
          } else if (file.file_path !== "index.html") {
            await removeGitHubFile(`${site.slug}/${safePath(file.file_path)}`);
          }
        }
        await writeGitHubFile(`${site.slug}/index.html`, publicWrapper(site.slug));
        await updatePublicRegistry(site);
        await db(`subfree_sites?id=eq.${site.id}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ github_folder_created: true, status: "active", updated_at: new Date().toISOString() })
        });
        return json({ success: true, message: "Projektordner erstellt und Website veröffentlicht.", projectUrl: `https://lordlolqdh.github.io/subfree/${site.slug}/` });
      } catch (publishError) {
        const detail = String(publishError instanceof Error ? publishError.message : publishError).slice(0, 500);
        console.error("SubFree publish failed", { slug: site.slug, detail });
        let hint = "GitHub-Veröffentlichung fehlgeschlagen. Prüfe den GITHUB_TOKEN und dessen Repository-Zugriff.";
        if (detail.includes("(401)")) hint = "Der GITHUB_TOKEN ist ungültig oder abgelaufen. Erstelle einen neuen Token und aktualisiere das Supabase-Secret.";
        if (detail.includes("(403)")) hint = "Dem GITHUB_TOKEN fehlt wahrscheinlich Schreibzugriff. Bei Fine-grained Tokens: Repository LordLOLQDH/subfree auswählen und Contents auf Read and write setzen; Metadata muss Read-only sein.";
        if (detail.includes("(404)")) hint = "GitHub findet das Repository oder den Pfad nicht. Prüfe GITHUB_OWNER=LordLOLQDH, GITHUB_REPO=subfree und ob der Token Zugriff auf genau dieses Repository hat.";
        return json({ error: hint, detail, retryable: true }, 502);
      }
    }

    return json({ error: "Unbekannte Aktion." }, 400);
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    if (message.includes("duplicate key") || message.includes("subfree_sites_slug_key")) return json({ error: "Dieser Projektname ist bereits vergeben." }, 409);
    return json({ error: message.slice(0, 400) }, 500);
  }
});
