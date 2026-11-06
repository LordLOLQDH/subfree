const form = document.querySelector("#request-form");
const message = document.querySelector("#form-message");
const year = document.querySelector("#year");

if (year) year.textContent = new Date().getFullYear();

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const subdomain = String(data.get("subdomain") || "").trim().toLowerCase();
  const targetValue = String(data.get("target") || "").trim();
  const purpose = String(data.get("purpose") || "").trim();
  const contact = String(data.get("contact") || "").trim();

  if (!/^[a-z0-9-]{3,30}$/.test(subdomain) ||
      subdomain.startsWith("-") ||
      subdomain.endsWith("-")) {
    message.textContent = "Bitte nutze 3 bis 30 Zeichen: Kleinbuchstaben, Zahlen und Bindestriche. Der Name darf nicht mit einem Bindestrich beginnen oder enden.";
    return;
  }

  const reserved = [
    "admin", "api", "assets", "contact", "index",
    "login", "register", "registrieren", "rules"
  ];

  if (reserved.includes(subdomain)) {
    message.textContent = "Dieser Name ist reserviert. Bitte wähle einen anderen.";
    return;
  }

  let target;

  try {
    target = new URL(targetValue);
  } catch {
    message.textContent = "Bitte gib eine gültige Ziel-URL ein.";
    return;
  }

  if (target.protocol !== "https:" || target.username || target.password) {
    message.textContent = "Nur HTTPS-Ziele ohne Zugangsdaten sind erlaubt.";
    return;
  }

  const title = "DOMAIN_REG: " + subdomain;
  const body = [
    "Automatische Weiterleitungsregistrierung",
    "",
    "Wunschname: " + subdomain,
    "Ziel-URL: " + target.toString(),
    "Projektbeschreibung: " + purpose,
    "Kontakt-E-Mail: " + contact,
    "",
    "Ich bestätige, dass ich die SubFree-Nutzungsregeln gelesen habe."
  ].join("\n");

  const issueURL =
    "https://github.com/LordLOLQDH/subfree/issues/new" +
    "?title=" + encodeURIComponent(title) +
    "&body=" + encodeURIComponent(body);

  message.textContent = "GitHub wird geöffnet. Bitte prüfe deine Angaben und klicke dort auf „Create issue“. Danach übernimmt die Automatisierung.";
  window.location.assign(issueURL);
});
