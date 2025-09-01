import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import { apiWithNotifications, soumissionsWorkspacesAPI } from "../services/api";

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || "";

export default function WordEditor() {
  const editorRef = useRef(null);
  const [searchParams] = useSearchParams();
  const documentId = Number(searchParams.get("document_id"));
  const title = searchParams.get("title") || "document.docx";
  const lot = searchParams.get("lot") || "";
  const appelOffre = searchParams.get("ao") || "";
  const subtaskId = searchParams.get("sub_id") || "";
  const [saving, setSaving] = useState(false);
  const [initialContent, setInitialContent] = useState("");

  // Charger contenu existant si lot/sub_id fournis
  useEffect(() => {
    (async () => {
      if (!lot || !subtaskId) return;
      try {
        const { data } = await soumissionsWorkspacesAPI.getSubtask(lot, subtaskId, appelOffre);
        const md = data?.content_markdown || "";
        // markdown très simple -> HTML basique
        const html = md.split("\n").map(line => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join("");
        setInitialContent(html);
      } catch (_) {}
    })();
  }, [lot, subtaskId, appelOffre]);

  const handleSaveDocx = useCallback(async () => {
    if (!editorRef.current || !documentId) return;
    try {
      setSaving(true);
      const html = editorRef.current.getContent({ format: "html" });
      // Minimal HTML -> plain text/markdown-ish conversion
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      // Replace <br> with newlines to preserve simple formatting
      tmp.querySelectorAll("br").forEach(br => (br.outerHTML = "\n"));
      // Convert block elements to line breaks
      const blockTags = ["p", "div", "section", "article", "h1", "h2", "h3", "h4", "h5", "h6", "li"];
      blockTags.forEach(tag => {
        tmp.querySelectorAll(tag).forEach(el => {
          if (!el.textContent) return;
          if (!el.textContent.endsWith("\n")) el.textContent += "\n";
        });
      });
      const content = tmp.textContent || "";

      const { data } = await apiWithNotifications.post("/dao/generate_docx", {
        document_id: documentId,
        content_markdown: `# ${title}\n\n${content}`,
      });
      if (data?.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } finally {
      setSaving(false);
    }
  }, [documentId, title]);

  const handleSaveToWorkspace = useCallback(async () => {
    if (!editorRef.current || !lot || !subtaskId) return;
    try {
      setSaving(true);
      const html = editorRef.current.getContent({ format: "html" });
      // Simple HTML -> markdown-ish
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      tmp.querySelectorAll("br").forEach(br => (br.outerHTML = "\n"));
      const blockTags = ["p", "div", "section", "article", "h1", "h2", "h3", "h4", "h5", "h6", "li"]; 
      blockTags.forEach(tag => {
        tmp.querySelectorAll(tag).forEach(el => {
          if (!el.textContent) return;
          if (!el.textContent.endsWith("\n")) el.textContent += "\n";
        });
      });
      const content = tmp.textContent || "";
      await soumissionsWorkspacesAPI.saveSubtask(lot, subtaskId, { title, content_markdown: content }, appelOffre);
    } finally {
      setSaving(false);
    }
  }, [lot, subtaskId, appelOffre, title]);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ padding: 8, borderBottom: "1px solid #eee", display: "flex", gap: 8 }}>
        <button onClick={() => history.back()} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6 }}>
          Retour
        </button>
        <button onClick={handleSaveDocx} disabled={!documentId || saving} style={{ padding: "6px 10px", border: "1px solid #0a7", background: "#0a7", color: "#fff", borderRadius: 6 }}>
          {saving ? "Enregistrement…" : "Enregistrer en DOCX"}
        </button>
        <button onClick={handleSaveToWorkspace} disabled={!lot || !subtaskId || saving} style={{ padding: "6px 10px", border: "1px solid #07a", background: "#07a", color: "#fff", borderRadius: 6 }}>
          {saving ? "Enregistrement…" : "Enregistrer dans le workspace"}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          apiKey={TINYMCE_API_KEY}
          onInit={(_, editor) => (editorRef.current = editor)}
          initialValue={initialContent}
          init={{
            height: "100%",
            menubar: true,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "image",
              "charmap",
              "preview",
              "anchor",
              "searchreplace",
              "visualblocks",
              "code",
              "fullscreen",
              "insertdatetime",
              "media",
              "table",
              "help",
              "wordcount",
            ],
            toolbar:
              "undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table | code | help",
            content_style: "body { font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; font-size:14px }",
          }}
        />
      </div>
    </div>
  );
}