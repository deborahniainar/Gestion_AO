import React, { useState, useEffect, useRef } from 'react';
import { Close, Save, Description, Refresh, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { Editor } from '@tinymce/tinymce-react';
import { soumissionsWorkspacesAPI } from '../services/api';
import { NotificationService } from '../services/notifications';

const OnlyOfficeWorkspaceModal = ({ isOpen, onClose, sousTache, lot, appelOffre }) => {
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [title, setTitle] = useState(sousTache?.titre || '');
  const editorRef = useRef(null);
  // store remote content until editor is ready to avoid race conditions
  const [fetchedContent, setFetchedContent] = useState(null);
  // file input ref for importing .docx
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && sousTache && lot) {
      setTitle(sousTache.titre || '');
      loadContent();
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = 'unset'; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sousTache, lot]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data } = await soumissionsWorkspacesAPI.getSubtask(lot, sousTache.id, appelOffre);
      if (data) {
        const content = data.content_html || '';
        // save fetched content in state; if editor is ready, set it immediately
        setFetchedContent(content);
        if (editorRef.current) editorRef.current.setContent(content);
      }
    } catch (err) {
      console.error(err);
      NotificationService.error('Impossible de charger le contenu');
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      await saveContent();
      onClose && onClose();
    } catch (e) {
      console.error(e);
      NotificationService.error('Erreur lors de la sauvegarde');
    }
  };

  // save content without closing modal
  const saveContent = async () => {
    const content = editorRef.current ? editorRef.current.getContent() : (fetchedContent || '');
    await soumissionsWorkspacesAPI.saveSubtask(lot, sousTache.id, { title: title || sousTache.titre, content_html: content }, appelOffre);
    NotificationService.success('Document sauvegardé');
  };

  const handleExportSubtask = async () => {
    try {
      // ensure latest content is saved before export
      await saveContent();
      // fetch subtask to confirm content_html is persisted
      const subRes = await soumissionsWorkspacesAPI.getSubtask(lot, sousTache.id, appelOffre);
      const contentHtml = subRes?.data?.content_html || '';
      if (!contentHtml || !String(contentHtml).trim()) {
        NotificationService.error("Le contenu de l'éditeur est vide ou non enregistré. Sauvegardez avant d'exporter.");
        return;
      }
      const res = await soumissionsWorkspacesAPI.getSubtaskDocx(lot, sousTache.id, appelOffre);
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers['content-disposition'] || '';
      let filename = `subtask_${sousTache.id}.docx`;
      const m = disposition.match(/filename\*?=([^;]+)/);
      if (m && m[1]) filename = decodeURIComponent(m[1].replace(/UTF-8''/, '').replace(/"/g, ''));
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      NotificationService.success('DOCX téléchargé');
    } catch (err) {
      console.error(err);
      NotificationService.error('Erreur export DOCX');
    }
  };

  const toggleFullscreen = () => setIsFullscreen(v => !v);

  if (!isOpen || !sousTache) return null;

  const handleCloseRequest = async () => {
    // attempt to save current content before closing
    try {
      await handleSave();
    } catch (e) {
      // save failed, still close to avoid blocking UI; user will see error notification
      if (onClose) onClose();
    }
  };

  const modalClasses = isFullscreen ? 'fixed inset-0 bg-white z-50' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  const contentClasses = isFullscreen ? 'w-full h-full flex flex-col' : 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col';

  const handleImportClick = () => {
    try {
      fileInputRef.current && fileInputRef.current.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      // dynamic import to avoid forcing dependency if not installed
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result?.value || '';
      // If editor is initialized, insert at cursor position, otherwise append to fetchedContent
      if (editorRef.current) {
        try {
          // ensure editor has focus and insert at current cursor
          editorRef.current.focus();
          if (typeof editorRef.current.insertContent === 'function') {
            editorRef.current.insertContent(html);
          } else {
            // fallback: replace (very unlikely)
            editorRef.current.setContent((editorRef.current.getContent ? editorRef.current.getContent() : '') + html);
          }
        } catch (err) {
          console.error('TinyMCE insert failed, appending instead', err);
          setFetchedContent((prev) => (prev || '') + html);
        }
      } else {
        // editor not ready yet: append to fetchedContent to avoid overwriting
        setFetchedContent((prev) => (prev || '') + html);
      }
      NotificationService.success('Document Word importé');
    } catch (err) {
      console.error(err);
      NotificationService.error('Erreur lors de l\'import du document');
    } finally {
      // reset file input
      e.target.value = '';
    }
  };

  return (
    <div className={modalClasses} onClick={(e)=>{ if(e.target === e.currentTarget && !isFullscreen) { handleCloseRequest(); } }}>
      <div className={contentClasses}>
        {/* Header de la modal */}
        <div className="flex justify-between items-center p-4 border-b bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Description className="h-6 w-6 text-blue-500" />
            <div>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} className="font-bold text-lg bg-transparent border-none outline-none" />
              <p className="text-sm text-gray-500">Lot: {lot}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-3 py-2 bg-green-500 text-white rounded"> <Save className="h-4 w-4" /> Sauvegarder</button>
            <button onClick={handleImportClick} className="px-3 py-2 bg-gray-100 rounded text-sm" title="Importer .docx">Importer .docx</button>
            <button onClick={handleExportSubtask} className="px-3 py-2 bg-white border rounded text-sm">Exporter en DOCX</button>
            <button onClick={loadContent} className="p-2 hover:bg-gray-100 rounded" title="Actualiser"> <Refresh /> </button>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 rounded" title={isFullscreen? 'Quitter plein écran' : 'Plein écran'}>{isFullscreen? <FullscreenExit/> : <Fullscreen/>}</button>
            {!isFullscreen && (<button onClick={handleCloseRequest} className="p-2 hover:bg-gray-100 rounded" title="Fermer"> <Close /> </button>)}
            <input ref={fileInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileSelected} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Contenu principal - TinyMCE Editor */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">Chargement...</div>
          ) : (
            <Editor
              onInit={(evt, editor) => {
                editorRef.current = editor;
                try {
                  if (fetchedContent !== null) {
                    editor.setContent(fetchedContent);
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              initialValue={fetchedContent ?? sousTache.content_html ?? ''}
              init={{
                height: 600,
                menubar: true,
                plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
                toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlyOfficeWorkspaceModal;