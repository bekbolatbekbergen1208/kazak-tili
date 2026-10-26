"use client";
import { useState } from "react";
import type { Result } from "@/lib/q-level/types";
import { resultDocument } from "@/lib/q-level/report";
export function ReportDownload({ result }: { result: Result }) {
  const [message, setMessage] = useState("");
  function download() {
    const url = URL.createObjectURL(new Blob([resultDocument(result)], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `Q-Level-${result.date.slice(0,10)}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage("Құжат сақталды. Оны браузерде ашып, Басып шығару → PDF ретінде сақтау таңдауға болады.");
  }
  return <div className="ql-panel"><button className="btn primary" onClick={download}>Нәтижені құжат ретінде сақтау</button><p>Деңгей, ұпай, дағдылар және ұсыныстар бір құжатқа жиналады.</p><p role="status">{message}</p></div>;
}
