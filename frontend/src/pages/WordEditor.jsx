import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiWithNotifications } from "../services/api";

export default function WordEditor() {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [searchParams] = useSearchParams();
  const file_path = searchParams.get("path");
  const title = searchParams.get("title") || "document.docx";

  useEffect(() => {
    if (!file_path) return;
    let editor;
    (async () => {
      const { data } = await apiWithNotifications.post("/dao/onlyoffice/config", { file_path, title });
      const scriptUrl = `${data.docServerUrl}/web-apps/apps/api/documents/api.js`;
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = scriptUrl;
        s.onload = res;
        s.onerror = rej;
        document.body.appendChild(s);
      });
      const cfg = { ...data.config, token: data.token, width: "100%", height: "100%" };
      // eslint-disable-next-line no-undef
      editor = new DocsAPI.DocEditor(containerRef.current, cfg);
      setLoaded(true);
    })().catch(() => {});
    return () => {
      try { editor && editor.destroyEditor && editor.destroyEditor(); } catch {}
    };
  }, [file_path, title]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Chargement éditeur…
        </div>
      )}
    </div>
  );
}