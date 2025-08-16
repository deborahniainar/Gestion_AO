import React, { useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { jsPDF } from "jspdf";
import {
  CloudDownload,
  Help,
  Add,
  Edit,
  Delete,
  Person,
  Close,
  ArrowBack,
  AttachFile,
  PhotoCamera,
  Upload,
  Visibility
} from "@mui/icons-material";

const Personnels = () => {
  const [personnels] = useState([
    {
      id: 1,
      nom: "Dupont",
      prenom: "Jean",
      fonction: "Ingénieur",
      experience: "5 ans",
      formation: "Master en Génie Civil",
      profileImage: null,
      dateNaissance: "1990-05-15",
      salaire: "150000",
      nationalite: "Française",
      contact: "+261 34 12 345 67",
      genre: "M",
      status: "actif"
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // Références pour les inputs de fichiers
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleOpenForm = (personnel = null) => {
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
    }
    // Réinitialiser les fichiers
    setAttachedFiles([]);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPersonnel(null);
    setProfileImage(null);
    setAttachedFiles([]);
    setImagePreview(null);
  };

  // Fonction pour ouvrir le modal de détails
  const handleOpenDetails = (personnel) => {
    setSelectedPersonnel(personnel);
    setShowDetails(true);
  };

  // Fonction pour fermer le modal de détails
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPersonnel(null);
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

  // Supprimer l'image de profil
  const removeProfileImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Créer un FormData pour envoyer les fichiers
    const submitData = new FormData();
    
    // Ajouter les données du formulaire
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    // Ajouter l'image de profil
    if (profileImage) {
      submitData.append('profileImage', profileImage);
    }
    
    // Ajouter les fichiers joints
    attachedFiles.forEach((file, index) => {
      submitData.append(`attachedFile_${index}`, file);
    });

    // Logique pour suavegarder les données
    if (editingPersonnel) {
      console.log('Modification du personnel:', formData);
      console.log('Image de profil:', profileImage);
      console.log('Fichiers joints:', attachedFiles);
      
      // Mettre à jour le personnel existant dans la liste
      const updatedPersonnels = personnels.map(p => 
        p.id === editingPersonnel.id 
          ? { 
              ...p, 
              ...formData, 
              profileImage: imagePreview || p.profileImage 
            }
          : p
      );
      // Etat global à envoyer au serveur
      console.log('Personnel mis à jour:', updatedPersonnels);
      
    } else {
      console.log('Ajout d\'un nouveau personnel:', formData);
      console.log('Image de profil:', profileImage);
      console.log('Fichiers joints:', attachedFiles);
      
      // Créer un nouveau personnel
      const newPersonnel = {
        id: Date.now(), // ID temporaire
        ...formData,
        profileImage: imagePreview
      };
      // Etat global à envoyer au serveur
      console.log('Nouveau personnel:', newPersonnel);
    }
    
    handleCloseForm();
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
    switch(genre) {
      case 'M': return 'Masculin';
      case 'F': return 'Féminin';
      default: return 'Non renseigné';
    }
  };

  // Fonction pour formater le status
  const formatStatus = (status) => {
    switch(status) {
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
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 bg-muted border-b border-muted-50 rounded-lg mb-6 shadow-md">
                <h5 className="text-xl font-bold text-secondary m-0">
                    Gestion des Personnels
                </h5>

                <div className="flex gap-3">
                    <button className="p-2 text-primary hover:text-accent transition-colors duration-200">
                        <CloudDownload className="h-10 w-10" />
                    </button>
                    <button className="p-2 text-primary hover:text-accent transition-colors duration-200">
                        <Help className="h-8 w-8" />
                    </button>
                </div>
            </header>

            {/* Indicateurs de progression */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <div className="flex-1 h-0.5 bg-pink-400"></div>
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
                                        {personnel.experience}
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
                                        <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200" title="Supprimer">
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
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <h6 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">CVs</h6>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Aucun CV joint</p>
                                        </div>
                                        
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <h6 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Diplôme</h6>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Aucun diplôme joint</p>
                                        </div>
                                        
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <h6 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Contrat</h6>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Aucun contrat joint</p>
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

                            {/* Section des fichiers joints */}
                            <div className="mt-6">
                                <label className="block text-secondary font-medium mb-3">Fichiers joints</label>
                                
                                {/* Bouton pour joindre des fichiers */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Fichiers sélectionnés :</h4>
                                        {attachedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <AttachFile className="h-5 w-5 text-gray-500" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                                                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachedFile(index)}
                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                >
                                                    <Close className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
        </main> 
    </div>
  )
}

export default Personnels