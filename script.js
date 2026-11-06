const form = document.querySelector("#request-form");
const message = document.querySelector("#form-message");
const year = document.querySelector("#year");

if (year) year.textContent = new Date().getFullYear();

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const subdomain = String(data.get("subdomain") || "").trim().toLowerCase();
  const target = String(data.get("target") || "").trim();
  const purpose = String(data.get("purpose") || "").trim();
  const contact = String(data.get("contact") || "").trim();

  if (!/^[a-z0-9-]{3,30}$/.test(subdomain) || subdomain.startsWith("-") || subdomain.endsWith("-")) {
    message.textContent = "Bitte nutze 3 bis 30 Zeichen: Kleinbuchstaben, Zahlen und Bindestriche. Der Name darf nicht mit einem Bindestrich beginnen oder enden.";
    return;
  }

  const subject = encodeURIComponent("SubFree-Anfrage: " + subdomain);
  const body = encodeURIComponent(
    "Hallo SubFree-Team,\n\n" +
    "ich möchte folgende Subdomain anfragen: " + subdomain + ".subfree.is-a.dev\n" +
    "Zieladresse: " + target + "\n" +
    "Projektbeschreibung: " + purpose + "\n" +
    "Kontakt-E-Mail: " + contact + "\n\n" +
    "Ich bestätige, dass ich die Nutzungsregeln gelesen habe.\n"
  );

  message.textContent = "Dein E-Mail-Programm wird geöffnet. Die Anfrage gilt erst als versendet, wenn du die E-Mail selbst abschickst.";
  window.location.href = "mailto:adam_kraus@icloud.com?subject=" + subject + "&body=" + body;
});