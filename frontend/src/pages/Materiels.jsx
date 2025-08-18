import React, { useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import {
  CloudDownload,
  Help,
  Add,
  Edit,
  Delete,
  Close,
  AttachFile,
  Description,
} from "@mui/icons-material";

const Materiel = () => {
  const [Materiel, setMateriel] = useState([
    {
      id: 1,
      nombre: 1,
      designation: "Pick Up",
      marque: "Mitsubishi",
      modele: "L 200",
      annee: 2016,
      piecesJointes: [
        { id: 1, nom: "Facture.pdf", type: "pdf", taille: "245 KB" },
        { id: 2, nom: "Contrat.docx", type: "docx", taille: "156 KB" },
        { id: 3, nom: "Photo.jpg", type: "jpg", taille: "1.2 MB" }
      ]
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState(null);
  const [showPiecesJointes, setShowPiecesJointes] = useState(false);
  const [selectedMateriel, setSelectedMateriel] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    designation:'',
    marque:'',
    modele: '',
    annee: ''
  });

  // États pour les fichiers
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Référence pour l'input de fichiers
  const fileInputRef = useRef(null);

  const handleOpenForm = (materiel = null) => {
    if (materiel) {
      setEditingMateriel(materiel);
      setFormData({
        nombre: materiel.nombre || '',
        designation: materiel.designation || '',
        marque: materiel.marque || '',
        modele: materiel.modele || '',
        annee: materiel.annee || ''
      });
      // Charger les pièces jointes existantes
      setAttachedFiles(materiel.piecesJointes ? materiel.piecesJointes.map(piece => ({
        name: piece.nom,
        size: piece.taille,
        type: piece.type,
        id: piece.id
      })) : []);
    } else {
      setEditingMateriel(null);
      setFormData({
        nombre: '',
        designation: '',
        marque: '',
        modele: '',
        annee: ''
      });
      setAttachedFiles([]);
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

  // Fonction pour supprimer un matériel
  const handleDeleteMateriel = (materielId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
      const updatedMateriel = Materiel.filter(m => m.id !== materielId);
      setMateriel(updatedMateriel);
      console.log('Matériel supprimé:', materielId);
    }
  };

  // Fonction pour télécharger une pièce jointe
  const handleDownloadPiece = (piece) => {
    // Créer un lien temporaire pour le téléchargement
    const link = document.createElement('a');
    link.href = `#`; // Ici vous mettriez l'URL réelle du fichier
    link.download = piece.nom;
    link.click();
    console.log('Téléchargement de:', piece.nom);
  };

  // Fonction pour supprimer une pièce jointe
  const handleDeletePiece = (materielId, pieceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette pièce jointe ?')) {
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
    }
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Valider le formulaire avant soumission
    if (!validateForm()) {
      return;
    }
    
    // Convertir les fichiers joints en format compatible
    const piecesJointes = attachedFiles.map((file, index) => ({
      id: file.id || Date.now() + index,
      nom: file.name || file.nom,
      type: (file.name || file.nom).split('.').pop().toLowerCase(),
      taille: file.size || file.taille || `${(file.size || 0 / 1024).toFixed(1)} KB`
    }));

    if (editingMateriel) {
      // Modification du matériel existant
      const updatedMateriel = Materiel.map(m => 
        m.id === editingMateriel.id 
          ? { ...m, ...formData, piecesJointes }
          : m
      );
      setMateriel(updatedMateriel);
      console.log('Matériel modifié:', { ...formData, piecesJointes });
    } else {
      // Ajout d'un nouveau matériel
      const newMateriel = {
        id: Date.now(),
        ...formData,
        piecesJointes
      };
      setMateriel(prev => [...prev, newMateriel]);
      console.log('Nouveau matériel ajouté:', newMateriel);
    }
    
    handleCloseForm();
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

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (type) => {
    switch(type) {
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

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
        <Sidebar />   
        <main className='flex-1 p-4 lg:ml-64 ml-16'>
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
                <h5 className="text-xl font-bold text-secondary m-0">
                    Gestion des Materiels
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
                                            onClick={() => handleDeleteMateriel(materiel.id)}
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
                                                    onClick={() => handleDownloadPiece(piece)}
                                                    className="p-2 text-info hover:text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded transition-colors duration-200" 
                                                    title="Télécharger"
                                                >
                                                    <CloudDownload className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeletePiece(selectedMateriel.id, piece.id)}
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
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${
                                                formErrors.designation 
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
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${
                                                formErrors.modele 
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
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${
                                                formErrors.marque 
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
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${
                                                formErrors.annee 
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
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent ${
                                                formErrors.nombre 
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
                                            <div key={file.id || index} className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <AttachFile className="h-5 w-5 text-neutral-500" />
                                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                        {file.name || file.nom}
                                                    </span>
                                                    <span className="text-xs text-neutral-500">
                                                        ({file.size || file.taille})
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachedFile(index)}
                                                    className="p-1 text-danger hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded"
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
        </main> 
    </div>
  )
}

export default Materiel