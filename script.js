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
const manageMessage = document.querySelector("#manage-message");
const editor = document.querySelector("#editor");
const pathInput = document.querySelector("#file-path");
const contentInput = document.querySelector("#file-content");
const saveMessage = document.querySelector("#save-message");
let currentKey = "";
let currentSite = null;
let currentFolders = [];

if (year) year.textContent = new Date().getFullYear();
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
    githubUsername: String(data.get("githubUsername") || "").trim().replace(/^@/, ""),
    email: String(data.get("email") || "").trim(),
    description: String(data.get("description") || "").trim(),
    siteType: String(data.get("siteType") || "static"),
    redirectUrl: String(data.get("redirectUrl") || "").trim()
  };
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
  manageMessage.textContent = "Projekt wird geladen …";
  try {
    const result = await api({ action: "load" }, key);
    currentKey = key;
    currentSite = result.site;
    currentFolders = result.folders || [];
    editor.hidden = false;
    document.querySelector("#project-status").textContent = result.site.status === "active" ? "● Online" : "○ Offline";
    document.querySelector("#offline-project").disabled = result.site.status !== "active";
    document.querySelector("#offline-project").textContent = result.site.status === "active" ? "Website offline nehmen" : "Bereits offline";
    document.querySelector("#publish-project").textContent = result.site.status === "active" ? "Änderungen veröffentlichen" : "Website veröffentlichen";
    document.querySelector("#project-title").textContent = result.site.display_name;
    document.querySelector("#project-meta").textContent = "@" + result.site.github_username + " · " + result.site.slug;
    document.querySelector("#project-url").href = "https://lordlolqdh.github.io/subfree/" + result.site.slug + "/";
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
