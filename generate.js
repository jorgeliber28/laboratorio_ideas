// generate.js — Genera ideas frescas con Claude y las guarda en ideas.json
// La API key llega por variable de entorno (secreto de GitHub), NUNCA escrita aquí.

const fs = require("fs");

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("Falta ANTHROPIC_API_KEY"); process.exit(1); }

const TIPOS = ["politica", "programa", "accion", "app", "web", "script", "internacional"];
const EMOJI = { politica: "🌿", programa: "🟩", accion: "⚡", app: "📱", web: "📊", script: "⚙️", internacional: "🌍" };

const sys = `Eres asesor senior en política pública ambiental y planeación territorial para la SEDEMA de la Ciudad de México (unidad TIMOG).
Genera EXACTAMENTE 6 iniciativas NUEVAS, concretas y NO genéricas, variando el tipo, para inspirar proyectos.
Temas de interés: biodiversidad urbana, restauración ecológica, arbolado urbano, infraestructura verde, SIG/datos, gobernanza, ciencia ciudadana, automatización en Sheets, dashboards.
Tipos válidos: politica, programa, accion, app, web, script, internacional.
Si el tipo es "internacional", usa un caso REAL y verificable, con su ciudad y país en "ref".
Responde SOLO con JSON válido, sin markdown ni texto extra, con esta forma:
{"items":[{"tipo":"","titulo":"","exp":"1 frase","porque":"por qué le interesa a un asesor de SEDEMA","innov":3,"dif":3,"imp":4,"ref":"ciudad, país (solo internacional; si no, '—')","tech":"herramientas","cdmx":"aplicación concreta en CDMX","arranque":"primer paso","tags":["",""]}]}`;

(async () => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // el más económico
      max_tokens: 1500,
      system: sys,
      messages: [{ role: "user", content: "Genera la tanda de esta semana. Sorpréndeme con variedad de tipos y temas." }],
    }),
  });

  if (!r.ok) { console.error("Error de API:", r.status, await r.text()); process.exit(1); }

  const data = await r.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");

  let parsed;
  try { parsed = JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch (e) { console.error("No se pudo parsear el JSON:", text); process.exit(1); }

  const items = (parsed.items || []).map((it, i) => {
    const tipo = TIPOS.includes(it.tipo) ? it.tipo : "programa";
    const ref = it.ref || "—";
    return {
      id: "ai-" + Date.now() + "-" + i,
      tipo, emoji: EMOJI[tipo],
      titulo: it.titulo || "Idea", exp: it.exp || "", porque: it.porque || "",
      innov: Number(it.innov) || 3, dif: Number(it.dif) || 3, imp: Number(it.imp) || 4,
      ref, tech: it.tech || "", cdmx: it.cdmx || "", arranque: it.arranque || "",
      tags: Array.isArray(it.tags) ? it.tags : [],
      img: (tipo === "internacional" && ref !== "—")
        ? "https://loremflickr.com/640/280/" + encodeURIComponent(ref.split(",")[0].trim().toLowerCase()) + ",city?lock=" + (10 + i)
        : undefined,
    };
  });

  fs.writeFileSync("ideas.json", JSON.stringify({ generado: new Date().toISOString(), items }, null, 2));
  console.log("OK:", items.length, "ideas escritas en ideas.json");
})();
