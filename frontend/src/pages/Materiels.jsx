import { useState, useRef, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import ConfirmModal from '../components/ConfirmModal'
import DocumentViewer from '../components/DocumentViewer'
import useNotifications from '../hooks/useNotifications'
import {
  CloudDownload,
  Help,
  Add,
  Edit,
  Delete,
  Close,
  AttachFile,
  Description,
  Visibility,
} from "@mui/icons-material";

const API_BASE_URL = 'http://127.0.0.1:8000';

const Materiel = () => {
  const [guideOpen, setGuideOpen] = useState(false);
  const [Materiel, setMateriel] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState(null);
  const [showPiecesJointes, setShowPiecesJointes] = useState(false);
  const [selectedMateriel, setSelectedMateriel] = useState(null);

  // États pour la modal de visualisation des documents
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    designation: '',
    marque: '',
    modele: '',
    annee: '',
    qualite: ''
  });

  // États pour les fichiers
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // États pour la confirmation de suppression
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // États pour la confirmation de suppression de pièce jointe
  const [confirmDeletePieceOpen, setConfirmDeletePieceOpen] = useState(false);
  const [pendingDeletePiece, setPendingDeletePiece] = useState(null);

  // Référence pour l'input de fichiers
  const fileInputRef = useRef(null);

  const {
    showError,
    showInfo,

    showCreateSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showLoading,
    updateLoading,
    showFetchSuccess,
    showFetchError
  } = useNotifications();

  const loadMateriels = useCallback(async (showToast = true) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/materiels/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur lors du chargement des matériels');
      }
      const items = await res.json();
      const mapped = await Promise.all(items.map(async (m) => {
        let piecesJointes = [];
        try {
          const docsRes = await fetch(`${API_BASE_URL}/materiels/${m.id}/documents`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (docsRes.ok) {
            const documents = await docsRes.json();
            piecesJointes = documents.map(doc => ({
              id: doc.id,
              nom: doc.filename,
              filename: doc.filename,
              type: doc.filename.split('.').pop().toLowerCase(),
              taille: "N/A",
              url: `${API_BASE_URL}/uploads/materiels/${doc.filename}`
            }));
          }
        } catch (e) {
          console.warn(`Erreur lors du chargement des documents pour le matériel ${m.id}:`, e);
        }

        return {
          id: m.id,
          designation: m.designation,
          nombre: m.nombre,
          marque: m.marque || '',
          modele: m.modele || '',
          annee: m.annee || '',
          qualite: m.qualite || '',
          piecesJointes: piecesJointes
        };
      }));
      setMateriel(mapped);
      if (showToast) {
        showFetchSuccess();
      }
      return mapped;
    } catch (e) {
      if (showToast) {
        showFetchError(e.message);
      }
      console.error(e);
      throw e;
    }
  }, [showFetchSuccess, showFetchError]);

  useEffect(() => {
    loadMateriels();
  }, [loadMateriels]);

  const handleOpenForm = (materiel = null) => {
    if (materiel) {
      setEditingMateriel(materiel);
      setFormData({
        nombre: materiel.nombre || '',
        designation: materiel.designation || '',
        marque: materiel.marque || '',
        modele: materiel.modele || '',
        annee: materiel.annee || '',
        qualite: materiel.qualite || ''
      });
      setAttachedFiles(materiel.piecesJointes ? materiel.piecesJointes.map(piece => ({
        name: piece.nom,
        size: piece.taille,
        type: piece.type,
        id: piece.id,
        isExisting: true
      })) : []);
      showInfo(`Édition de ${materiel.designation} ${materiel.marque}`);
    } else {
      setEditingMateriel(null);
      setFormData({
        nombre: '',
        designation: '',
        marque: '',
        modele: '',
        annee: '',
        qualite: ''
      });
      setAttachedFiles([]);
      showInfo("Ajout d'un nouveau matériel");
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMateriel(null);
    setAttachedFiles([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Gestion des fichiers joints
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    // Vérifier les types de fichiers autorisés
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    const validFiles = files.filter(file => {
      if (allowedTypes.includes(file.type)) {
        return true;
      } else {
        alert(`Fichier non supporté: ${file.name}. Types autorisés: PDF, Word, Excel, Images`);
        return false;
      }
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
  };

  // Supprimer un fichier joint
  const removeAttachedFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Fonction pour télécharger une pièce jointe
  const handleDownloadPiece = (piece) => {
    const link = document.createElement('a');
    const url = piece.url || (piece.filename ? `${API_BASE_URL}/uploads/materiels/${piece.filename}` : `${API_BASE_URL}/uploads/materiels/${piece.nom}`);
    link.href = url;
    link.download = piece.nom;
    link.target = '_blank';
    link.click();
    console.log('Téléchargement de:', piece.nom, 'URL:', url);
  };



  const handleDeleteClick = (id) => {
    const materiel = Materiel.find(m => m.id === id);
    if (materiel) {
      setPendingDeleteId(id);
      setConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    const id = pendingDeleteId;
    setConfirmOpen(false);
    setPendingDeleteId(null);

    if (id != null) {
      const materiel = Materiel.find(m => m.id === id);
      if (!materiel) return;

      const loadingToast = showLoading("Suppression en cours...");
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/materiels/${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Erreur lors de la suppression');
        }
        setMateriel(prev => prev.filter(m => m.id !== id));
        updateLoading(loadingToast, "Matériel supprimé avec succès", "success");
        showDeleteSuccess(`Matériel supprimé: ${materiel.designation}`);
      } catch (e) {
        updateLoading(loadingToast, "Erreur lors de la suppression", "error");
        showError(e.message);
        console.error(e);
      }
    }
  };

  const handleDeletePieceClick = (materielId, pieceId) => {
    setPendingDeletePiece({ materielId, pieceId });
    setConfirmDeletePieceOpen(true);
  };

  const handleConfirmDeletePiece = () => {
    setConfirmDeletePieceOpen(false);

    if (pendingDeletePiece) {
      const { materielId, pieceId } = pendingDeletePiece;

      const materiel = Materiel.find(m => m.id === materielId);
      const piece = materiel?.piecesJointes.find(p => p.id === pieceId);

      const updatedMateriel = Materiel.map(m => {
        if (m.id === materielId) {
          return {
            ...m,
            piecesJointes: m.piecesJointes.filter(p => p.id !== pieceId)
          };
        }
        return m;
      });
      setMateriel(updatedMateriel);
      console.log('Pièce jointe supprimée:', pieceId);
      showDeleteSuccess(`Pièce jointe supprimée: ${piece?.nom || 'Fichier'}`);

      handleClosePiecesJointes();
    }

    setPendingDeletePiece(null);
  };

  // Fonction de validation
  const validateForm = () => {
    const errors = {};

    if (!formData.nombre || formData.nombre === '') {
      errors.nombre = 'Le nombre est obligatoire';
    }

    if (!formData.designation || formData.designation.trim() === '') {
      errors.designation = 'La désignation est obligatoire';
    }

    if (!formData.marque || formData.marque.trim() === '') {
      errors.marque = 'La marque est obligatoire';
    }

    if (!formData.modele || formData.modele.trim() === '') {
      errors.modele = 'Le modèle est obligatoire';
    }

    if (!formData.annee || formData.annee === '') {
      errors.annee = "L'année est obligatoire";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction pour ajouter un nouveau matériel ou modifier un existant
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const loadingToast = showLoading(editingMateriel ? "Modification en cours..." : "Ajout en cours...");

    try {
      const token = localStorage.getItem('token');

      const payload = {
        designation: formData.designation,
        nombre: parseInt(formData.nombre) || 0,
        marque: formData.marque || null,
        modele: formData.modele || null,
        annee: formData.annee ? parseInt(formData.annee) : null,
        qualite: formData.qualite || null
      };

      let res;
      if (editingMateriel) {
        if (attachedFiles.some(file => file instanceof File)) {
          const fd = new FormData();
          if (formData.designation) fd.append('designation', formData.designation);
          if (formData.nombre) fd.append('nombre', String(parseInt(formData.nombre) || 0));
          if (formData.marque) fd.append('marque', formData.marque);
          if (formData.modele) fd.append('modele', formData.modele);
          if (formData.annee) fd.append('annee', String(parseInt(formData.annee)));
          if (formData.qualite) fd.append('qualite', formData.qualite);

          attachedFiles.forEach((file) => {
            if (file instanceof File) {
              fd.append('files', file);
            }
          });

          res = await fetch(`${API_BASE_URL}/materiels/${editingMateriel.id}/with-files`, {
            method: 'PUT',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          });
        } else {
          // Modification sans nouveaux fichiers
          res = await fetch(`${API_BASE_URL}/materiels/${editingMateriel.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload),
          });
        }
      } else {
        if (attachedFiles.length > 0) {
          const fd = new FormData();
          if (formData.designation) fd.append('designation', formData.designation);
          if (formData.nombre) fd.append('nombre', String(parseInt(formData.nombre) || 0));
          if (formData.marque) fd.append('marque', formData.marque);
          if (formData.modele) fd.append('modele', formData.modele);
          if (formData.annee) fd.append('annee', String(parseInt(formData.annee)));
          if (formData.qualite) fd.append('qualite', formData.qualite);

          attachedFiles.forEach((file) => fd.append('files', file));

          res = await fetch(`${API_BASE_URL}/materiels/with-files`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          });
        } else {
          res = await fetch(`${API_BASE_URL}/materiels/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload),
          });
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err?.detail;
        const message = Array.isArray(detail)
          ? detail.map(d => d?.msg || JSON.stringify(d)).join(' | ')
          : (detail || `Erreur lors de ${editingMateriel ? 'la modification' : 'l\'ajout'} du matériel`);
        throw new Error(message);
      }

      const savedMateriel = await res.json();

      // Charger les documents du matériel pour l'affichage
      let piecesJointes = [];
      if (attachedFiles.length > 0) {
        try {
          const docsRes = await fetch(`${API_BASE_URL}/materiels/${savedMateriel.id}/documents`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (docsRes.ok) {
            const documents = await docsRes.json();
            piecesJointes = documents.map(doc => ({
              id: doc.id,
              nom: doc.filename,
              filename: doc.filename,
              type: doc.filename.split('.').pop().toLowerCase(),
              taille: "N/A",
              url: `${API_BASE_URL}/uploads/materiels/${doc.filename}`
            }));
          }
        } catch (e) {
          console.warn('Erreur lors du chargement des documents:', e);
          const newFiles = attachedFiles.filter(file => file instanceof File);
          piecesJointes = newFiles.map((file, index) => ({
            id: Date.now() + index,
            nom: file.name,
            type: file.name.split('.').pop().toLowerCase(),
            taille: `${(file.size / 1024).toFixed(1)} KB`
          }));
        }
      } else if (editingMateriel) {
        try {
          const docsRes = await fetch(`${API_BASE_URL}/materiels/${savedMateriel.id}/documents`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (docsRes.ok) {
            const documents = await docsRes.json();
            piecesJointes = documents.map(doc => ({
              id: doc.id,
              nom: doc.filename,
              filename: doc.filename,
              type: doc.filename.split('.').pop().toLowerCase(),
              taille: "N/A",
              url: `${API_BASE_URL}/uploads/materiels/${doc.filename}`
            }));
          }
        } catch (e) {
          console.warn('Erreur lors du chargement des documents:', e);
          piecesJointes = editingMateriel.piecesJointes || [];
        }
      }

      const mappedMateriel = {
        id: savedMateriel.id,
        designation: savedMateriel.designation,
        nombre: savedMateriel.nombre,
        marque: savedMateriel.marque || '',
        modele: savedMateriel.modele || '',
        annee: savedMateriel.annee || '',
        qualite: savedMateriel.qualite || '',
        piecesJointes: piecesJointes
      };

      if (editingMateriel) {
        updateLoading(loadingToast, "Matériel modifié avec succès", "success");
        showUpdateSuccess(`Matériel modifié: ${formData.designation} ${formData.marque}`);
        handleCloseForm();
        await loadMateriels(false);
      } else {
        setMateriel(prev => [...prev, mappedMateriel]);
        updateLoading(loadingToast, "Matériel ajouté avec succès", "success");
        showCreateSuccess(`Nouveau matériel ajouté: ${formData.designation} ${formData.marque}`);
        handleCloseForm();
      }

    } catch (e) {
      updateLoading(loadingToast, `Erreur lors de ${editingMateriel ? 'la modification' : 'l\'ajout'}`, "error");
      showError(e.message);
      console.error(e);
    }
  };

  // Fonction pour ouvrir le modal des pièces jointes
  const handleOpenPiecesJointes = (materiel) => {
    setSelectedMateriel(materiel);
    setShowPiecesJointes(true);
  };

  // Fonction pour fermer le modal des pièces jointes
  const handleClosePiecesJointes = () => {
    setShowPiecesJointes(false);
    setSelectedMateriel(null);
  };

  // Fonctions pour la modal de visualisation des documents
  const handleOpenDocumentModal = (document) => {
    setCurrentDocument(document);
    setShowDocumentModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setCurrentDocument(null);
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <Description className="h-5 w-5 text-file-pdf" />;
      case 'docx':
      case 'doc':
        return <Description className="h-5 w-5 text-file-doc" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Description className="h-5 w-5 text-file-image" />;
      default:
        return <Description className="h-5 w-5 text-file-default" />;
    }
  };

  const UserGuideModal = ({ open, onClose }) => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
        <div className="bg-white dark:bg-primary w-full max-w-3xl rounded-lg shadow-lg overflow-y-auto max-h-[80vh] p-6">
          <h2 className="text-xl font-bold mb-4 text-secondary">Guide Utilisateur – Gestion des Matériels</h2>

          <section className="mb-4">
            <h3 className="font-semibold mb-2">1. Vue d'ensemble</h3>
            <p>Ce module permet d’ajouter, modifier, supprimer et consulter les matériels. Vous pouvez également gérer les pièces jointes et visualiser ou télécharger les documents liés à chaque matériel.</p>
          </section>

          <section className="mb-4">
            <h3 className="font-semibold mb-2">2. Ajouter un matériel</h3>
            <ol className="list-decimal list-inside">
              <li>Cliquez sur le bouton <strong>Ajouter un matériel</strong>.</li>
              <li>Remplissez les champs obligatoires : Désignation, Marque, Modèle, Année, Nombre.</li>
              <li>Les champs facultatifs : Qualité, fichiers joints.</li>
              <li>Cliquez sur <strong>Ajouter</strong> pour enregistrer.</li>
            </ol>
          </section>

          <section className="mb-4">
            <h3 className="font-semibold mb-2">3. Modifier un matériel</h3>
            <p>Cliquez sur l’icône <strong>Edit</strong> dans la ligne correspondante. Modifiez les champs puis cliquez sur <strong>Modifier</strong>.</p>
          </section>

          <section className="mb-4">
            <h3 className="font-semibold mb-2">4. Supprimer un matériel</h3>
            <p>Cliquez sur l’icône <strong>Delete</strong> et confirmez la suppression dans la modal de confirmation.</p>
          </section>

          <section className="mb-4">
            <h3 className="font-semibold mb-2">5. Pièces jointes</h3>
            <p>Pour chaque matériel, cliquez sur l’icône <AttachFile className="inline-block h-4 w-4" /> pour voir les fichiers attachés. Vous pouvez visualiser, télécharger ou supprimer chaque fichier.</p>
          </section>

          <div className="flex justify-end mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Materiels
          </h5>
        </header>

        {/* Tableau des Materiels */}
        <div className="bg-muted rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-muted dark:bg-surface-mutedDark">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200 border-b border-border-light dark:border-border-dark">
                  <div className="w-4 h-4 bg-neutral-400 rounded"></div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200 border-b border-border-light dark:border-border-dark">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200 border-b border-border-light dark:border-border-dark">
                  Désignation
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200 border-b border-border-light dark:border-border-dark">
                  Marque
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200 border-b border-border-light dark:border-border-dark">
                  Modèle
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200 border-b border-border-light dark:border-border-dark">
                  Année
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200 border-b border-border-light dark:border-border-dark">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-light dark:bg-surface-dark">
              {Materiel.map((materiel) => (
                <tr key={materiel.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                  <td className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <div className="w-4 h-4 bg-neutral-400 rounded"></div>
                  </td>
                  <td className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPiecesJointes(materiel)}
                        className="p-1 text-info hover:text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded transition-colors duration-200"
                        title="Voir les pièces jointes"
                      >
                        <AttachFile className="h-5 w-5" />
                      </button>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {materiel.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {materiel.designation}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {materiel.marque}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {materiel.modele}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {materiel.annee}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenForm(materiel)}
                        className="p-2 text-info hover:text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors duration-200"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(materiel.id)}
                        className="p-2 text-danger hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors duration-200"
                        title="Supprimer"
                      >
                        <Delete className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bouton Ajouter un matériel */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handleOpenForm()}
            className="px-6 py-3 bg-muted hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Add className="h-5 w-5" />
            Ajouter un matériel
          </button>
        </div>

        {/* Modal des pièces jointes */}
        {showPiecesJointes && selectedMateriel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full">
              {/* Header du modal */}
              <div className="flex justify-between items-center p-6 border-b border-border-light dark:border-border-dark">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Pièces jointes - {selectedMateriel.designation}
                </h3>
                <button
                  onClick={handleClosePiecesJointes}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
                >
                  <Close className="h-6 w-6 text-neutral-500" />
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="p-6">
                {selectedMateriel.piecesJointes && selectedMateriel.piecesJointes.length > 0 ? (
                  <div className="space-y-3">
                    {selectedMateriel.piecesJointes.map((piece) => (
                      <div key={piece.id} className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(piece.type)}
                          <div>
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {piece.nom}
                            </span>
                            <div className="text-xs text-neutral-500">
                              {piece.taille}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDocumentModal(piece)}
                            className="p-2 text-primary hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors duration-200"
                            title="Visualiser le document"
                          >
                            <Visibility className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPiece(piece)}
                            className="p-2 text-info hover:text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded transition-colors duration-200"
                            title="Télécharger"
                          >
                            <CloudDownload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePieceClick(selectedMateriel.id, piece.id)}
                            className="p-2 text-danger hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors duration-200"
                            title="Supprimer"
                          >
                            <Delete className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AttachFile className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500 dark:text-neutral-400">
                      Aucune pièce jointe pour ce matériel
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal du formulaire */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full">
              {/* Header du modal */}
              <div className="flex justify-between items-center p-6 border-b border-border-light dark:border-border-dark">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {editingMateriel ? 'Modifier le matériel' : 'Ajouter un matériel'}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
                >
                  <Close className="h-6 w-6 text-neutral-500" />
                </button>
              </div>

              {/* Contenu du formulaire */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Grille des champs en 2 colonnes */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Colonne gauche */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-secondary font-medium mb-2">
                        Désignation <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${formErrors.designation
                          ? 'border-danger bg-danger-50 dark:bg-danger-900/20'
                          : 'bg-neutral-100 dark:bg-neutral-700 border-border-light dark:border-border-dark'
                          }`}
                        placeholder="Désignation"
                      />
                      {formErrors.designation && (
                        <p className="text-danger text-sm mt-1">{formErrors.designation}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">
                        Modèle <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="modele"
                        value={formData.modele}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${formErrors.modele
                          ? 'border-danger bg-danger-50 dark:bg-danger-900/20'
                          : 'bg-neutral-100 dark:bg-neutral-700 border-border-light dark:border-border-dark'
                          }`}
                        placeholder="Modèle"
                      />
                      {formErrors.modele && (
                        <p className="text-danger text-sm mt-1">{formErrors.modele}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">Qualité</label>
                      <input
                        type="text"
                        name="qualite"
                        value={formData.qualite}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Qualité"
                      />
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-secondary font-medium mb-2">
                        Marque <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="marque"
                        value={formData.marque}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${formErrors.marque
                          ? 'border-danger bg-danger-50 dark:bg-danger-900/20'
                          : 'border-border-light dark:border-border-dark bg-neutral-100 dark:bg-neutral-700'
                          }`}
                        placeholder="Marque"
                      />
                      {formErrors.marque && (
                        <p className="text-danger text-sm mt-1">{formErrors.marque}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">
                        Année <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="annee"
                        value={formData.annee}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${formErrors.annee
                          ? 'border-danger bg-danger-50 dark:bg-danger-900/20'
                          : 'border-border-light dark:border-border-dark bg-neutral-100 dark:bg-neutral-700'
                          }`}
                        placeholder="Année"
                      />
                      {formErrors.annee && (
                        <p className="text-danger text-sm mt-1">{formErrors.annee}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">
                        Nombre <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${formErrors.nombre
                          ? 'border-danger bg-danger-50 dark:bg-danger-900/20'
                          : 'border-border-light dark:border-border-dark bg-neutral-100 dark:bg-neutral-700'
                          }`}
                        placeholder="Nombre"
                      />
                      {formErrors.nombre && (
                        <p className="text-danger text-sm mt-1">{formErrors.nombre}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section des fichiers joints */}
                <div className="mt-6">
                  <label className="block text-secondary font-medium mb-3">Fichiers joints</label>

                  {/* Bouton pour joindre des fichiers */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-700 dark:text-neutral-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <AttachFile className="h-5 w-5" />
                    Joindre des fichiers
                  </button>

                  {/* Input caché pour les fichiers */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Liste des fichiers joints */}
                  {attachedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Fichiers sélectionnés :</h4>
                      {attachedFiles.map((file, index) => (
                        <div key={file.id || index} className={`flex items-center justify-between p-3 rounded-lg ${file.isExisting ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                          <div className="flex items-center gap-3">
                            <AttachFile className="h-5 w-5 text-neutral-500" />
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                              {file.name || file.nom}
                            </span>
                            <span className="text-xs text-neutral-500">
                              ({file.size || file.taille})
                            </span>
                            {file.isExisting && (
                              <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                Existant
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachedFile(index)}
                            className="p-1 text-danger hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded"
                            title={file.isExisting ? "Retirer de la liste (ne supprime pas le fichier)" : "Supprimer le fichier"}
                          >
                            <Close className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-secondary hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    {editingMateriel ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de visualisation des documents */}
        <DocumentViewer
          isOpen={showDocumentModal}
          document={currentDocument}
          onClose={handleCloseDocumentModal}
        />

        <ConfirmModal
          open={confirmOpen}
          title="Confirmer la suppression"
          message={pendingDeleteId ? `Voulez-vous vraiment supprimer le matériel "${Materiel.find(m => m.id === pendingDeleteId)?.designation}" ?` : "Voulez-vous vraiment supprimer ce matériel ?"}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          destructive
          onConfirm={handleConfirmDelete}
          onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
        />

        <ConfirmModal
          open={confirmDeletePieceOpen}
          title="Confirmer la suppression"
          message={pendingDeletePiece ? `Voulez-vous vraiment supprimer la pièce jointe "${Materiel.find(m => m.id === pendingDeletePiece?.materielId)?.piecesJointes.find(p => p.id === pendingDeletePiece?.pieceId)?.nom}" ?` : "Voulez-vous vraiment supprimer cette pièce jointe ?"}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          destructive
          onConfirm={handleConfirmDeletePiece}
          onCancel={() => { setConfirmDeletePieceOpen(false); setPendingDeletePiece(null); }}
        />

        {/* Boutton d'aide Flottant */}
        <button
          className="fixed bottom-6 right-10 bg-primary text-white rounded-full shadow-lg hover:bg-secondary transition-colors duration-200 animate-bounce"
          onClick={() => setGuideOpen(true)}
        >
          <Help style={{ fontSize: '3rem' }} />
        </button>

        <UserGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      </main>
    </div>
  )
}

export default Materiel