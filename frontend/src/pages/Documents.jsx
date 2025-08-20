import React, { useRef, useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import useNotifications from '../hooks/useNotifications'
import {
  CloudDownload,
  Help,
  Add,
  Description,
  Edit,
  Delete
} from "@mui/icons-material";

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', expiry: '' });
  const [editReplaceFile, setEditReplaceFile] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', expiry: '', file: null });
  const addFileRef = useRef(null);

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

  const handleAddFileChange = (e) => {
    const f = (e.target.files && e.target.files[0]) || null;
    if (f) {
      setAddForm((prev) => ({ ...prev, file: f }));
      showSuccess(`Fichier "${f.name}" sélectionné`);
    }
  };

  const handleCreateDocument = (e) => {
    e.preventDefault();
    if (!addForm.file || !addForm.name.trim()) {
      showError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    const loadingToast = showLoading("Création du document en cours...");
    
    try {
      const ext = (addForm.file.name.split('.').pop() || '').toLowerCase();
      const base = addForm.file.name.replace(new RegExp(`\\.${ext}$`), '');
      const url = URL.createObjectURL(addForm.file);
      const newDoc = {
        id: `${Date.now()}`,
        name: addForm.name.trim(),
        originalName: base,
        types: ext,
        file: addForm.file,
        url,
        expiry: addForm.expiry || '',
        addedAt: new Date().toISOString(),
      };
      setDocuments((prev) => [newDoc, ...prev]);
      closeAdd();
      updateLoading(loadingToast, "Document créé avec succès", "success");
      showCreateSuccess();
    } catch (error) {
      updateLoading(loadingToast, "Erreur lors de la création", "error");
      showError("Erreur lors de la création du document");
    }
  };

  const handleDownload = (doc) => {
    if (!doc?.url) {
      showError("Document non disponible");
      return;
    }
    
    const loadingToast = showLoading("Téléchargement en cours...");
    
    try {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      updateLoading(loadingToast, "Téléchargement réussi", "success");
      showDownloadSuccess();
    } catch (error) {
      updateLoading(loadingToast, "Erreur lors du téléchargement", "error");
      showError("Erreur lors du téléchargement");
    }
  };

  const handleDelete = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
      showError("Document non trouvé");
      return;
    }
    
    showWarning(`Êtes-vous sûr de vouloir supprimer "${doc.name}" ?`);
    
    setDocuments((prev) => {
      const toRemove = prev.find((d) => d.id === docId);
      if (toRemove?.url?.startsWith('blob:')) URL.revokeObjectURL(toRemove.url);
      return prev.filter((d) => d.id !== docId);
    });
    
    showDeleteSuccess();
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setEditForm({ name: doc.name, expiry: doc.expiry || '' });
    setEditReplaceFile(null);
    showInfo(`Édition de "${doc.name}"`);
  };

  const handleSaveEdit = (e) => {
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
      setDocuments((prev) => prev.map((d) => {
        if (d.id !== editingDoc.id) return d;
        let updated = { ...d, name: editForm.name, expiry: editForm.expiry };
        if (editReplaceFile) {
          if (updated.url?.startsWith('blob:')) URL.revokeObjectURL(updated.url);
          const ext = (editReplaceFile.name.split('.').pop() || '').toLowerCase();
          const base = editReplaceFile.name.replace(new RegExp(`\\.${ext}$`), '');
          updated = {
            ...updated,
            file: editReplaceFile,
            url: URL.createObjectURL(editReplaceFile),
            types: ext,
            originalName: base,
          };
        }
        return updated;
      }));
      setEditingDoc(null);
      setEditReplaceFile(null);
      updateLoading(loadingToast, "Document mis à jour avec succès", "success");
      showUpdateSuccess();
    } catch (error) {
      updateLoading(loadingToast, "Erreur lors de la mise à jour", "error");
      showError("Erreur lors de la mise à jour du document");
    }
  };

  const handlePreview = (doc) => setPreviewDoc(doc);
  const closePreview = () => setPreviewDoc(null);

  const handleOpenFilePicker = () => openAdd();
  const fileAccept = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

  // ✅ Hook pour vérifier les expirations
  useEffect(() => {
    const checkExpirations = () => {
      const today = new Date();
      documents.forEach(doc => {
        if (doc.expiry) {
          const expiryDate = new Date(doc.expiry);
          const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
            // Document déjà expiré
            showError(`Le document "${doc.name}" est expiré depuis ${-diffDays} jour(s)`);
          } else if (diffDays <= 7) {
            // Document proche de l’expiration
            showWarning(`Le document "${doc.name}" expirera dans ${diffDays} jour(s)`);
          }
        }
      });
    };

    // Vérification immédiate au montage
    checkExpirations();

    // Vérification toutes les 24h
    const interval = setInterval(checkExpirations, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [documents, showWarning, showInfo]);

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   

      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        <header className="flex justify-between items-center px-6 py-4 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Documents Administratifs
          </h5>
          <div className="flex gap-3">
            <button className="p-2 text-primary dark:text-muted hover:text-accent dark:hover:text-surface-dark transition-colors duration-200">
              <CloudDownload className="h-10 w-10" />
            </button>
            <button className="p-2 text-primary dark:text-muted hover:text-accent dark:hover:text-surface-dark transition-colors duration-200">
              <Help className="h-8 w-8" />
            </button>
          </div>
        </header>

        {/* Liste des documents */}
        {documents.map((doc) => {
          const isExpired = doc.expiry && new Date(doc.expiry) < new Date();
          const isNearExpiry = doc.expiry && new Date(doc.expiry) - new Date() <= 24*24*60*60*1000 && !isExpired;

          return (
            <div key={doc.id} className={`relative bg-white dark:bg-muted rounded-lg shadow-md p-4 flex justify-between items-center mb-4 group
              ${isExpired ? 'border-l-4 border-red-500' : ''}
              ${isNearExpiry ? 'border-l-4 border-yellow-500' : ''}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => handlePreview(doc)} className="w-14 h-14 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:opacity-80" title="Aperçu">
                  <Description className="text-primary w-8 h-8" />
                </button>
                <div>
                  <h6 className="font-bold text-secondary m-0">{doc.name}</h6>
                  <p className="text-sm text-gray-500 m-0">{doc.originalName ? `${doc.originalName}.${doc.types}` : `${doc.name}`}</p>
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
                  {doc.expiry ? `Expiré le: ${doc.expiry}` : 'Pas de date d’expiration'}
                </p>
              </div>
            </div>
          )
        })}

        {/* Zone upload */}
        <div onClick={handleOpenFilePicker} className="border-2 border-dashed border-gray-400 rounded-lg p-10 flex justify-center items-center cursor-pointer hover:bg-muted transition">
          <Add className="h-20 w-20 text-primary dark:text-neutral-100" />
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
                  <label className="block text-secondary font-medium mb-2">Date d'expiration (optionnel)</label>
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

        {/* Modal Aperçu */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closePreview}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Aperçu — {previewDoc.name}</h3>
                <button onClick={closePreview} className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Fermer</button>
              </div>
              <div className="p-4 max-h-[80vh] overflow-auto">
                {['png','jpg','jpeg'].includes((previewDoc.types||'').toLowerCase()) && (
                  <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full h-auto mx-auto" />
                )}
                {previewDoc.types === 'pdf' && (
                  <iframe title="aperçu-pdf" src={previewDoc.url} className="w-full h-[70vh]" />
                )}
                {!['png','jpg','jpeg','pdf'].includes((previewDoc.types||'').toLowerCase()) && (
                  <div className="text-center text-gray-600 dark:text-gray-300">
                    Aperçu non disponible pour ce type de fichier. Veuillez le télécharger.
                  </div>
                )}
              </div>
            </div>
          </div>
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
      </main> 
    </div>
  )
}

export default Documents
