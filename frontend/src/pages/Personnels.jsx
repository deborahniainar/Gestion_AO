import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ConfirmModal from '../components/ConfirmModal'
import DocumentViewer from '../components/DocumentViewer'
import useNotifications from '../hooks/useNotifications'
import {
  Help,
  Add,
  Edit,
  Delete,
  Person,
  Close,
  AttachFile,
  PhotoCamera,
  Visibility
} from "@mui/icons-material";
import api from '../services/api'

const Personnels = () => {
  const [personnels, setPersonnels] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [editingPersonnel, setEditingPersonnel] = useState(null);

  const {
    showError,
    showInfo,
    showWarning,
    showDeleteSuccess,
    showFetchSuccess,
    showFetchError,
    showCreateSuccess,
    showUpdateSuccess,
  } = useNotifications();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    fonction: '',
    formation: '',
    dateNaissance: '',
    salaire: '',
    nationalite: '',
    experience: '',
    contact: '',
    genre: '',
    status: ''
  });

  // États pour les fichiers
  const [profileImage, setProfileImage] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [diplomeFile, setDiplomeFile] = useState(null);
  const [contratFile, setContratFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [personnelDocuments, setPersonnelDocuments] = useState(null);

  // États pour les documents existants lors de l'édition
  const [existingCvFiles, setExistingCvFiles] = useState([]);
  const [existingDiplomeFiles, setExistingDiplomeFiles] = useState([]);
  const [existingContratFiles, setExistingContratFiles] = useState([]);

  // États pour la modal de visualisation des documents
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);

  // Références pour les inputs de fichiers
  const imageInputRef = useRef(null);
  const cvInputRef = useRef(null);
  const diplomeInputRef = useRef(null);
  const contratInputRef = useRef(null);

  useEffect(() => {
    const loadPersonnels = async () => {
      try {
        const res = await api.get('/api/personnels/');
        const items = res.data;
        const mapped = items.map(p => ({
          id: p.id,
          nom: p.nom,
          prenom: p.prenom ?? '',
          fonction: p.fonction ?? '',
          formation: p.formation ?? '',
          dateNaissance: p.date_naissance ?? '',
          salaire: p.salaire_mensuel ?? '',
          nationalite: p.nationalite ?? '',
          experience: p.experience_annees ?? '',
          contact: p.contact ?? '',
          genre: p.genre ?? '',
          status: p.status ?? '',
          profileImage: p.profile_image ? `${api.defaults.baseURL}/uploads/personnels/${p.profile_image}` : null
        }));
        setPersonnels(mapped);
        showFetchSuccess();
      } catch (e) {
        showFetchError(e.message);
        console.error(e);
      }
    };
    loadPersonnels();
  }, [showFetchError, showFetchSuccess]);

  const handleOpenForm = async (personnel = null) => {
    if (personnel) {
      setEditingPersonnel(personnel);
      setFormData({
        nom: personnel.nom || '',
        prenom: personnel.prenom || '',
        fonction: personnel.fonction || '',
        formation: personnel.formation || '',
        dateNaissance: personnel.dateNaissance || '',
        salaire: personnel.salaire || '',
        nationalite: personnel.nationalite || '',
        experience: personnel.experience || '',
        contact: personnel.contact || '',
        genre: personnel.genre || '',
        status: personnel.status || ''
      });
      // Charger l'image existante si elle existe
      if (personnel.profileImage) {
        setProfileImage(personnel.profileImage);
        setImagePreview(personnel.profileImage);
      } else {
        setProfileImage(null);
        setImagePreview(null);
      }

      // Charger les documents existants
      await loadExistingDocuments(personnel.id);

      showInfo(`Édition de ${personnel.nom} ${personnel.prenom}`);
    } else {
      setEditingPersonnel(null);
      setFormData({
        nom: '',
        prenom: '',
        fonction: '',
        formation: '',
        dateNaissance: '',
        salaire: '',
        nationalite: '',
        experience: '',
        contact: '',
        genre: '',
        status: ''
      });
      // Réinitialiser les documents existants
      setExistingCvFiles([]);
      setExistingDiplomeFiles([]);
      setExistingContratFiles([]);
    }
    // Réinitialiser les nouveaux fichiers
    setCvFile(null);
    setDiplomeFile(null);
    setContratFile(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPersonnel(null);
    setProfileImage(null);
    setCvFile(null);
    setDiplomeFile(null);
    setContratFile(null);
    setImagePreview(null);
    setExistingCvFiles([]);
    setExistingDiplomeFiles([]);
    setExistingContratFiles([]);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (cvInputRef.current) cvInputRef.current.value = '';
    if (diplomeInputRef.current) diplomeInputRef.current.value = '';
    if (contratInputRef.current) contratInputRef.current.value = '';
  };

  // Fonction pour charger les documents existants lors de l'édition
  const loadExistingDocuments = async (personnelId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/personnels/${personnelId}/documents`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des documents');
      }
      const docs = await res.json();

      // Séparer les documents par catégorie pour l'édition
      setExistingCvFiles(docs.cv || []);
      setExistingDiplomeFiles(docs.diplome || []);
      setExistingContratFiles(docs.contrat || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents existants:', error);
      setExistingCvFiles([]);
      setExistingDiplomeFiles([]);
      setExistingContratFiles([]);
    }
  };

  // Fonction pour charger les documents d'un personnel
  const loadPersonnelDocuments = async (personnelId) => {
    try {
      const res = await api.get(`/api/personnels/${personnelId}/documents`);
      const documents = res.data;

      setPersonnelDocuments(documents);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setPersonnelDocuments({ cv: [], diplome: [], contrat: [] });
    }
  };

  // Fonction pour ouvrir le modal de détails
  const handleOpenDetails = async (personnel) => {
    setSelectedPersonnel(personnel);
    setShowDetails(true);
    await loadPersonnelDocuments(personnel.id);
  };

  // Fonction pour fermer le modal de détails
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPersonnel(null);
    setPersonnelDocuments(null);
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

  const handleDeletePersonnel = async (id) => {
    try {
      await api.delete(`/api/personnels/${id}`);
      setPersonnels(prev => prev.filter(p => p.id !== id));
      if (selectedPersonnel?.id === id) {
        setShowDetails(false);
        setSelectedPersonnel(null);
      }
      showDeleteSuccess();
    } catch (e) {
      showError(e.message);
      console.error(e);
    }
  };

  const handleDeleteClick = (id) => {
    const personnel = personnels.find(p => p.id === id);
    if (personnel) {
      showWarning(`Êtes-vous sûr de vouloir supprimer ${personnel.nom} ${personnel.prenom} ?`);
    }
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const id = pendingDeleteId;
    setConfirmOpen(false);
    setPendingDeleteId(null);
    if (id != null) {
      await handleDeletePersonnel(id);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion de l'image de profil
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (file.type.startsWith('image/')) {
        setProfileImage(file);

        // Créer un aperçu de l'image
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Veuillez sélectionner une image valide (JPG, PNG, GIF)');
      }
    }
  };

  // Gestion des fichiers par catégorie
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

  const validateFile = (file) => {
    if (allowedTypes.includes(file.type)) {
      return true;
    } else {
      alert(`Fichier non supporté: ${file.name}. Types autorisés: PDF, Word, Excel, Images`);
      return false;
    }
  };

  const handleCvUpload = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setCvFile(file);
    }
  };

  const handleDiplomeUpload = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setDiplomeFile(file);
    }
  };

  const handleContratUpload = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setContratFile(file);
    }
  };

  const removeCvFile = () => {
    setCvFile(null);
    if (cvInputRef.current) {
      cvInputRef.current.value = '';
    }
  };

  const removeDiplomeFile = () => {
    setDiplomeFile(null);
    if (diplomeInputRef.current) {
      diplomeInputRef.current.value = '';
    }
  };

  const removeContratFile = () => {
    setContratFile(null);
    if (contratInputRef.current) {
      contratInputRef.current.value = '';
    }
  };

  // Fonction pour supprimer un CV existant
  const removeExistingCvFile = async (docId) => {
    try {
      await api.delete(`/api/personnels/${editingPersonnel.id}/documents/${docId}`);

      // Retirer de la liste locale si la suppression a réussi
      setExistingCvFiles(prev => prev.filter(doc => doc.id !== docId));
      showInfo('Document CV supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError('Erreur lors de la suppression du document');
    }
  };

  // Fonction pour supprimer un diplôme existant
  const removeExistingDiplomeFile = async (docId) => {
    try {
      await api.delete(`/api/personnels/${editingPersonnel.id}/documents/${docId}`);

      // Retirer de la liste locale si la suppression a réussi
      setExistingDiplomeFiles(prev => prev.filter(doc => doc.id !== docId));
      showInfo('Document diplôme supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError('Erreur lors de la suppression du document');
    }
  };

  // Fonction pour supprimer un contrat existant
  const removeExistingContratFile = async (docId) => {
    try {
      await api.delete(`/api/personnels/${editingPersonnel.id}/documents/${docId}`);

      // Retirer de la liste locale si la suppression a réussi
      setExistingContratFiles(prev => prev.filter(doc => doc.id !== docId));
      showInfo('Document contrat supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showError('Erreur lors de la suppression du document');
    }
  };

  // Supprimer l'image de profil
  const removeProfileImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validation minimale côté client pour éviter 422 côté serveur
      if (!formData.nom || !formData.nom.trim()) {
        alert('Le nom est requis');
        return;
      }

      // Mode édition: utiliser FormData pour gérer les fichiers
      if (editingPersonnel) {
        const fd = new FormData();
        if (formData.nom) fd.append('nom', formData.nom);
        if (formData.prenom) fd.append('prenom', formData.prenom);
        if (formData.fonction) fd.append('fonction', formData.fonction);
        if (formData.formation) fd.append('formation', formData.formation);
        if (formData.nationalite) fd.append('nationalite', formData.nationalite);
        if (formData.dateNaissance) fd.append('date_naissance', formData.dateNaissance);
        if (formData.salaire !== '' && formData.salaire != null) fd.append('salaire_mensuel', formData.salaire);
        if (formData.experience !== '' && formData.experience != null) fd.append('experience_annees', formData.experience);
        if (formData.contact) fd.append('contact', formData.contact);
        if (formData.genre) fd.append('genre', formData.genre);
        if (formData.status) fd.append('status', formData.status);

        // Ajouter l'image de profil si elle existe
        if (profileImage && profileImage instanceof File) {
          fd.append('profile_image', profileImage);
        }

        // Ajouter les fichiers par catégorie
        if (cvFile) {
          fd.append('cv_file', cvFile);
        }
        if (diplomeFile) {
          fd.append('diplome_file', diplomeFile);
        }
        if (contratFile) {
          fd.append('contrat_file', contratFile);
        }

        try {
          const res = await api.put(
            `/api/personnels/${editingPersonnel.id}/with-files`,
            fd,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );

          const updated = res.data;
          const mapped = {
            id: updated.id,
            nom: updated.nom,
            prenom: updated.prenom ?? '',
            fonction: updated.fonction ?? '',
            formation: updated.formation ?? '',
            dateNaissance: updated.date_naissance ?? '',
            salaire: updated.salaire_mensuel ?? '',
            nationalite: updated.nationalite ?? '',
            experience: updated.experience_annees ?? '',
            contact: updated.contact ?? '',
            genre: updated.genre ?? '',
            status: updated.status ?? '',
            profileImage: updated.profile_image
              ? `/api/uploads/personnels/${updated.profile_image}`
              : null,
          };

          setPersonnels(prev => prev.map(p => p.id === mapped.id ? mapped : p));
          handleCloseForm();
          showUpdateSuccess();
          return;
        } catch (error) {
          console.error('Erreur lors de la mise à jour du personnel:', error);
          showError(
            error.response?.data?.detail ||
              'Erreur lors de la mise à jour du personnel'
          );
          return;
        }
      }

      const fd = new FormData();
      if (formData.nom) fd.append('nom', formData.nom);
      if (formData.prenom) fd.append('prenom', formData.prenom);
      if (formData.fonction) fd.append('fonction', formData.fonction);
      if (formData.formation) fd.append('formation', formData.formation);
      if (formData.nationalite) fd.append('nationalite', formData.nationalite);
      if (formData.dateNaissance) fd.append('date_naissance', formData.dateNaissance); // YYYY-MM-DD
      if (formData.salaire !== '' && formData.salaire != null) fd.append('salaire_mensuel', String(formData.salaire));
      if (formData.experience !== '' && formData.experience != null) fd.append('experience_annees', String(formData.experience));
      if (formData.contact) fd.append('contact', formData.contact);
      if (formData.genre) fd.append('genre', formData.genre);
      if (formData.status) fd.append('status', formData.status);

      // Fichiers: image de profil et documents par catégorie
      if (profileImage) fd.append('profile_image', profileImage);
      if (cvFile) fd.append('cv_file', cvFile);
      if (diplomeFile) fd.append('diplome_file', diplomeFile);
      if (contratFile) fd.append('contrat_file', contratFile);

      const res = await api.post('/api/personnels/with-files', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const created = res.data;

      const mapped = {
        id: created.id,
        nom: created.nom,
        prenom: created.prenom ?? '',
        fonction: created.fonction ?? '',
        formation: created.formation ?? '',
        dateNaissance: created.date_naissance ?? '',
        salaire: created.salaire_mensuel ?? '',
        nationalite: created.nationalite ?? '',
        experience: created.experience_annees ?? '',
        contact: created.contact ?? '',
        genre: created.genre ?? '',
        status: created.status ?? '',
        profileImage: imagePreview || null,
      };
      setPersonnels(prev => [mapped, ...prev]);
      handleCloseForm();
      showCreateSuccess();
    } catch (err) {
      console.error('Erreur soumission personnel:', err);
      alert(err.message);
    }
  };

  // Fonction pour afficher l'image du profil
  const renderProfileImage = (personnel) => {
    if (personnel.profileImage) {
      return (
        <img
          src={personnel.profileImage}
          alt={`${personnel.nom} ${personnel.prenom}`}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
        />
      );
    } else {
      return (
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <Person className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>
      );
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Fonction pour formater le genre
  const formatGenre = (genre) => {
    switch (genre) {
      case 'M': return 'Masculin';
      case 'F': return 'Féminin';
      default: return 'Non renseigné';
    }
  };

  // Fonction pour formater le status
  const formatStatus = (status) => {
    switch (status) {
      case 'actif': return 'Actif';
      case 'inactif': return 'Inactif';
      case 'en_conge': return 'En congé';
      default: return 'Non renseigné';
    }
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />

      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Personnels
          </h5>
        </header>

        {/* Indicateurs de progression */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <div className="flex-1 h-0.5 bg-secondary"></div>
        </div>

        {/* Tableau des personnels */}
        <div className="bg-muted rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                  Noms & Prénoms
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                  Fonction
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                  Expérience
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                  Formation
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {personnels.map((personnel) => (
                <tr key={personnel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      {/* Image de profil cliquable */}
                      <button
                        onClick={() => handleOpenDetails(personnel)}
                        className="hover:scale-110 transition-transform duration-200 cursor-pointer"
                        title="Voir les détails"
                      >
                        {renderProfileImage(personnel)}
                      </button>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {personnel.nom} {personnel.prenom}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-gray-700 dark:text-gray-300">
                      {personnel.fonction}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-gray-700 dark:text-gray-300">
                      {personnel.experience + " ans"}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-gray-700 dark:text-gray-300">
                      {personnel.formation}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenForm(personnel)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(personnel.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
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

        {/* Bouton Ajouter un personnel */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handleOpenForm()}
            className="px-6 py-3 bg-muted hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Add className="h-5 w-5" />
            Ajouter un personnel
          </button>
        </div>

        {/* Modal de détails du personnel */}
        {showDetails && selectedPersonnel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header du modal */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Détails du Personnel
                </h3>
                <button
                  onClick={handleCloseDetails}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <Close className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Section gauche : Information Personnel */}
                  <div>
                    {/* Photo de profil et nom */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                        {selectedPersonnel.profileImage ? (
                          <img
                            src={selectedPersonnel.profileImage}
                            alt={`${selectedPersonnel.nom} ${selectedPersonnel.prenom}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Person className="h-10 w-10 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedPersonnel.nom} {selectedPersonnel.prenom}
                        </h4>
                      </div>
                    </div>

                    {/* Titre de la section */}
                    <h5 className="text-lg font-bold text-secondary mb-4 text-center">
                      Information Personnel
                    </h5>

                    {/* Liste des informations */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Nom & Prénoms:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPersonnel.nom} {selectedPersonnel.prenom}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Fonction:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPersonnel.fonction}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Ddn:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedPersonnel.dateNaissance)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatStatus(selectedPersonnel.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Genre:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatGenre(selectedPersonnel.genre)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Nationalité:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPersonnel.nationalite}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Contact:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPersonnel.contact}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Expérience:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPersonnel.experience}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Formation:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPersonnel.formation}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Salaire Mensuel:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPersonnel.salaire ? `${selectedPersonnel.salaire} KMF` : 'Non renseigné'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section droite : Pièces jointes */}
                  <div className="border-l border-gray-300 dark:border-gray-600 pl-8">
                    <h5 className="text-lg font-bold text-secondary mb-4 text-center">
                      Pièces jointes
                    </h5>

                    <div className="space-y-4">
                      {/* CVs */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <h6 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <AttachFile className="h-4 w-4" />
                          CVs
                        </h6>
                        {personnelDocuments && personnelDocuments.cv.length > 0 ? (
                          <div className="space-y-2">
                            {personnelDocuments.cv.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                                <div className="flex items-center gap-2">
                                  <AttachFile className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {doc.original_filename || doc.filename}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleOpenDocumentModal(doc)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                  title="Visualiser le document"
                                >
                                  <Visibility className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-blue-600 dark:text-blue-400">Aucun CV joint</p>
                        )}
                      </div>

                      {/* Diplôme */}
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                        <h6 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                          <AttachFile className="h-4 w-4" />
                          Diplôme
                        </h6>
                        {personnelDocuments && personnelDocuments.diplome.length > 0 ? (
                          <div className="space-y-2">
                            {personnelDocuments.diplome.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                                <div className="flex items-center gap-2">
                                  <AttachFile className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {doc.original_filename || doc.filename}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleOpenDocumentModal(doc)}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400"
                                  title="Visualiser le document"
                                >
                                  <Visibility className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-green-600 dark:text-green-400">Aucun diplôme joint</p>
                        )}
                      </div>

                      {/* Contrat */}
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                        <h6 className="font-semibold text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                          <AttachFile className="h-4 w-4" />
                          Contrat
                        </h6>
                        {personnelDocuments && personnelDocuments.contrat.length > 0 ? (
                          <div className="space-y-2">
                            {personnelDocuments.contrat.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                                <div className="flex items-center gap-2">
                                  <AttachFile className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {doc.original_filename || doc.filename}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleOpenDocumentModal(doc)}
                                  className="text-orange-600 hover:text-orange-800 dark:text-orange-400"
                                  title="Visualiser le document"
                                >
                                  <Visibility className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-orange-600 dark:text-orange-400">Aucun contrat joint</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal du formulaire */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header du modal */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPersonnel ? 'Modifier le personnel' : 'Ajouter un personnel'}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <Close className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Contenu du formulaire */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Section Avatar avec upload d'image */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Aperçu profil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Person className="h-10 w-10 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>

                    {/* Bouton d'upload d'image */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-secondary hover:bg-secondary-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                      title="Changer la photo"
                    >
                      <PhotoCamera className="h-4 w-4" />
                    </button>

                    {/* Bouton de suppression d'image */}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeProfileImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                        title="Supprimer la photo"
                      >
                        <Close className="h-3 w-3" />
                      </button>
                    )}

                    {/* Input caché pour l'image */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Grille des champs */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Colonne gauche */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-secondary font-medium mb-2">Noms & Prénoms</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Nom et prénom"
                      />
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">Formation</label>
                      <input
                        type="text"
                        name="formation"
                        value={formData.formation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Formation"
                      />
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">Date de naissance</label>
                      <input
                        type="date"
                        name="dateNaissance"
                        value={formData.dateNaissance}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">Salaire mensuel (KMF)</label>
                      <input
                        type="number"
                        name="salaire"
                        value={formData.salaire}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Salaire en KMF"
                      />
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-secondary font-medium mb-2">Fonction</label>
                      <input
                        type="text"
                        name="fonction"
                        value={formData.fonction}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Fonction"
                      />
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">Nationalité</label>
                      <input
                        type="text"
                        name="nationalite"
                        value={formData.nationalite}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Nationalité"
                      />
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">Année d'expérience</label>
                      <input
                        type="text"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Expérience"
                      />
                    </div>

                    <div>
                      <label className="block text-secondary font-medium mb-2">Contact</label>
                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                  </div>
                </div>

                {/* Champs du milieu */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-secondary font-medium mb-2">Genre</label>
                    <select
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-secondary font-medium mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="en_conge">En congé</option>
                    </select>
                  </div>
                </div>

                {/* Section des fichiers par catégorie */}
                <div className="mt-6 space-y-6">
                  {/* CV */}
                  <div>
                    <label className="block text-secondary font-medium mb-2">CV</label>

                    {/* Documents existants */}
                    {editingPersonnel && existingCvFiles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Documents existants :</p>
                        <div className="space-y-2">
                          {existingCvFiles.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
                              <div className="flex items-center gap-2">
                                <AttachFile className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {doc.original_filename || doc.filename}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenDocumentModal(doc)}
                                  className="p-1 text-blue-500 hover:text-blue-700"
                                  title="Visualiser le document"
                                >
                                  <Visibility className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExistingCvFile(doc.id)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Supprimer"
                                >
                                  <Close className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => cvInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-200 dark:bg-blue-600 hover:bg-blue-300 dark:hover:bg-blue-500 text-blue-700 dark:text-blue-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        <AttachFile className="h-4 w-4" />
                        {editingPersonnel ? 'Ajouter/Remplacer CV' : 'Choisir CV'}
                      </button>
                      {cvFile && (
                        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{cvFile.name}</span>
                          <button
                            type="button"
                            onClick={removeCvFile}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Close className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Diplôme */}
                  <div>
                    <label className="block text-secondary font-medium mb-2">Diplôme</label>

                    {/* Documents existants */}
                    {editingPersonnel && existingDiplomeFiles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Documents existants :</p>
                        <div className="space-y-2">
                          {existingDiplomeFiles.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border">
                              <div className="flex items-center gap-2">
                                <AttachFile className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {doc.original_filename || doc.filename}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenDocumentModal(doc)}
                                  className="p-1 text-green-500 hover:text-green-700"
                                  title="Visualiser le document"
                                >
                                  <Visibility className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExistingDiplomeFile(doc.id)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Supprimer"
                                >
                                  <Close className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => diplomeInputRef.current?.click()}
                        className="px-4 py-2 bg-green-200 dark:bg-green-600 hover:bg-green-300 dark:hover:bg-green-500 text-green-700 dark:text-green-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        <AttachFile className="h-4 w-4" />
                        {editingPersonnel ? 'Ajouter/Remplacer Diplôme' : 'Choisir Diplôme'}
                      </button>
                      {diplomeFile && (
                        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{diplomeFile.name}</span>
                          <button
                            type="button"
                            onClick={removeDiplomeFile}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Close className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={diplomeInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleDiplomeUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Contrat */}
                  <div>
                    <label className="block text-secondary font-medium mb-2">Contrat</label>

                    {/* Documents existants */}
                    {editingPersonnel && existingContratFiles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Documents existants :</p>
                        <div className="space-y-2">
                          {existingContratFiles.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded border">
                              <div className="flex items-center gap-2">
                                <AttachFile className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {doc.original_filename || doc.filename}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenDocumentModal(doc)}
                                  className="p-1 text-orange-500 hover:text-orange-700"
                                  title="Visualiser le document"
                                >
                                  <Visibility className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExistingContratFile(doc.id)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Supprimer"
                                >
                                  <Close className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => contratInputRef.current?.click()}
                        className="px-4 py-2 bg-orange-200 dark:bg-orange-600 hover:bg-orange-300 dark:hover:bg-orange-500 text-orange-700 dark:text-orange-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        <AttachFile className="h-4 w-4" />
                        {editingPersonnel ? 'Ajouter/Remplacer Contrat' : 'Choisir Contrat'}
                      </button>
                      {contratFile && (
                        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{contratFile.name}</span>
                          <button
                            type="button"
                            onClick={removeContratFile}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Close className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={contratInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleContratUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-secondary hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    {editingPersonnel ? 'Modifier' : 'Ajouter'}
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
          message="Voulez-vous vraiment supprimer ce personnel ? "
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          destructive
          onConfirm={handleConfirmDelete}
          onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
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

export default Personnels