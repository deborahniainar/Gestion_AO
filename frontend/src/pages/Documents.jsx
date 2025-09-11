import React, { useRef, useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import ConfirmModal from '../components/ConfirmModal'
import useNotifications from '../hooks/useNotifications'
import { documentsAPI, buildUploadUrl } from '../services/api'
import {
  CloudDownload,
  Help,
  Add,
  Description,
  Edit,
  Delete
} from "@mui/icons-material";
import DocumentViewer from '../components/DocumentViewer'

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', expiry: '' });
  // IDs des documents créés via cette page (persistés en localStorage)
  const [uploadedHereIds, setUploadedHereIds] = useState(new Set());

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', expiry: '', file: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, doc: null });
  const addFileRef = useRef(null);
  const previewObjectUrlRef = useRef(null);

  const {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showCreateSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showDownloadSuccess,
    showLoading,
    updateLoading
  } = useNotifications();

  const openAdd = () => {
    setIsAddOpen(true);
    showInfo("Formulaire d'ajout ouvert");
  };

  const closeAdd = () => {
    setIsAddOpen(false);
    setAddForm({ name: '', expiry: '', file: null });
    if (addFileRef.current) addFileRef.current.value = '';
  };

  const getMimeForFilename = (name) => {
    if (!name) return 'application/octet-stream';
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'svg') return 'image/svg+xml';
    if (['doc', 'docx'].includes(ext)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (['xls', 'xlsx'].includes(ext)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/octet-stream';
  };

  const handleOpenDocumentModal = async (doc) => {
    if (!doc) return;
    const normalized = { ...doc };
    if (!normalized.original_filename && (normalized.original_name || normalized.originalName)) {
      normalized.original_filename = normalized.original_name || normalized.originalName;
    }
    if (!normalized.filename && normalized.original_filename) normalized.filename = normalized.original_filename;

    // If we already have a usable URL (public static path), use it
    if (normalized.url && (normalized.url.startsWith('http') || normalized.url.startsWith('/'))) {
      setCurrentDocument(normalized);
      setShowDocumentModal(true);
      return;
    }

    // If filename stores a path under uploads, treat it as URL
    if (!normalized.url && typeof normalized.filename === 'string' && normalized.filename.includes('/uploads/')) {
      normalized.url = buildUploadUrl(normalized.filename);
      setCurrentDocument(normalized);
      setShowDocumentModal(true);
      return;
    }

    // Otherwise fetch authenticated blob and create object URL with proper MIME
    if (normalized.id) {
      const loadingToast = showLoading("Chargement de l'aperçu...");
      try {
        const response = await documentsAPI.download(normalized.id);
        // response.data is a blob (axios configured). Determine MIME: prefer header, fallback to filename
        const headerType = response.headers && response.headers['content-type'];
        const mime = headerType || getMimeForFilename(normalized.original_filename || normalized.filename);
        const blob = new Blob([response.data], { type: mime });
        const objectUrl = window.URL.createObjectURL(blob);

        // revoke previous
        if (previewObjectUrlRef.current) {
          try { window.URL.revokeObjectURL(previewObjectUrlRef.current); } catch { /* ignore */ }
        }
        previewObjectUrlRef.current = objectUrl;
        normalized.url = objectUrl;
        setCurrentDocument(normalized);
        setShowDocumentModal(true);
        updateLoading(loadingToast, 'Aperçu prêt', 'success');
      } catch (err) {
        console.error('Erreur lors du chargement de l\'aperçu', err);
        updateLoading(loadingToast, "Impossible de charger l'aperçu", 'error');
        showError(err.response?.data?.detail || "Impossible de charger l'aperçu (auth requise)");
      }
      return;
    }

    // Fallback
    setCurrentDocument(normalized);
    setShowDocumentModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setCurrentDocument(null);
    if (previewObjectUrlRef.current) {
      try { window.URL.revokeObjectURL(previewObjectUrlRef.current); } catch { /* ignore */ }
      previewObjectUrlRef.current = null;
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        try { window.URL.revokeObjectURL(previewObjectUrlRef.current); } catch { /* ignore */ }
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleAddFileChange = (e) => {
    const f = (e.target.files && e.target.files[0]) || null;
    if (f) {
      setAddForm((prev) => ({ ...prev, file: f }));
      showSuccess(`Fichier "${f.name}" sélectionné`);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!addForm.file || !addForm.name.trim()) {
      showError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    // Exiger la date d'expiration
    if (!addForm.expiry) {
      showError("La date d'expiration est obligatoire");
      return;
    }

    const loadingToast = showLoading("Création du document en cours...");
    try {
      const formData = new FormData();
      formData.append('file', addForm.file);
      formData.append('name', addForm.name.trim());
      if (addForm.expiry) {
        formData.append('expiry', addForm.expiry);
      }
      const response = await documentsAPI.create(formData);
      const newDoc = response.data;

      setDocuments((prev) => [newDoc, ...prev]);

      // Marquer comme créé via cette page (persisté)
      try {
        setUploadedHereIds((prev) => {
          const next = new Set(prev);
          if (newDoc && newDoc.id) next.add(newDoc.id);
          try {
            localStorage.setItem('documents:uploaded_here', JSON.stringify(Array.from(next)));
          } catch {
            // ignore localStorage errors
          }
          return next;
        });
      } catch (e) {
        console.error('Erreur lors du marquage du document comme uploadé ici', e);
      }

      closeAdd();
      updateLoading(loadingToast, "Document créé avec succès", "success");
      showCreateSuccess();
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      updateLoading(loadingToast, "Erreur lors de la création", "error");
      showError(error.response?.data?.detail || "Erreur lors de la création du document");
    }
  };

  const handleDownload = async (doc) => {
    if (!doc?.id) {
      showError("Document non disponible");
      return;
    }

    const loadingToast = showLoading("Téléchargement en cours...");

    try {
      const response = await documentsAPI.download(doc.id);

      // Créer un blob et un lien de téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_name || doc.original_filename || `document_${doc.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      updateLoading(loadingToast, "Téléchargement réussi", "success");
      showDownloadSuccess();
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      updateLoading(loadingToast, "Erreur lors du téléchargement", "error");
      showError(error.response?.data?.detail || "Erreur lors du téléchargement");
    }
  };

  const handleDelete = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
      showError("Document non trouvé");
      return;
    }

    // Ouvrir le modal de confirmation
    setConfirmDelete({
      open: true,
      doc: doc
    });
  };

  const confirmDeleteDocument = async () => {
    if (!confirmDelete.doc) return;

    const loadingToast = showLoading("Suppression en cours...");

    try {
      await documentsAPI.delete(confirmDelete.doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== confirmDelete.doc.id));

      // Retirer l'id de la liste persistée si présent
      try {
        setUploadedHereIds((prev) => {
          const next = new Set(prev);
          next.delete(confirmDelete.doc.id);
          try {
            localStorage.setItem('documents:uploaded_here', JSON.stringify(Array.from(next)));
          } catch {
            // ignore localStorage errors
          }
          return next;
        });
      } catch (e) {
        console.error('Erreur lors du retrait de l\' id persisté', e);
      }

      updateLoading(loadingToast, "Document supprimé avec succès", "success");
      showDeleteSuccess();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      updateLoading(loadingToast, "Erreur lors de la suppression", "error");
      showError(error.response?.data?.detail || "Erreur lors de la suppression du document");
    }

    // Fermer le modal
    setConfirmDelete({ open: false, doc: null });
  };

  const cancelDelete = () => {
    setConfirmDelete({ open: false, doc: null });
  };

  // Fonction utilitaire pour générer le message de confirmation
  const getDeleteMessage = (doc) => {
    const docName = doc?.original_name || doc?.original_filename;
    return docName
      ? `Êtes-vous sûr de vouloir supprimer définitivement le document "${docName}" ?`
      : 'Êtes-vous sûr de vouloir supprimer définitivement ce document ?';
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setEditForm({
      name: doc.original_name || doc.original_filename || '',
      expiry: doc.expire_at || ''
    });

    showInfo(`Édition de "${doc.original_name || doc.original_filename || 'ce document'}"`);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDoc) {
      showError("Aucun document en cours d'édition");
      return;
    }

    if (!editForm.name.trim()) {
      showError("Le nom du document est obligatoire");
      return;
    }

    const loadingToast = showLoading("Mise à jour en cours...");

    try {
      const updateData = {
        original_name: editForm.name.trim(),
        expire_at: editForm.expiry || null
      };

      const response = await documentsAPI.update(editingDoc.id, updateData);
      const updatedDoc = response.data;

      // Mettre à jour la liste locale
      setDocuments((prev) => prev.map((d) =>
        d.id === editingDoc.id ? updatedDoc : d
      ));

      setEditingDoc(null);

      updateLoading(loadingToast, "Document mis à jour avec succès", "success");
      showUpdateSuccess();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      updateLoading(loadingToast, "Erreur lors de la mise à jour", "error");
      showError(error.response?.data?.detail || "Erreur lors de la mise à jour du document");
    }
  };

  const handleOpenFilePicker = () => openAdd();
  const fileAccept = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

  const loadDocuments = useCallback(async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      showError("Erreur lors du chargement des documents");
    }
  }, [showError]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Charger la liste persistée des documents créés via cette page
  useEffect(() => {
    try {
      const raw = localStorage.getItem('documents:uploaded_here');
      const arr = raw ? JSON.parse(raw) : [];
      setUploadedHereIds(new Set(Array.isArray(arr) ? arr : []));
    } catch (e) {
      console.error('Impossible de charger les ids de documents uploadés ici', e);
    }
  }, []);

  // Séparer les documents en provenance du DAO, ceux uploadés ici et les autres
  const isFromDao = (d) => {
    if (!d) return false;
    if (d.dao_id) return true;
    if (d.from_dao) return true;
    if (d.source === 'dao') return true;
    if (d.origin === 'dao') return true;
    if (d.uploaded_by === 'dao') return true;
    if (d.metadata && (d.metadata.origin === 'dao' || d.metadata.source === 'dao')) return true;
    if (Array.isArray(d.tags) && d.tags.includes('dao')) return true;
    if (typeof d.url === 'string' && d.url.includes('/dao/')) return true;
    if (typeof d.filename === 'string' && d.filename.toLowerCase().includes('dao')) return true;
    return false;
  };

  // Heuristique conservative pour détecter les documents téléversés via le module "Documents"
  const isUploadedHere = (d) => {
    if (!d) return false;

    // Si l'id du document est dans la liste persistée -> clairement uploadé via cette page
    if (d.id && uploadedHereIds && uploadedHereIds.has && uploadedHereIds.has(d.id)) return true;

    // Ne pas considérer les DAO
    if (isFromDao(d)) return false;

    // Vérifier indicateurs explicites seulement (ne pas tomber dans les heuristiques permissives)
    const uploader = (d.uploaded_by || d.uploader || d.created_by || d.owner || (d.metadata && (d.metadata.uploaded_by || d.metadata.uploader || d.metadata.created_via)) || '')
      .toString()
      .toLowerCase();

    // Accepter explicitement les uploads marqués comme provenant du module Documents
    if (uploader.includes('documents') || uploader.includes('documents_page') || uploader.includes('documents_module')) return true;

    // Metadata explicite
    const meta = d.metadata || {};
    if (meta.created_via === 'documents_module' || (typeof meta.created_via === 'string' && meta.created_via.toLowerCase().includes('documents'))) return true;
    const metaSource = (meta.uploaded_via || meta.source || meta.origin || '').toString().toLowerCase();
    if (['documents_page', 'documents', 'uploads', 'frontend', 'web'].includes(metaSource)) return true;

    // URLs/paths explicitement d'uploads de l'application (et pas issus d'autres modules)
    if (typeof d.url === 'string' && d.url.includes('/uploads/') && !d.url.match(/personnel|personnels|materiel|materiels|sdp|prix|onlyoffice|mtx|bde|equ/)) return true;
    if (typeof d.path === 'string' && d.path.includes('/uploads/') && !d.path.match(/personnel|personnels|materiel|materiels|sdp|prix|onlyoffice|mtx|bde|equ/)) return true;

    // Cas conservatif: tout le reste -> pas considéré comme uploadé ici
    return false;
  };

  const daoDocs = documents.filter(isFromDao);
  const uploadedDocs = documents.filter(d => isUploadedHere(d));

  // Helper: normalize created timestamp and return ISO date key (YYYY-MM-DD)
  const getDateKey = (doc) => {
    if (!doc) return 'inconnu';
    const ts = doc.created_at || doc.createdAt || doc.uploaded_at || doc.uploadedAt || doc.createdAt;
    if (!ts) return 'inconnu';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return 'inconnu';
    return d.toISOString().slice(0, 10);
  };

  // Group documents by date key (YYYY-MM-DD)
  const groupDocsByDate = (docs) => {
    const groups = {};
    (docs || []).forEach((d) => {
      const key = getDateKey(d);
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    // Sort groups keys descending (most recent first)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'inconnu') return 1;
      if (b === 'inconnu') return -1;
      return b.localeCompare(a);
    });

    return { groups, sortedKeys };
  };

  const formatDateLabel = (key) => {
    if (!key || key === 'inconnu') return 'Date inconnue';
    const d = new Date(key + 'T00:00:00');
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    if (key === todayKey) return "Aujourd'hui";
    if (key === yesterdayKey) return 'Hier';
    return d.toLocaleDateString('fr-FR');
  };

  // Prepare grouped lists for rendering
  const { groups: daoGroups, sortedKeys: daoKeys } = groupDocsByDate(daoDocs);
  const { groups: adminGroups, sortedKeys: adminKeys } = groupDocsByDate(uploadedDocs);

  // Réutilisable: rendu d'une carte de document
  const renderDocCard = (doc) => {
    const isExpired = doc.expire_at && new Date(doc.expire_at) < new Date();
    const isNearExpiry = doc.expire_at && new Date(doc.expire_at) - new Date() <= 7 * 24 * 60 * 60 * 1000 && !isExpired;

    return (
      <div className={`relative bg-white dark:bg-muted rounded-lg shadow-md p-4 flex justify-between items-center mb-4 group
              ${isExpired ? 'border-l-4 border-red-500' : ''}
              ${isNearExpiry ? 'border-l-4 border-yellow-500' : ''}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenDocumentModal(doc)} className="w-14 h-14 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:opacity-80" title="Aperçu">
            <Description className="text-primary w-8 h-8" />
          </button>
          <div>
            <h6 className="font-bold text-secondary m-0">{doc.original_name || doc.original_filename || 'Document sans nom'}</h6>
            <p className="text-sm text-gray-500 m-0">{doc.original_filename || doc.filename}</p>
          </div>
        </div>

        {/* Date + actions */}
        <div className="flex flex-col items-end">
          <div className="flex gap-2">
            <button onClick={() => handleDownload(doc)} className="text-gray-600 hover:text-primary" title="Télécharger">
              <CloudDownload />
            </button>
            <button onClick={() => handleOpenEdit(doc)} className="text-gray-600 hover:text-primary" title="Modifier">
              <Edit />
            </button>
            <button onClick={() => handleDelete(doc.id)} className="text-gray-600 hover:text-red-500" title="Supprimer">
              <Delete />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {doc.expire_at ? `Expire le: ${new Date(doc.expire_at).toLocaleDateString('fr-FR')}` : 'Pas de date d\'expiration'}
          </p>
        </div>
      </div>
    );
  };

  // Hook pour vérifier les expirations
  useEffect(() => {
    if (documents.length === 0) return;  

    const checkExpirations = () => {
      const today = new Date();
      documents.forEach(doc => {
        if (doc.expire_at) {
          const expiryDate = new Date(doc.expire_at);
          const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            // Document déjà expiré
            showError(`Le document "${doc.original_name || doc.original_filename || 'sans nom'}" est expiré depuis ${-diffDays} jour(s)`);
          } else if (diffDays <= 7) {
            // Document proche de l'expiration
            showWarning(`Le document "${doc.original_name || doc.original_filename || 'sans nom'}" expirera dans ${diffDays} jour(s)`);
          }
        }
      });
    };

    // Vérification immédiate au montage
    checkExpirations();

    // Vérification toutes les 24h
    const interval = setInterval(checkExpirations, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [documents, showWarning, showError]);

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />

      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Documents
          </h5>
        </header>

        {/* Liste séparée: DAO vs Utilisateur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h6 className="text-lg font-semibold text-secondary mb-3">Documents (DAO)</h6>
            {daoKeys.length > 0 ? daoKeys.map(k => (
              <div key={`dao-group-${k}`} className="mb-4">
                <div className="text-sm text-gray-400 font-medium mb-2">{formatDateLabel(k)}</div>
                {daoGroups[k].map(d => <div key={d.id}>{renderDocCard(d)}</div>)}
              </div>
            )) : <p className="text-sm text-gray-500">Aucun document importé depuis le DAO</p>}
          </div>

          <div>
            <h6 className="text-lg font-semibold text-secondary mb-3">Documents Administratifs</h6>
            {adminKeys.length > 0 ? adminKeys.map(k => (
              <div key={`admin-group-${k}`} className="mb-4">
                <div className="text-sm text-gray-400 font-medium mb-2">{formatDateLabel(k)}</div>
                {adminGroups[k].map(d => <div key={d.id}>{renderDocCard(d)}</div>)}
              </div>
            )) : <p className="text-sm text-gray-500">Aucun document téléchargé localement</p>}

            {/* Zone upload */}
            <div onClick={handleOpenFilePicker} className="border-2 border-dashed border-gray-400 rounded-lg p-6 mt-4 flex justify-center items-center cursor-pointer hover:bg-muted transition">
              <div className="text-center">
                <Add className="h-12 w-12 text-primary dark:text-neutral-100 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Ajouter un document administratif</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Ajout */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeAdd}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Ajouter un document</h3>
              </div>
              <form onSubmit={handleCreateDocument} className="p-4 space-y-4">
                <div>
                  <label className="block text-secondary font-medium mb-2">Nom du document</label>
                  <input type="text" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded" />
                </div>
                <div>
                  <label className="block text-secondary font-medium mb-2">Fichier</label>
                  <input ref={addFileRef} type="file" accept={fileAccept} onChange={handleAddFileChange} className="w-full" />
                  {addForm.file && (
                    <p className="text-sm text-gray-500 mt-1">Sélectionné: {addForm.file.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-secondary font-medium mb-2">Date d'expiration</label>
                  <input type="date" value={addForm.expiry} onChange={(e) => setAddForm((f) => ({ ...f, expiry: e.target.value }))} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeAdd} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Annuler</button>
                  <button type="submit" className="px-4 py-2 rounded bg-secondary text-white hover:opacity-90" disabled={!addForm.name || !addForm.file}>Ajouter</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Aperçu - utiliser DocumentViewer pour tous les types */}
        {showDocumentModal && currentDocument && (
          <DocumentViewer
            isOpen={showDocumentModal}
            document={currentDocument}
            onClose={handleCloseDocumentModal}
          />
        )}

        {/* Modal Edition */}
        {editingDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setEditingDoc(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Modifier le document</h3>
              </div>
              <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
                <div>
                  <label className="block text-secondary font-medium mb-2">Nom du fichier</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded" />
                </div>
                <div>
                  <label className="block text-secondary font-medium mb-2">Date d'expiration</label>
                  <input type="date" value={editForm.expiry} onChange={(e) => setEditForm((f) => ({ ...f, expiry: e.target.value }))} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditingDoc(null)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Annuler</button>
                  <button type="submit" className="px-4 py-2 rounded bg-secondary text-white hover:opacity-90">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
        <ConfirmModal
          open={confirmDelete.open}
          title="Supprimer le document"
          message={getDeleteMessage(confirmDelete.doc)}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          destructive={true}
          onConfirm={confirmDeleteDocument}
          onCancel={cancelDelete}
        />

        <button
          className="fixed bottom-6 right-10 bg-primary text-white rounded-full shadow-lg hover:bg-secondary transition-colors duration-200 animate-bounce"
          onClick={() => {
            showInfo('Aide / Guide utilisateur en cours de développement !')
          }}
        >
          <Help style={{ fontSize: '3rem' }} />
        </button>
      </main>
    </div>
  )
}

export default Documents
