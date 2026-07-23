import type { PerAttendeeDebrief } from "@/lib/wepacker/debrief/types";

export const SESSION_RESULT_RENDERER_VERSION = "wepac-result-v1";

const CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "connect-src 'none'",
  "img-src 'none'",
  "font-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "style-src 'unsafe-inline'",
].join("; ");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraph(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export function renderSessionResultDocument(
  attendee: PerAttendeeDebrief,
): string {
  const actions = attendee.actions
    .map(
      (action) => `<li><strong>${escapeHtml(action.title)}</strong>${
        action.description ? `<p>${paragraph(action.description)}</p>` : ""
      }${
        action.dueDate
          ? `<p class="meta">Target: ${escapeHtml(action.dueDate)}</p>`
          : ""
      }</li>`,
    )
    .join("");
  return `<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${CSP}" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Documento da Session | WEPACKER</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:Arial,sans-serif;line-height:1.6}
    main{width:min(760px,calc(100% - 48px));margin:0 auto;padding:64px 0}header{border-bottom:2px solid #111;margin-bottom:40px;padding-bottom:24px}
    .brand,.meta{color:#666;font-size:12px;letter-spacing:.08em;text-transform:uppercase}h1{font-size:34px;margin:8px 0 0}
    h2{font-size:15px;letter-spacing:.06em;margin:0 0 12px;text-transform:uppercase}section{border-bottom:1px solid #ddd;padding:0 0 28px;margin:0 0 28px}
    ol{padding-left:24px}li{margin-bottom:16px}li p{margin:4px 0}
  </style>
</head>
<body><main>
  <header><div class="brand">WEPACKER · WEPAC</div><h1>Documento da Session</h1></header>
  <section><h2>Resultado</h2><p>${paragraph(attendee.outcomeSuggestion)}</p></section>
  <section><h2>Reflexão partilhada</h2><p>${paragraph(attendee.sharedNoteSuggestion)}</p></section>
  <section><h2>Próximas ações</h2>${actions ? `<ol>${actions}</ol>` : "<p>Sem ações propostas.</p>"}</section>
  <p class="meta">Revisto e publicado pelo mentor · Confiança: ${escapeHtml(attendee.confidence)}</p>
</main></body></html>`;
}
