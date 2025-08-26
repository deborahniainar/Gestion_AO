import React, { useRef, useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import ConfirmModal from '../components/ConfirmModal'
import useNotifications from '../hooks/useNotifications'
import { documentsAPI } from '../services/api'
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

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', expiry: '', file: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, doc: null });
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

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!addForm.file || !addForm.name.trim()) {
      showError("Veuillez remplir tous les champs obligatoires");
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

  const handlePreview = (doc) => setPreviewDoc(doc);
  const closePreview = () => setPreviewDoc(null);

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

  // ✅ Hook pour vérifier les expirations
  useEffect(() => {
    if (documents.length === 0) return; // Pas de documents à vérifier

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
            Gestion des Documents Administratifs
          </h5>
        </header>

        {/* Liste des documents */}
        {documents.map((doc) => {
          const isExpired = doc.expire_at && new Date(doc.expire_at) < new Date();
          const isNearExpiry = doc.expire_at && new Date(doc.expire_at) - new Date() <= 7*24*60*60*1000 && !isExpired;

          return (
            <div key={doc.id} className={`relative bg-white dark:bg-muted rounded-lg shadow-md p-4 flex justify-between items-center mb-4 group
              ${isExpired ? 'border-l-4 border-red-500' : ''}
              ${isNearExpiry ? 'border-l-4 border-yellow-500' : ''}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => handlePreview(doc)} className="w-14 h-14 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:opacity-80" title="Aperçu">
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Aperçu — {previewDoc.original_name || previewDoc.original_filename || 'Document sans nom'}</h3>
                <button onClick={closePreview} className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Fermer</button>
              </div>
              <div className="p-4 max-h-[80vh] overflow-auto">
                <div className="text-center text-gray-600 dark:text-gray-300">
                  <p>Aperçu non disponible dans cette version.</p>
                  <p>Cliquez sur le bouton de téléchargement pour consulter le document.</p>
                  <button 
                    onClick={() => {
                      handleDownload(previewDoc);
                      closePreview();
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:opacity-90"
                  >
                    Télécharger le document
                  </button>
                </div>
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
      </main> 
    </div>
  )
}

export default Documents
