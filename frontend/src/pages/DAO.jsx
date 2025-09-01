import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  Help,
  CloudUpload,
  ChecklistOutlined,
  Edit,
  Download,
  Check,
  Settings,
  AutoAwesome,
  Psychology,
  Search,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import useNotifications from "../hooks/useNotifications";
import { apiWithNotifications } from "../services/api";
import { useDao } from "../contexts/DaoContext";
import { Editor } from "@tinymce/tinymce-react";

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || "";

export default function GestionDAO() {
  const {
    file, setFile,
    daoDocId, setDaoDocId,
    keywords, setKeywords,
    uploadConfirmed, setUploadConfirmed,
    keywordsSubmitted, setKeywordsSubmitted,
    showList, setShowList,
    summary, setSummary,
    editingSummary, setEditingSummary,
    requiredDocs, setRequiredDocs,
  } = useDao();

  const [uploadError, setUploadError] = useState("");
  const [extractionMode, setExtractionMode] = useState("smart");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  // New modal state and helpers to replace prompt/confirm
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLotName, setNewLotName] = useState("");

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameIdx, setRenameIdx] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);

  const {
    showSuccess,
    showError,
    showInfo,
    showUploadSuccess,
    showDownloadSuccess,
    showLoading,
    updateLoading,
  } = useNotifications();

  const handleUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExts = [".pdf", ".docx"];
    const hasValidMime = allowedMimes.includes(f.type);
    const hasValidExt = allowedExts.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!(hasValidMime || hasValidExt)) {
      const msg = "Formats autorisés : PDF (.pdf) ou Word (.docx)";
      setUploadError(msg);
      setFile(null);
      e.target.value = "";
      showError(msg);
      return;
    }
    setUploadError("");
    setFile(f);
    setUploadConfirmed(false);
    setKeywordsSubmitted(false);
    setShowList(false);
    showSuccess(`Fichier "${f.name}" sélectionné avec succès`);
  };

  const handleConfirmUpload = async () => {
    if (!file) {
      showError("Aucun fichier sélectionné");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      const resp = await apiWithNotifications.post("/dao/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = resp.data || {};
      setDaoDocId(data.document_id);
      setUploadConfirmed(true);
      showUploadSuccess();
    } catch {}
  };

  const getCurrentStep = () => {
    if (!file) return 1;
    if (!uploadConfirmed) return 1;
    if (!keywordsSubmitted) return 2;
    if (!showList) return 3;
    return 4;
  };

  const handleEditInWord = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!daoDocId) return;
    setEditingSummary(true);
    showInfo("Vous pouvez maintenant éditer le résumé directement");
  };

  const handleSubmitKeywords = async () => {
    if (!daoDocId) {
      showError("Aucun document DAO téléversé");
      return;
    }
    if ((extractionMode === "keywords" || extractionMode === "structured") && !keywords.trim()) {
      showError("Les mots-clés sont obligatoires pour ce mode d'extraction");
      return;
    }
    setIsExtracting(true);
    setExtractionProgress(0);
    const progressInterval = setInterval(() => {
      setExtractionProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    try {
      const { data } = await apiWithNotifications.post("/dao/extract_summary", {
        document_id: daoDocId,
        keywords: keywords.trim() || undefined,
        extraction_mode: extractionMode,
      });
      clearInterval(progressInterval);
      setExtractionProgress(100);
      const content = (data.table_markdown && data.table_markdown.trim()) ? data.table_markdown : (data.summary || "");
      if (!content.trim()) {
        showError("L'extraction n'a pas pu générer de contenu.");
        setKeywordsSubmitted(false);
        return;
      }
      setSummary(content);
      setKeywordsSubmitted(true);
      showSuccess("Résumé généré");
      if (data.text_length) {
        showInfo(`Document traité : ${data.text_length} caractères extraits`);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setExtractionProgress(0);
      setKeywordsSubmitted(false);
      showError("Erreur lors de l'extraction du résumé.");
    } finally {
      setIsExtracting(false);
      setTimeout(() => setExtractionProgress(0), 1000);
    }
  };

  const handleShowList = async () => {
    if (!daoDocId) {
      showError("Aucun document DAO téléversé");
      return;
    }
    try {
      const { data } = await apiWithNotifications.get(`/dao/${daoDocId}/required_documents`);
      setRequiredDocs(data || []);
      setShowList(true);
      showInfo("Liste des documents générée");
    } catch {}
  };

  const handleDownloadPDF = () => {
    const loadingToast = showLoading("Génération du PDF en cours...");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(20);
      doc.setTextColor(92, 114, 132);
      doc.text("Résumé du DAO", margin, 60);
      doc.setFontSize(12);
      doc.setTextColor(60, 68, 83);
      const lines = doc.splitTextToSize(summary || "", maxWidth);
      doc.text(lines, margin, 100, { maxWidth });
      doc.save("resume_dao.pdf");
      updateLoading(loadingToast, "PDF généré avec succès", "success");
      showDownloadSuccess();
    } catch (error) {
      updateLoading(loadingToast, "Erreur lors de la génération du PDF", "error");
      showError("Erreur lors de la génération du PDF");
    }
  };

  const getExtractionModeDescription = (mode) => {
    const descriptions = {
      smart: "Résumé intelligent",
      structured: "Extraction structurée (mots-clés requis)",
      keywords: "Extraction ciblée (mots-clés requis)",
    };
    return descriptions[mode] || "";
  };

  const currentStep = getCurrentStep();

    // Gestion des lots
  const openAddModal = () => {
    setNewLotName("");
    setShowAddModal(true);
  };

  const confirmAddLot = () => {
    if (!newLotName.trim()) {
      showError("Le nom du lot est obligatoire");
      return;
    }
    setRequiredDocs((prev) => [...(prev || []), { lotName: newLotName }]);
    setShowAddModal(false);
    setNewLotName("");
    showSuccess("Lot ajouté avec succès");
  };

  const openRenameModal = (idx) => {
    setRenameIdx(idx);
    setRenameValue(requiredDocs[idx]?.lotName || "");
    setShowRenameModal(true);
  };

  const confirmRename = () => {
    if (!renameValue.trim()) {
      showError("Le nouveau nom est obligatoire");
      return;
    }
    setRequiredDocs((prev) => {
      const updated = [...prev];
      updated[renameIdx] = { ...updated[renameIdx], lotName: renameValue };
      return updated;
    });
    setShowRenameModal(false);
    setRenameIdx(null);
    setRenameValue("");
    showSuccess("Lot renommé avec succès");
  };

  const openDeleteModal = (idx) => {
    setDeleteIdx(idx);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setRequiredDocs((prev) => prev.filter((_, i) => i !== deleteIdx));
    setShowDeleteModal(false);
    setDeleteIdx(null);
    showSuccess("Lot supprimé avec succès");
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">Gestion des documents d'Appel d'Offre</h5>
        </header>

        {/* Top progress replaced by per-section timeline to the left */}

        {/* Section 1: Upload du DAO */}
        <div className={"bg-muted dark:bg-accent rounded-t-lg p-2 flex"}>
          <div className="w-16 flex flex-col items-center pr-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-base transition-all duration-200 ${1 <= currentStep ? 'bg-primary text-main' : 'bg-gray-400 text-primary'}`}>1</div>
            <div className={`flex-1 w-2 rounded-2xl mt-2 ${1 < currentStep ? 'bg-primary' : 'bg-main'}`}></div>
          </div>
          <div className="flex-1 p-6">
            <h3 className="font-bold text-2xl text-primary mb-4">Upload du DAO</h3>
            <div className="p-6 bg-main dark:bg-primary rounded-xl">
              <div className="text-center">
                <p className="text-primary dark:text-main mb-4">Glissez / déposez votre fichier ici</p>
                <div className="flex justify-between gap-5">
                  <CloudUpload style={{fontSize: 55}} className="h-16 w-16 text-primary dark:text-main" />
                  <input type="file" className="w-full p-3 border-2 border-primary dark:border-main rounded-lg" accept=".pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleUpload} />
                </div>
                
                {uploadError && <small className="text-yellow-600 block mb-2">{uploadError}</small>}
                {file && <p className="text-accent dark:text-main mt-2">Fichier sélectionné : {file.name}</p>}
                <button className="mt-4 px-6 py-3 bg-primary dark:bg-accent text-main font-semibold rounded-lg disabled:opacity-50" onClick={handleConfirmUpload} disabled={!file || !!uploadError}>Téléverser</button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Extraction du fichier */}
        {uploadConfirmed && file && (
          <div className={"bg-muted dark:bg-accent flex"}>
            <div className="w-16 flex flex-col items-center p-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-base ${2 <= currentStep ? 'bg-secondary text-main' : 'bg-gray-400 text-gray-600'}`}>2</div>
              <div className={`flex-1 w-2 rounded-2xl mt-2 ${2 < currentStep ? 'bg-secondary' : 'bg-secondary-50'}`}></div>
            </div>
            <div className="flex-1 p-6">
              <h3 className="font-bold text-xl text-secondary mb-4">Extraction du fichier {file?.name || ""}</h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-accent dark:text-secondary-50 mb-2">Mots-clés</label>
                <textarea className="w-full p-4 bg-main dark:bg-primary border-none rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary" rows="4" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Ex: date limite, garantie, montant, lots, exigences techniques..." />
              </div>
              <div className="text-right">
                <button className={`px-6 py-3 font-semibold rounded-lg transition-colors duration-200 shadow-md ${isExtracting ? 'bg-muted text-gray-600 cursor-not-allowed' : 'bg-secondary text-main hover:bg-secondary-50'}`} onClick={handleSubmitKeywords} disabled={isExtracting}>
                  {isExtracting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Extraction en cours...
                    </div>
                  ) : (
                    <>
                      <Psychology className="h-5 w-5 mr-2" />
                      Extraire le résumé
                    </>
                  )}
                </button>
              </div>
              {isExtracting && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full transition-all duration-300" style={{ width: `${extractionProgress}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">{extractionProgress}% - Traitement en cours...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Résumé du DAO */}
        {keywordsSubmitted && (
          <div className={"bg-muted dark:bg-accent p-2 flex"}>
            <div className="w-16 flex flex-col items-center pr-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-base ${3 <= currentStep ? 'bg-primary text-main' : 'bg-main text-primary'}`}>3</div>
              <div className={`flex-1 w-2 rounded-2xl mt-2 ${3 < currentStep ? 'bg-primary' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex-1 p-6">
              <h3 className="font-bold text-xl text-primary mb-4">Résumé du DAO</h3>
              <div className="bg-main dark:bg-primary rounded-2xl min-h-64 p-5 relative">
                {editingSummary ? (
                  <Editor
                    apiKey={TINYMCE_API_KEY}
                    value={summary}
                    onEditorChange={(content) => setSummary(content)}
                    init={{
                      height: 500,
                      menubar: false,
                      plugins: [
                        'advlist','autolink','lists','link','image','charmap','preview','anchor','searchreplace','visualblocks','code','fullscreen','insertdatetime','media','table','help','wordcount'
                      ],
                      toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                      branding: false,
                    }}
                  />
                ) : (
                  <Editor apiKey={TINYMCE_API_KEY} value={summary} init={{ height: 500, menubar: false, toolbar: false, branding: false, readonly: 1 }} />
                )}
                <div className="absolute right-4 bottom-3 flex items-center gap-3 text-gray-800">
                  <button className="p-0 hover:text-secondary-50" title="Mettre en forme">
                    <ChecklistOutlined className="h-6 w-6" />
                  </button>
                  {editingSummary ? (
                    <button className="p-0 hover:text-secondary-50" title="Valider" onClick={() => { setEditingSummary(false); showSuccess("Résumé mis à jour"); }}>
                      <Check className="h-6 w-6" />
                    </button>
                  ) : (
                    <button className="p-0 hover:text-secondary-50" title="Éditer" onClick={handleEditInWord}>
                      <Edit className="h-5 w-5" />
                    </button>
                  )}
                  <button className="p-0 hover:text-secondary-50" title="Télécharger" onClick={handleDownloadPDF}>
                    <Download className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="text-right mt-4">
                <button className="px-6 py-2 bg-primary text-main font-semibold rounded-lg hover:bg-accent" onClick={handleShowList}>Suivant</button>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Créer des lots */}
        {showList && (
          <div className={"bg-muted rounded-b-lg dark:bg-accent flex p-2"}>
            <div className="w-16 flex flex-col items-center pr-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-base ${4 <= currentStep ? 'bg-secondary text-muted' : 'bg-gray-400 text-gray-600'}`}>4</div>
              {/* last connector: shorter or hidden */}
              <div className={`w-2 h-full rounded-2xl mt-2 ${4 < currentStep ? 'bg-secondary' : 'bg-secondary'}`}></div>
            </div>

            <div className="flex-1 p-6">
              <h3 className="font-bold text-xl text-secondary">Créez des Lots et Enregistrez le DAO</h3>
              <p className="text-sm text-gray-600 mb-4">Ajoutez des lots, modifiez leur nom, supprimez-les et enregistrez le DAO.</p>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-secondary text-white rounded hover:opacity-90"
                  >
                    Ajouter un lot
                  </button>

                  <button
                    onClick={async () => {
                      if (!daoDocId) { showError("Téléversez et confirmez le DAO avant d'enregistrer."); return; }
                      try {
                        const payload = { document_id: daoDocId, lots: requiredDocs || [] };
                        await apiWithNotifications.post('/dao/save', payload);
                        showSuccess('DAO enregistré avec succès');
                      } catch {
                        showError("Erreur lors de l'enregistrement du DAO");
                      }
                    }}
                    className="px-4 py-2 bg-primary text-main rounded hover:opacity-90"
                  >
                    Enregistrer le DAO
                  </button>
                </div>

                <div className="text-sm text-gray-500">Nombre de lots créés : <span className="font-semibold text-gray-800">{(requiredDocs || []).length}</span></div>
              </div>

              <div className="bg-white dark:bg-primary rounded-md p-3 border border-gray-100">
                <h4 className="font-semibold mb-3">Liste des lots</h4>
                {(requiredDocs || []).length > 0 ? (
                  <ul className="space-y-2">
                    {(requiredDocs || []).map((lot, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">{idx + 1}</div>
                          <div>
                            <div className="font-medium">{lot.lotName || lot.type || `Lot ${idx + 1}`}</div>
                            <div className="text-xs text-gray-500">{lot.description || ''}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openRenameModal(idx)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => openDeleteModal(idx)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">Aucun lot créé pour le moment. Cliquez sur "Ajouter un lot" pour en créer.</div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-primary rounded-lg p-6 w-full max-w-md">
              <h4 className="font-semibold mb-3">Ajouter un lot</h4>
              <input className="w-full p-2 border rounded mb-4" value={newLotName} onChange={(e) => setNewLotName(e.target.value)} placeholder="Nom du lot" />
              <div className="flex justify-end gap-3">
                <button className="px-3 py-2" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button className="px-3 py-2 bg-secondary text-white rounded" onClick={confirmAddLot}>Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-primary rounded-lg p-6 w-full max-w-md">
              <h4 className="font-semibold mb-3">Renommer le lot</h4>
              <input className="w-full p-2 border rounded mb-4" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
              <div className="flex justify-end gap-3">
                <button className="px-3 py-2" onClick={() => setShowRenameModal(false)}>Annuler</button>
                <button className="px-3 py-2 bg-secondary text-white rounded" onClick={confirmRename}>Valider</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-primary rounded-lg p-6 w-full max-w-md">
              <h4 className="font-semibold mb-3">Supprimer le lot</h4>
              <p>Êtes-vous sûr de vouloir supprimer ce lot ?</p>
              <div className="flex justify-end gap-3 mt-4">
                <button className="px-3 py-2" onClick={() => setShowDeleteModal(false)}>Annuler</button>
                <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={confirmDelete}>Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}