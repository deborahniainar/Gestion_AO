import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { soumissionsWorkspacesAPI } from '../services/api';
import { NotificationService } from '../services/notifications';
import { Editor } from '@tinymce/tinymce-react';

const OnlyOfficeWorkspace = () => {
  const [searchParams] = useSearchParams();
  const lot = searchParams.get('lot');
  const subId = searchParams.get('subId');
  const appelOffre = searchParams.get('appelOffre');
  const editorRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!lot || !subId) {
      NotificationService.error('Paramètres manquants');
      navigate('/soumissions');
      return;
    }
    (async () => {
      try {
        const res = await soumissionsWorkspacesAPI.getSubtask(lot, subId, appelOffre);
        const data = res.data || {};
        if (data) {
          setTitle(data.title || '');
          if (editorRef.current) editorRef.current.setContent(data.content_html || '');
        }
      } catch (e) {
        console.error(e);
        NotificationService.error('Impossible d\'initialiser l\'éditeur');
        navigate('/soumissions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lot, subId, appelOffre, navigate]);

  const handleSave = async () => {
    try {
      const content = editorRef.current ? editorRef.current.getContent() : '';
      await soumissionsWorkspacesAPI.saveSubtask(lot, subId, { title, content_html: content }, appelOffre);
      NotificationService.success('Enregistré');
      navigate('/soumissions');
    } catch (e) {
      console.error(e);
      NotificationService.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="min-h-screen bg-muted p-4">
      <h3 className="text-lg font-semibold mb-4">Éditeur de document (TinyMCE)</h3>
      {loading ? <p>Chargement...</p> : (
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="text-lg font-bold bg-transparent border-none outline-none" />
            <div className="flex gap-2">
              <button onClick={handleSave} className="px-3 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
            </div>
          </div>
          <div>
            <Editor
              onInit={(evt, editor)=> editorRef.current = editor}
              initialValue={''}
              init={{
                height: 600,
                menubar: true,
                plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
                toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlyOfficeWorkspace;
