const API_URL = "https://eopvkwhcgznvubesaszv.supabase.co/functions/v1/subfree-api";
const SUPABASE_KEY = "sb_publishable_d3hVgDqwTuB63BtfumPwoQ_ngy2ig_c";
const form = document.querySelector("#register-form");
const message = document.querySelector("#register-message");
const year = document.querySelector("#year");
const typeSelect = document.querySelector("#siteType");
const redirectField = document.querySelector("#redirect-field");
const keyResult = document.querySelector("#key-result");
const keyOutput = document.querySelector("#new-key");
const copyKeyButton = document.querySelector("#copy-key");
const newProjectLink = document.querySelector("#new-project-link");
const accessInput = document.querySelector("#access-key");
const accountType = document.querySelector("#accountType");
const githubField = document.querySelector("#github-field");
const githubInput = document.querySelector("#githubUsername");
const githubCheck = document.querySelector("#github-check");
const localStoreKey = "subfree.local.settings.v1";
const manageMessage = document.querySelector("#manage-message");
const editor = document.querySelector("#editor");
const pathInput = document.querySelector("#file-path");
const contentInput = document.querySelector("#file-content");
const saveMessage = document.querySelector("#save-message");
let currentKey = "";
let currentSite = null;
let currentFolders = [];

if (year) year.textContent = new Date().getFullYear();
const localSettings = (()=>{try{return JSON.parse(localStorage.getItem(localStoreKey)||"{}")}catch{return {}}})();
const localName=document.querySelector("#local-name"),localEmail=document.querySelector("#local-email"),rememberKey=document.querySelector("#remember-key");
if(localName)localName.value=localSettings.name||"";
if(localEmail)localEmail.value=localSettings.email||"adam_kraus@icloud.com";
if(rememberKey)rememberKey.checked=Boolean(localSettings.rememberKey);
if(localSettings.rememberKey&&localSettings.accessKey){accessInput.value=localSettings.accessKey}
document.querySelector("#save-local-settings")?.addEventListener("click",()=>{
 const settings={name:localName.value.trim(),email:localEmail.value.trim(),rememberKey:rememberKey.checked,accessKey:rememberKey.checked?(accessInput.value.trim()||localSettings.accessKey||""):""};
 try{localStorage.setItem(localStoreKey,JSON.stringify(settings));document.querySelector("#local-settings-status").textContent="Auf diesem Gerät gespeichert."}
 catch{document.querySelector("#local-settings-status").textContent="Speichern im Browser nicht möglich."}
});
document.querySelector("#clear-local-settings")?.addEventListener("click",()=>{
 try{localStorage.removeItem(localStoreKey);}catch{}
 if(localName)localName.value="";
 if(localEmail)localEmail.value="";
 if(rememberKey)rememberKey.checked=false;
 if(accessInput)accessInput.value="";
 document.querySelector("#local-settings-status").textContent="Lokale Profildaten und gespeicherter Zugangscode wurden von diesem Gerät entfernt. Das Online-Projekt bleibt bestehen.";
});
accountType?.addEventListener("change",()=>{const hasGithub=accountType.value==="github";githubField.hidden=!hasGithub;githubInput.required=hasGithub;document.querySelector("#no-github-note").hidden=hasGithub;});
if(accountType){githubInput.required=true;}
let githubCheckTimer;
githubInput?.addEventListener("input",()=>{
 clearTimeout(githubCheckTimer);githubCheck.textContent="GitHub-Account wird geprüft …";githubCheck.style.color="#90a5bf";
 githubCheckTimer=setTimeout(async()=>{
  const username=githubInput.value.trim().replace(/^@/,"");
  if(!username){githubCheck.textContent="GitHub-Benutzernamen eingeben.";return}
  if(!/^[A-Za-z0-9-]{1,39}$/.test(username)){githubCheck.textContent="Ungültiges GitHub-Format.";githubCheck.style.color="#ff8585";return}
  try{const r=await fetch("https://api.github.com/users/"+encodeURIComponent(username),{headers:{Accept:"application/vnd.github+json"}});if(r.ok){const u=await r.json();githubCheck.textContent="✓ GitHub-Account gefunden: "+u.login;githubCheck.style.color="#65dba7"}else if(r.status===404){githubCheck.textContent="✕ Dieser GitHub-Account existiert nicht.";githubCheck.style.color="#ff8585"}else{githubCheck.textContent="GitHub-Prüfung gerade nicht verfügbar.";}}
  catch{githubCheck.textContent="GitHub konnte nicht erreicht werden. Später erneut versuchen."}
 },450);
});
typeSelect?.addEventListener("change", () => {
  redirectField.hidden = typeSelect.value !== "redirect";
  document.querySelector("#redirectUrl").required = typeSelect.value === "redirect";
});

async function api(payload, key = "") {
  const headers = { "Content-Type": "application/json", apikey: SUPABASE_KEY };
  if (key) headers["x-subfree-key"] = key;
  const response = await fetch(API_URL, { method: "POST", headers, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Die Anfrage ist fehlgeschlagen.");
  return data;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const payload = {
    action: "register",
    slug: String(data.get("slug") || "").trim().toLowerCase(),
    displayName: String(data.get("displayName") || "").trim(),
    githubUsername: accountType?.value === "subfree" ? "" : String(data.get("githubUsername") || "").trim().replace(/^@/, ""),
    accountType: accountType?.value || "github",
    email: String(data.get("email") || "").trim(),
    description: String(data.get("description") || "").trim(),
    siteType: String(data.get("siteType") || "static"),
    redirectUrl: String(data.get("redirectUrl") || "").trim()
  };
  if (payload.accountType === "github" && !payload.githubUsername) { message.textContent = "Bitte gib einen GitHub-Benutzernamen ein."; return; }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug) || payload.slug.length < 3 || payload.slug.length > 30) {
    message.textContent = "Der Projektname muss 3 bis 30 Zeichen lang sein und darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.";
    return;
  }
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Projekt wird registriert …";
  message.textContent = "Deine Angaben werden sicher verarbeitet.";
  try {
    const result = await api(payload);
    currentKey = result.accessKey;
    if(rememberKey?.checked){try{localStorage.setItem(localStoreKey,JSON.stringify({name:localName?.value||"",email:localEmail?.value||"",rememberKey:true,accessKey:currentKey}))}catch{}}
    keyOutput.textContent = currentKey;
    keyResult.hidden = false;
    newProjectLink.href = result.projectUrl;
    newProjectLink.textContent = result.projectUrl;
    message.textContent = result.message;
    accessInput.value = currentKey;
    form.reset();
    redirectField.hidden = true;
    keyResult.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Projekt registrieren <span aria-hidden="true">→</span>';
  }
});

const domainRequestForm=document.querySelector("#domain-request-form");
domainRequestForm?.addEventListener("submit",async(event)=>{
 event.preventDefault();
 if(!domainRequestForm.reportValidity())return;
 const data=new FormData(domainRequestForm);
 const button=domainRequestForm.querySelector("button[type=submit]");
 const message=document.querySelector("#domain-request-message");
 const resultPanel=document.querySelector("#domain-request-result");
 button.disabled=true;message.textContent="Website wird geprüft und GitHub-Pull-Request wird erstellt …";resultPanel.hidden=true;
 try{
  const result=await api({
   action:"domain_application",
   slug:String(data.get("slug")||"").trim().toLowerCase(),
   accessKey:String(data.get("accessKey")||""),
   applicantName:String(data.get("applicantName")||"").trim(),
   applicantEmail:String(data.get("applicantEmail")||"").trim(),
   websiteUrl:String(data.get("websiteUrl")||"").trim(),
   purpose:String(data.get("purpose")||"").trim(),
   termsAccepted:data.get("termsAccepted")==="on",
   termsVersion:"2026-11-07"
  });
  message.textContent=result.message;
  const link=document.querySelector("#domain-request-pr");
  link.href=result.prUrl;link.textContent="Pull-Request #"+result.prNumber+" auf GitHub öffnen ↗";
  resultPanel.hidden=false;
 }catch(error){message.textContent=error.message||"Der Antrag konnte nicht eingereicht werden.";}
 finally{button.disabled=false;}
});

copyKeyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentKey);
    copyKeyButton.textContent = "Kopiert";
  } catch {
    keyOutput.focus?.();
    message.textContent = "Bitte markiere den Zugangscode und kopiere ihn manuell.";
  }
});

document.querySelector("#load-project")?.addEventListener("click", async () => {
  const key = accessInput.value.trim();
  if (!key) { manageMessage.textContent = "Bitte gib deinen Zugangscode ein."; return; }
  if(rememberKey?.checked){try{localStorage.setItem(localStoreKey,JSON.stringify({name:localName?.value||"",email:localEmail?.value||"",rememberKey:true,accessKey:key}))}catch{}}
  manageMessage.textContent = "Projekt wird geladen …";
  try {
    const result = await api({ action: "load" }, key);
    currentKey = key;
    currentSite = result.site;
    currentFolders = result.folders || [];
    const domainActive = result.site.registration_data?.domainMode === "active";
    const domainBanner = document.querySelector("#domain-active-status");
    if(domainBanner){domainBanner.hidden=!domainActive;const domainLink=document.querySelector("#domain-active-link");if(domainLink){domainLink.href="https://subfree.pntr.dev/"+result.site.slug+"/";domainLink.textContent="https://subfree.pntr.dev/"+result.site.slug+"/ ↗";}}
    if(domainActive){
      for(const selector of ["#redirect-settings","#redirect-security-settings","#api-access","#delete-project-zone",".file-manager",".editor-actions",".deploy-notice"]) {const node=document.querySelector(selector);if(node)node.hidden=true;}
    }else{
      for(const selector of ["#api-access","#delete-project-zone",".file-manager",".editor-actions",".deploy-notice"]) {const node=document.querySelector(selector);if(node)node.hidden=false;}
    }
    document.querySelector("#offline-project").disabled=domainActive;
    document.querySelector("#publish-project").disabled=domainActive;
    const redirectPanel = document.querySelector("#redirect-settings");
    const securityPanel = document.querySelector("#redirect-security-settings");
    if(securityPanel){ securityPanel.hidden=domainActive||result.site.site_type!=="redirect"; redirectModes=result.redirectModes||defaultRedirectModes(); activeRedirectMode=result.activeRedirectMode||"direct"; document.querySelector("#redirect-mode-select").value=activeRedirectMode; applyRedirectMode(activeRedirectMode); }
    if (redirectPanel) {
      redirectPanel.hidden = domainActive || result.site.site_type !== "redirect";
      const targetInput = document.querySelector("#redirect-target");
      const targetLink = document.querySelector("#open-redirect-target");
      if (targetInput) targetInput.value = result.site.redirect_url || "";
      if (targetLink) { targetLink.href = result.site.redirect_url || "#"; targetLink.hidden = !result.site.redirect_url; }
    }

    editor.hidden = false;
    document.querySelector("#project-status").textContent = result.site.status === "active" ? "● Online" : "○ Offline";
    document.querySelector("#offline-project").disabled = result.site.status !== "active";
    document.querySelector("#offline-project").textContent = result.site.status === "active" ? "Website offline nehmen" : "Bereits offline";
    document.querySelector("#publish-project").textContent = result.site.status === "active" ? "Änderungen veröffentlichen" : "Website veröffentlichen";
    document.querySelector("#project-title").textContent = result.site.display_name;
    document.querySelector("#project-meta").textContent = (result.site.github_username && result.site.github_username !== "subfree-user" ? "@" + result.site.github_username : "SubFree-Account ohne GitHub") + " · " + result.site.slug;
    const mailShortcut=document.querySelector("#email-shortcut"); if(mailShortcut){const mail=localEmail?.value||localSettings.email||"adam_kraus@icloud.com";mailShortcut.href=mail?"mailto:"+encodeURIComponent(mail):"mailto:adam_kraus@icloud.com";mailShortcut.textContent=mail?"E-Mail an "+mail+" ↗":"Kontakt per E-Mail ↗";}
    document.querySelector("#project-url").href = "https://lordlolqdh.github.io/subfree/" + result.site.slug + "/";
    await refreshApiTokens();
    const files = result.files || [];
    renderFiles(files, currentFolders);
    const first = files.find(file => file.file_path === "index.html");
    if (first) { contentInput.value = first.content; document.querySelector("#file-private").checked = false; }
    else contentInput.value = "<!doctype html>\n<html lang=\"de\">\n<head><meta charset=\"utf-8\"><title>Meine Website</title></head>\n<body><h1>Hallo Welt!</h1></body>\n</html>";
    pathInput.value = "index.html";
    manageMessage.textContent = result.githubConfigured ? "Projekt geladen. Änderungen können veröffentlicht werden." : "Projekt geladen. Veröffentlichung wartet noch auf die GitHub-Verbindung.";
  } catch (error) {
    editor.hidden = true;
    manageMessage.textContent = error.message;
  }
});

