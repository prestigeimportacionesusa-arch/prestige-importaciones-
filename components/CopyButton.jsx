"use client";

import { useState } from "react";

// Botón para copiar texto (por ejemplo, los datos de envío para la guía de
// la transportadora) con un solo clic.
export default function CopyButton({ text, label = "Copiar" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
      {copied ? "✓ Copiado" : label}
    </button>
  );
}
