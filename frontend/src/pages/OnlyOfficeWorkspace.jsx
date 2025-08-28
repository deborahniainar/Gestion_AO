import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { soumissionsWorkspacesAPI } from '../services/api';
import { NotificationService } from '../services/notifications';

// This page embeds OnlyOffice using Docs API config + JWT (signed server-side).
// It expects query params: lot, subId, appelOffre

const OnlyOfficeWorkspace = () => {
  const [searchParams] = useSearchParams();
  const lot = searchParams.get('lot');
  const subId = searchParams.get('subId');
  const appelOffre = searchParams.get('appelOffre');
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!lot || !subId) {
      NotificationService.error('Paramètres manquants pour OnlyOffice');
      navigate('/soumissions');
      return;
    }
    (async () => {
      try {
        const res = await soumissionsWorkspacesAPI.getOnlyOfficeConfig(lot, subId, appelOffre);
        const data = res.data || {};
        const url = data.url;
        if (url) {
          if (iframeRef.current) {
            iframeRef.current.src = url;
          } else {
            window.location.href = url;
          }
        } else {
          NotificationService.error('Configuration OnlyOffice indisponible');
          navigate('/soumissions');
        }
      } catch {
        NotificationService.error("Impossible d'initialiser OnlyOffice");
        navigate('/soumissions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lot, subId, appelOffre, navigate]);

  return (
    <div className="min-h-screen bg-muted p-4">
      <h3 className="text-lg font-semibold mb-4">Éditeur OnlyOffice</h3>
      {loading && <p>Chargement de l'éditeur...</p>}
      <div className="border rounded-md overflow-hidden h-[80vh]">
        <iframe ref={iframeRef} title="OnlyOffice Editor" className="w-full h-full border-0" />
      </div>
    </div>
  );
};

export default OnlyOfficeWorkspace;