function renderFiles(files, folders = []) {
  const list = document.querySelector("#file-list");
  list.replaceChildren();
  if (!files.length && !folders.length) { list.textContent = "Noch keine Dateien oder Ordner."; return; }
  [...folders].sort((a,b)=>a.folder_path.localeCompare(b.folder_path)).forEach(folder => {
    const row = document.createElement("div"); row.className = "file-tree-row folder-row";
    const open = document.createElement("button"); open.type = "button"; open.className = "file-item folder-item";
    open.textContent = "Ordner: " + folder.folder_path + (folder.is_private ? " · Privat" : "");
    open.addEventListener("click", () => { pathInput.value = folder.folder_path + "/"; });
    const privacy = document.createElement("button"); privacy.type = "button"; privacy.className = "file-privacy-button";
    privacy.textContent = folder.is_private ? "Privat" : "Öffentlich";
    privacy.addEventListener("click", async () => {
      try { const result = await api({action:"set_folder_privacy",path:folder.folder_path,isPrivate:!folder.is_private},currentKey);
        saveMessage.textContent = result.message; const refreshed = await api({action:"load"},currentKey);
        currentFolders = refreshed.folders || []; renderFiles(refreshed.files || [],currentFolders);
      } catch(error) { saveMessage.textContent = error.message; }
    }); row.append(open,privacy); list.append(row);
  });
  [...files].sort((a,b)=>a.file_path.localeCompare(b.file_path)).forEach(file => {
    const row = document.createElement("div"); row.className = "file-tree-row";
    const button = document.createElement("button"); button.type = "button"; button.className = "file-item";
    const depth = file.file_path.split("/").length - 1; button.style.paddingLeft = (10 + depth * 14) + "px";
    button.textContent = file.file_path + (file.is_private ? " · Privat" : ""); button.title = file.file_path;
    button.addEventListener("click", () => { pathInput.value = file.file_path; contentInput.value = file.content; document.querySelector("#file-private").checked = Boolean(file.is_private); });
    row.append(button); list.append(row);
  });
}
document.querySelector("#new-folder")?.addEventListener("click", async () => {
  const path = prompt("Ordnerpfad, z. B. assets oder privat/notizen:");
  if (!path) return;
  const isPrivate = confirm("Soll dieser Ordner privat sein? Private Ordner werden nicht veröffentlicht.");
  try { const result = await api({action:"create_folder",path:path.trim(),isPrivate},currentKey); saveMessage.textContent = result.message;
    const refreshed = await api({action:"load"},currentKey); currentFolders = refreshed.folders || []; renderFiles(refreshed.files || [],currentFolders);
  } catch(error) { saveMessage.textContent = error.message; }
});

document.querySelector("#new-file")?.addEventListener("click", () => {
  document.querySelector("#file-private").checked = false;
  pathInput.value = "assets/style.css";
  contentInput.value = "/* Deine CSS-Datei */\nbody { font-family: system-ui, sans-serif; }";
  pathInput.focus();
});

document.querySelector("#save-file")?.addEventListener("click", async () => {
  if (!currentKey) { saveMessage.textContent = "Lade zuerst dein Projekt."; return; }
  const path = pathInput.value.trim();
  if (!path) { saveMessage.textContent = "Bitte gib einen Dateipfad ein."; return; }
  const button = document.querySelector("#save-file");
  button.disabled = true;
  saveMessage.textContent = "Datei wird gespeichert …";
  try {
    const result = await api({ action: "save_file", path, content: contentInput.value, isPrivate: document.querySelector("#file-private").checked }, currentKey);
    saveMessage.textContent = result.message;
    const refreshed = await api({ action: "load" }, currentKey);
    currentFolders = refreshed.folders || []; renderFiles(refreshed.files || [], currentFolders);
  } catch (error) {
    saveMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#offline-project")?.addEventListener("click", async () => {
  if (!currentKey || !confirm("Deine Website wird öffentlich nicht mehr erreichbar sein. Private Dateien bleiben in SubFree gespeichert. Fortfahren?")) return;
  const button = document.querySelector("#offline-project"); button.disabled = true; saveMessage.textContent = "Website wird offline genommen …";
  try { const result = await api({action:"offline"},currentKey); saveMessage.textContent = result.message;
    document.querySelector("#project-status").textContent = "○ Offline"; document.querySelector("#publish-project").textContent = "Website veröffentlichen"; button.textContent = "Bereits offline";
  } catch(error) { saveMessage.textContent = error.message; button.disabled = false; }
});

document.querySelector("#publish-project")?.addEventListener("click", async () => {
  if (!currentKey) { saveMessage.textContent = "Lade zuerst dein Projekt."; return; }
  const button = document.querySelector("#publish-project");
  button.disabled = true;
  saveMessage.textContent = "Projekt wird veröffentlicht …";
  try {
    const result = await api({ action: "publish" }, currentKey);
    saveMessage.textContent = result.message + " " + (result.projectUrl || "") + " Die Bereitstellung kann kurz dauern.";
    document.querySelector("#project-status").textContent = "● Online"; document.querySelector("#offline-project").disabled = false;
    document.querySelector("#offline-project").textContent = "Website offline nehmen"; document.querySelector("#publish-project").textContent = "Änderungen veröffentlichen";
  } catch (error) {
    saveMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});


/* Temporäre PNTR-E-Mail-Adressen */
const tempMailName = document.querySelector("#temp-mail-name");
const tempMailResult = document.querySelector("#temp-mail-result");
const tempMailCopy = document.querySelector("#copy-temp-mail");
function getTempMailAddress() {
  const name = (tempMailName?.value || "deinname").trim().toLowerCase().replace(/[^a-z0-9._+-]/g, "").replace(/^\.+|\.+$/g, "") || "deinname";
  return name + "@temp-admin-001.pntr.dev";
}
tempMailName?.addEventListener("input", () => {
  if (tempMailResult) tempMailResult.textContent = getTempMailAddress();
  if (tempMailCopy) tempMailCopy.textContent = "E-Mail-Adresse kopieren";
});
tempMailCopy?.addEventListener("click", async () => {
  const address = getTempMailAddress();
  try {
    await navigator.clipboard.writeText(address);
    tempMailCopy.textContent = "Adresse kopiert";
  } catch {
    if (tempMailResult) tempMailResult.textContent = address + " (bitte manuell kopieren)";
  }
});


/* PUBLIC GITHUB PAGES DEPLOY MONITOR */
(() => {
  const panel = document.querySelector("#deploy-status");
  if (!panel) return;
  const indicator = document.querySelector("#deploy-status-indicator");
  const label = document.querySelector("#deploy-status-label");
  const detail = document.querySelector("#deploy-status-detail");
  const checkedAt = document.querySelector("#deploy-checked-at");
  const updatedAt = document.querySelector("#deploy-updated-at");
  const runLink = document.querySelector("#deploy-run-link");
  const workflowUrl = "https://api.github.com/repos/LordLOLQDH/subfree/actions/workflows/pages.yml/runs?per_page=1";
  const siteUrl = location.origin + location.pathname;
  const timeText = value => value ? new Date(value).toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"}) : "Noch kein Deployment";
  const setState = (state, title, message) => {
    indicator.dataset.state = state;
    label.textContent = title;
    detail.textContent = message;
    checkedAt.textContent = new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  };
  async function checkDeployment() {
    try {
      const response = await fetch(workflowUrl,{headers:{Accept:"application/vnd.github+json"},cache:"no-store"});
      if (!response.ok) throw new Error("GitHub Actions ist gerade nicht erreichbar (HTTP "+response.status+").");
      const data = await response.json();
      const run = data.workflow_runs?.[0];
      if (run) {
        updatedAt.textContent = timeText(run.updated_at || run.created_at);
        runLink.href = run.html_url || "https://github.com/LordLOLQDH/subfree/actions";
        if (run.status !== "completed") {
          setState("deploying","WIRD VERÖFFENTLICHT","GitHub Pages baut oder veröffentlicht gerade die aktuelle Version.");
          return;
        }
        if (run.conclusion !== "success") {
          setState("error","DEPLOY FEHLGESCHLAGEN","Das letzte Deployment wurde nicht erfolgreich abgeschlossen. Details stehen im GitHub-Actions-Protokoll.");
          return;
        }
      } else {
        updatedAt.textContent = "Noch kein Deployment gefunden";
      }
      const live = await fetch(siteUrl,{method:"HEAD",cache:"no-store"});
      if (live.ok) setState("online","WEBSITE ONLINE","Das letzte Deployment war erfolgreich und diese Website antwortet aktuell mit HTTP "+live.status+".");
      else setState("error","WEBSITE NICHT ERREICHBAR","GitHub Pages meldet HTTP "+live.status+". Die Website ist möglicherweise noch nicht verfügbar.");
    } catch (error) {
      setState("checking","STATUS NICHT VERFÜGBAR",error.message || "Der Live-Status konnte gerade nicht abgefragt werden.");
    }
  }
  checkDeployment();
  window.setInterval(checkDeployment,45000);
})();

async function refreshApiTokens(){
 const list=document.querySelector("#api-token-list"); if(!list||!currentKey)return;
 try{
  const result=await api({action:"list_api_tokens"},currentKey); list.replaceChildren();
  const heading=document.createElement("strong");heading.textContent="API-Schlüssel";list.append(heading);
  if(!result.tokens?.length){const empty=document.createElement("p");empty.textContent="Noch keine API-Schlüssel erstellt.";list.append(empty);return;}
  result.tokens.forEach(token=>{
   const row=document.createElement("div");row.className="api-token-row";
   const info=document.createElement("div");const name=document.createElement("strong");name.textContent=token.name;
   const meta=document.createElement("small");meta.textContent=token.token_prefix+"… · "+(token.revoked_at?"Widerrufen":"Aktiv")+(token.last_used_at?" · zuletzt genutzt "+new Date(token.last_used_at).toLocaleString("de-DE"):" · noch nicht genutzt");
   info.append(name,meta);row.append(info);
   if(!token.revoked_at){const revoke=document.createElement("button");revoke.type="button";revoke.className="button button-danger button-small";revoke.textContent="Widerrufen";revoke.addEventListener("click",async()=>{
    if(!confirm("Diesen API-Schlüssel wirklich widerrufen?"))return;
    try{await api({action:"revoke_api_token",id:token.id},currentKey);await refreshApiTokens();document.querySelector("#api-token-message").textContent="API-Schlüssel widerrufen."}
    catch(error){document.querySelector("#api-token-message").textContent=error.message;}
   });row.append(revoke);}
   list.append(row);
  });
 }catch(error){list.textContent="API-Schlüssel konnten nicht geladen werden: "+error.message;}
}
document.querySelector("#create-api-token")?.addEventListener("click",async()=>{
 if(!currentKey)return;
 const button=document.querySelector("#create-api-token"),message=document.querySelector("#api-token-message");
 button.disabled=true;message.textContent="API-Schlüssel wird erstellt …";
 try{
  const result=await api({action:"create_api_token",name:document.querySelector("#api-token-name").value.trim()||"ChatGPT"},currentKey);
  document.querySelector("#api-token-value").textContent=result.token;
  document.querySelector("#api-token-result").hidden=false;
  message.textContent=result.message;
  await refreshApiTokens();
 }catch(error){message.textContent=error.message;}
 finally{button.disabled=false;}
});
document.querySelector("#copy-api-token")?.addEventListener("click",async()=>{
 const token=document.querySelector("#api-token-value").textContent;
 try{await navigator.clipboard.writeText(token);document.querySelector("#copy-api-token").textContent="Kopiert";}
 catch{document.querySelector("#api-token-message").textContent="Bitte den Schlüssel manuell markieren und kopieren.";}
});

let activeRedirectMode="direct";let redirectModes=null;
function defaultRedirectModes(){return {direct:{checkStatus:true,checkHeaders:true,checkRedirect:true,requireDomainAck:true,requireExternalAck:true},simple:{checkStatus:true,checkHeaders:false,checkRedirect:false,requireDomainAck:true,requireExternalAck:false},secure:{checkStatus:true,checkHeaders:true,checkRedirect:true,requireDomainAck:true,requireExternalAck:false},strict:{checkStatus:true,checkHeaders:true,checkRedirect:true,requireDomainAck:true,requireExternalAck:true}};}
const redirectModeDescriptions={direct:"Bisheriges SubFree-Verhalten: technische Prüfungen und manuelle Bestätigung.",simple:"HTTP-Status prüfen und Zieldomain mit einer Bestätigung anzeigen.",secure:"Status, Sicherheitsheader und Server-Weiterleitungen prüfen; Zieldomain bestätigen.",strict:"Alle verfügbaren Prüfungen und beide ausdrücklichen Besucherbestätigungen."};
function readRedirectModeSettings(){return {checkStatus:document.querySelector("#sec-check-status").checked,checkHeaders:document.querySelector("#sec-check-headers").checked,checkRedirect:document.querySelector("#sec-check-redirect").checked,requireDomainAck:document.querySelector("#sec-domain-ack").checked,requireExternalAck:document.querySelector("#sec-external-ack").checked};}
function applyRedirectMode(mode){const cfg=redirectModes?.[mode]||defaultRedirectModes()[mode]||defaultRedirectModes().direct;for(const [id,key] of [["sec-check-status","checkStatus"],["sec-check-headers","checkHeaders"],["sec-check-redirect","checkRedirect"],["sec-domain-ack","requireDomainAck"],["sec-external-ack","requireExternalAck"]])document.querySelector("#"+id).checked=cfg[key]!==false;document.querySelector("#redirect-mode-description").textContent=redirectModeDescriptions[mode]||"";}
async function saveRedirectModes(){if(!currentKey||!currentSite||currentSite.site_type!=="redirect")return false;const button=document.querySelector("#save-redirect-security"),message=document.querySelector("#redirect-security-message");redirectModes[activeRedirectMode]=readRedirectModeSettings();button.disabled=true;message.textContent="Modus-Einstellungen werden gespeichert …";try{const result=await api({action:"update_redirect_modes",activeMode:activeRedirectMode,modes:redirectModes},currentKey);message.textContent=result.message;return true;}catch(error){message.textContent="Speichern fehlgeschlagen: "+error.message;return false;}finally{button.disabled=false;}}
document.querySelector("#save-redirect-target")?.addEventListener("click",async()=>{
 if(!currentKey||!currentSite||currentSite.site_type!=="redirect")return;
 const input=document.querySelector("#redirect-target"),button=document.querySelector("#save-redirect-target"),message=document.querySelector("#redirect-settings-message");
 const target=input.value.trim();
 let parsed;try{parsed=new URL(target)}catch{message.textContent="Bitte gib eine gültige HTTPS-Adresse ein.";return;}
 if(parsed.protocol!=="https:"||parsed.username||parsed.password||(parsed.port&&parsed.port!=="443")){message.textContent="Nur gültige HTTPS-Adressen auf Port 443 sind erlaubt.";return;}
 button.disabled=true;message.textContent="Weiterleitungsziel wird gespeichert …";
 try{
  const result=await api({action:"update_redirect",redirectUrl:target},currentKey);
  currentSite.redirect_url=result.redirectUrl;
  input.value=result.redirectUrl;
  const link=document.querySelector("#open-redirect-target");link.href=result.redirectUrl;link.hidden=false;
  message.textContent=result.message;
  saveMessage.textContent="Weiterleitungsziel aktualisiert. Die öffentliche Seite verwendet ab jetzt die neue Adresse.";
 }catch(error){message.textContent="Speichern fehlgeschlagen: "+error.message;}
 finally{button.disabled=false;}
});
document.querySelector("#delete-project")?.addEventListener("click",async()=>{
 if(!currentKey||!currentSite)return;
 if(!confirm("ACHTUNG: Das Projekt und alle gespeicherten Daten werden endgültig gelöscht."))return;
 const typed=prompt("Zur Bestätigung bitte den Projektnamen eingeben: "+currentSite.slug);
 if(typed!==currentSite.slug){document.querySelector("#delete-project-message").textContent="Löschung abgebrochen. Der Projektname stimmte nicht überein.";return;}
 const button=document.querySelector("#delete-project"),message=document.querySelector("#delete-project-message");
 button.disabled=true;message.textContent="Projekt und Daten werden gelöscht …";
 try{
  const deletedKey=currentKey;const result=await api({action:"delete_project"},currentKey);
  editor.hidden=true;currentKey="";currentSite=null;currentFolders=[];
  accessInput.value="";
  try{const settings=JSON.parse(localStorage.getItem(localStoreKey)||"{}");if(settings.accessKey===deletedKey){settings.accessKey="";settings.rememberKey=false;localStorage.setItem(localStoreKey,JSON.stringify(settings));}}catch{}
  message.textContent=result.message;manageMessage.textContent="Projekt gelöscht. Du kannst jetzt ein neues Projekt registrieren.";
 }catch(error){message.textContent="Löschung fehlgeschlagen: "+error.message;}
 finally{button.disabled=false;}
});

document.querySelector("#redirect-mode-select")?.addEventListener("change",async(event)=>{
 const previousMode=activeRedirectMode;
 if(redirectModes?.[previousMode])redirectModes[previousMode]=readRedirectModeSettings();
 activeRedirectMode=event.target.value;
 applyRedirectMode(activeRedirectMode);
 const saved=await saveRedirectModes();
 if(!saved){activeRedirectMode=previousMode;event.target.value=previousMode;applyRedirectMode(previousMode);}
});
for(const id of ["sec-check-status","sec-check-headers","sec-check-redirect","sec-domain-ack","sec-external-ack"])document.querySelector("#"+id)?.addEventListener("change",()=>{if(redirectModes?.[activeRedirectMode])redirectModes[activeRedirectMode]=readRedirectModeSettings();});
document.querySelector("#save-redirect-security")?.addEventListener("click",saveRedirectModes);

