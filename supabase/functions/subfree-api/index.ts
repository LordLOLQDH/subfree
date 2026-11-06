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
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-subfree-key",
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
if(data.siteType==="redirect"){await renderRedirect(data.redirectUrl,data.username||slug);return;}
let html=data.html||"<h1>Diese Website ist noch leer.</h1>";
const base="<base href=\\""+location.pathname.replace(/[^/]*$/,"")+"\\">";
if(/<head[^>]*>/i.test(html))html=html.replace(/<head[^>]*>/i,m=>m+base);else html="<!doctype html><head>"+base+"</head>"+html;
const frame=document.createElement("iframe");frame.setAttribute("sandbox","allow-scripts allow-forms allow-popups");frame.title="SubFree-Projekt "+slug;frame.srcdoc=html;
const badge=document.createElement("footer");badge.className="subfree-ad";badge.setAttribute("aria-label","Hinweis auf SubFree");
badge.innerHTML='<div class="subfree-ad-copy"><div class="subfree-ad-kicker">HOSTED ON SUBFREE</div><strong>Diese Website läuft mit SubFree.</strong><p>Erstelle deine eigene Website. Kostenlos und unkompliziert.</p></div><a href="https://lordlolqdh.github.io/subfree/" target="_top" rel="noopener">Eigene Website starten</a>';
document.body.replaceChildren(frame,badge);
}catch(error){document.getElementById("status").textContent="Diese Website ist derzeit nicht verfügbar: "+error.message;}
async function renderRedirect(target,username){
const shell=el("main","redirect-shell"),header=el("header","redirect-header"),brand=el("div","redirect-brand");
brand.innerHTML='SUBFREE<span>.</span>';header.append(brand,el("div","redirect-online","● SYSTEM ONLINE"));
const panel=el("section","redirect-panel");panel.append(el("div","redirect-kicker","▶ SUBFREE_NET.EXE // NETWORK DIAGNOSTIC"));
panel.append(el("h1","redirect-title","REDIRECT.EXE"),el("p","redirect-description","Dein Ziel wird geprüft. Die Verbindung wird vorbereitet."),el("div","redirect-separator"));
const status=el("div","redirect-status","[ STATUS ] INITIALIZING"),top=el("div","redirect-progress-top");
const percent=el("strong","redirect-percent","0%"),timer=el("span","","0.0s");top.append(percent,timer);
const bar=el("div","redirect-bar","--------------------"),log=el("div","redirect-log","> SubFree system started");
const button=el("a","redirect-button","[ OPEN DESTINATION ]");button.href=target;button.hidden=true;
panel.append(status,top,bar,log,button);
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
try{const check=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"diagnostic",slug})});
result=await check.json();if(!check.ok)throw new Error(result.error||"Diagnostic request failed");}
catch(error){result={reachable:false,ok:false,error:error.message,dnsStatus:"unknown"};}
await minimumWait;done=true;percent.textContent="100%";bar.textContent="#".repeat(20);timer.textContent=((performance.now()-started)/1000).toFixed(1)+"s";
if(result.reachable){status.textContent=result.ok?"[ STATUS ] TARGET ONLINE":"[ STATUS ] SERVER RESPONSE // HTTP ERROR";
log.textContent="> DNS: "+result.dnsStatus+" | HTTP: "+result.httpStatus+" | RTT: "+result.responseTimeMs+" ms";
button.hidden=false;button.textContent=result.ok?"[ OPEN DESTINATION ]":"[ OPEN ANYWAY ]";
if(result.ok){log.textContent+=" | CONNECTION SUCCESSFUL";setTimeout(()=>window.location.assign(target),450);}
else{status.classList.add("redirect-error");log.textContent+=" | Server antwortet, meldet aber einen HTTP-Fehler. Manuelle Öffnung möglich.";}}
else{status.textContent="[ STATUS ] TARGET UNREACHABLE";status.classList.add("redirect-error");panel.classList.add("redirect-error-border");
log.textContent="> DNS: "+(result.dnsStatus||"UNKNOWN")+" | ERROR: "+(result.error||"No response");
const retry=el("button","redirect-button","[ RETRY DIAGNOSTIC ]");retry.type="button";retry.addEventListener("click",runTest);panel.append(retry);}
}
runTest();
}
})();
</script></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Nur POST ist erlaubt." }, 405);
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "diagnostic") {
      const slug = String(body.slug ?? "").toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: "Ungültiger Projektname." }, 400);
      try {
        return json({ success: true, ...(await runRedirectDiagnostic(slug, req)) });
      } catch (error) {
        return json({ error: String(error instanceof Error ? error.message : error).slice(0, 220) }, 429);
      }
    }

    if (action === "public_site") {
      const slug = String(body.slug ?? "").toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: "Ungültiger Projektname." }, 400);
      const rows = await db(`subfree_sites?slug=eq.${encodeURIComponent(slug)}&status=eq.active&select=id,slug,display_name,description,site_type,redirect_url`);
      const site = rows[0];
      if (!site) return json({ error: "Projekt nicht gefunden oder noch nicht veröffentlicht." }, 404);
      const files = await db(`subfree_site_files?site_id=eq.${site.id}&file_path=eq.index.html&select=content,is_private`);
      return json({
        success: true,
        siteType: site.site_type,
        redirectUrl: site.site_type === "redirect" ? site.redirect_url : null,
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
        ? `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${redirectUrl}"><meta name="robots" content="noindex"><title>Weiterleitung</title></head><body><p>Weiterleitung zu <a href="${redirectUrl}">${redirectUrl}</a> …</p></body></html>`
        : `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${displayName.replace(/[<>]/g,"")}</title></head><body><h1>${displayName.replace(/[<>]/g,"")}</h1><p>Deine SubFree-Website wurde angelegt. Bearbeite diese Datei im SubFree-Dashboard.</p></body></html>`;
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
        success: true, slug, projectUrl: `https://lordlolqdh.github.io/subfree/${slug}/`,
        accessKey: key, folderCreated, message: publishMessage,
        warning: "Speichere diesen Zugangscode sicher. Er wird nur einmal angezeigt und kann dein Projekt vollständig verwalten."
      }, 201);
    }

    const accessKey = req.headers.get("x-subfree-key") ?? String(body.accessKey ?? "");
    if (!accessKey.startsWith("sf_")) return json({ error: "Zugangscode fehlt oder ist ungültig." }, 401);
    const hash = await sha256(accessKey);
    const rows = await db(`subfree_sites?access_key_hash=eq.${hash}&select=id,slug,display_name,github_username,description,site_type,redirect_url,status,github_folder_created,created_at`);
    const site = rows[0];
    if (!site) return json({ error: "Zugangscode ist ungültig." }, 401);

    if (action === "load") {
      const files = await db(`subfree_site_files?site_id=eq.${site.id}&select=file_path,content,mime_type,updated_at,is_private&order=file_path.asc`);
      const folders = await db(`subfree_site_folders?site_id=eq.${site.id}&select=folder_path,is_private&order=folder_path.asc`);
      return json({ success: true, site, files, folders, githubConfigured: Boolean(GITHUB_TOKEN) });
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
