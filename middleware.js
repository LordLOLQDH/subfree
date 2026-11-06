import { next } from "@vercel/functions";
import redirects from "./redirects.json" with { type: "json" };

export const config = {
  runtime: "nodejs"
};

export default function middleware(request) {
  const url = new URL(request.url);

  // Die Startseite und alle normalen Dateien bleiben unverändert.
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length !== 1) {
    return next();
  }

  let name;

  try {
    name = decodeURIComponent(segments[0]).toLowerCase();
  } catch {
    return next();
  }

  if (!/^[a-z0-9-]{3,30}$/.test(name)) {
    return next();
  }

  const destination = redirects[name];

  if (typeof destination !== "string") {
    return next();
  }

  let target;

  try {
    target = new URL(destination);
  } catch {
    return new Response("Ungültiges Weiterleitungsziel.", { status: 500 });
  }

  if (target.protocol !== "https:" || target.username || target.password) {
    return new Response("Ungültiges Weiterleitungsziel.", { status: 500 });
  }

  // Während der Einrichtung zunächst temporär, damit Browser nichts dauerhaft cachen.
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      "Cache-Control": "no-store"
    }
  });
}
