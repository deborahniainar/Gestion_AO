import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  CloudDownload,
  Help,
  CloudUpload,
  ChecklistOutlined,
  Edit,
  Download,
  Check
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import useNotifications from "../hooks/useNotifications";
import Image1 from "../assets/Image1.png";
import Image2 from "../assets/Image2.png";
import Image3 from "../assets/Image3.png";
import Image4 from "../assets/Image4.png";

export default function GestionDAO() {
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadConfirmed, setUploadConfirmed] = useState(false);
  const [keywordsSubmitted, setKeywordsSubmitted] = useState(false);
  const [showList, setShowList] = useState(false);
  const [summary, setSummary] = useState("Le présent Appel d'Offre concerne .............");
  const [editingSummary, setEditingSummary] = useState(false);

  const { 
    showSuccess, 
    showError, 
    showInfo, 
    showWarning,
    showUploadSuccess,
    showUploadError,
    showDownloadSuccess,
    showLoading,
    updateLoading
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
      const errorMessage = "Formats autorisés : PDF (.pdf) ou Word (.docx)";
      setUploadError(errorMessage);
      setFile(null);
      e.target.value = "";
      showError(errorMessage);
      return;
    }

    setUploadError("");
    setFile(f);
    setUploadConfirmed(false);
    setKeywordsSubmitted(false);
    setShowList(false);
    showSuccess(`Fichier "${f.name}" sélectionné avec succès`);
  };

  const getCurrentStep = () => {
    if (!file) return 1;
    if (!uploadConfirmed) return 1;
    if (!keywordsSubmitted) return 2;
    if (!showList) return 3;
    return 4;
  };

  const currentStep = getCurrentStep();
  const progressPercent = currentStep * 25;

  const stepLabels = [
    "1 Téléverser le DAO",
    "2 Extraction du fichier",
    "3 Résumé du fichier",
    "4 Documents à soumettre",
  ];

  const handleSubmitKeywords = () => {
    if (!keywords.trim()) {
      showWarning("Veuillez saisir des mots-clés");
      return;
    }
    setKeywordsSubmitted(true);
    showSuccess("Mots-clés soumis avec succès");
  };

  const handleShowList = () => {
    setShowList(true);
    showInfo("Liste des documents générée");
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
      doc.setTextColor(92, 114, 132); // #5C7284
      doc.text("Résumé du DAO", margin, 60);

      doc.setFontSize(12);
      doc.setTextColor(60, 68, 83); // #3c4453
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

  const handleConfirmUpload = () => {
    if (!file) {
      showError("Aucun fichier sélectionné");
      return;
    }
    
    const loadingToast = showLoading("Téléversement en cours...");
    
    // Simuler le téléversement
    setTimeout(() => {
      setUploadConfirmed(true);
      updateLoading(loadingToast, "Fichier téléversé avec succès", "success");
      showUploadSuccess();
    }, 2000);
  };

  return (
    <div className="flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out">
      <Sidebar />

      <main className="flex-1 p-4 lg:ml-64 ml-16">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-muted border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des documents d'Appel d'Offre
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

        {/* Progress Bar + Step Indicator */}
        <div className="mb-6">
          <div className="mb-4 relative">
            <div className="h-5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
          </div>

          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-full text-secondary-50 font-bold text-base mr-3">
              {currentStep}
            </div>
            <span className="font-semibold text-secondary-50 text-base">
              {stepLabels[currentStep - 1]}
            </span>
          </div>
        </div>

        {/* Section 1: Upload */}
        <div className="bg-muted rounded-lg">
          <div className="flex">
            <div className="flex-1 text-center">
              <img src={Image1} alt="Upload du DAO" className="w-full h-full object-cover rounded-l-lg" />
            </div>

            <div className="flex-1 p-6">
              <h3 className="font-bold text-2xl text-primary mb-4">Upload du DAO</h3>

              <div className="p-6 bg-gray-100 rounded-xl">
                <div className="text-center">
                  <CloudUpload className="h-16 w-16 text-gray-600" />
                  <p className="text-gray-600 mb-4">Glissez / déposez votre fichier ici</p>

                  <input
                    type="file"
                    className="w-full mb-4 p-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-primary"
                    accept=".pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleUpload}
                  />

                  {uploadError && <small className="text-yellow-600 block mb-2">{uploadError}</small>}
                  {file && <p className="text-gray-600 mt-2">Fichier sélectionné : {file.name}</p>}

                  <button
                    className="mt-4 px-6 py-3 bg-primary text-main font-semibold rounded-lg hover:bg-accent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirmUpload}
                    disabled={!file || !!uploadError}
                  >
                    Téléverser
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Extraction */}
        {uploadConfirmed && (
          <div className="rounded-lg">
            <div className="flex">
              <div className="flex-1 text-center">
                <img src={Image2} alt="Extraction du fichier" className="w-full h-full object-cover rounded-l-lg" />
              </div>

              <div className="flex-1 p-6">
                <div>
                  <h3 className="font-bold text-xl text-secondary mb-4">
                    Extraction du fichier {file.name}
                  </h3>

                  <p className="text-gray-600 mb-4 text-sm">
                    Entrez des mots clés pour une meilleur résumé
                  </p>

                  <div className="mb-6">
                    <textarea
                      className="w-full p-4 bg-gray-100 border-none rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary"
                      rows="6"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="Ex: date limite, blabla"
                    />
                  </div>

                  <div className="text-right">
                    <button
                      className="px-6 py-2 bg-secondary text-main font-semibold rounded-lg hover:bg-secondary-50 transition-colors duration-200 shadow-md"
                      onClick={handleSubmitKeywords}
                    >
                      Soumettre
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Résumé */}
        {keywordsSubmitted && (
          <div className="bg-muted rounded-lg">
            <div className="flex">
              <div className="flex-1 text-center">
                <img src={Image3} alt="Résumé du fichier" className="w-full h-full object-cover rounded-l-lg" />
              </div>

              <div className="flex-1 p-6">
                <div>
                  <h3 className="font-bold text-xl text-primary mb-4">Résumé du DAO</h3>

                  <div className="bg-gray-100 rounded-2xl min-h-64 p-5 relative">
                    {editingSummary ? (
                      <textarea
                        className="w-full h-full bg-transparent border-none resize-none p-0 text-gray-800 text-sm focus:outline-none"
                        rows="6"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-800 text-sm">{summary}</p>
                    )}

                    <div className="absolute right-4 bottom-3 flex items-center gap-3 text-gray-800">
                      <button className="p-0 hover:text-secondary-50 transition-colors duration-200" title="Mettre en forme">
                        <ChecklistOutlined className="h-6 w-6" />
                      </button>

                      {editingSummary ? (
                        <button
                          className="p-0 hover:text-secondary-50 transition-colors duration-200"
                          title="Valider"
                          onClick={() => {
                            setEditingSummary(false);
                            showSuccess("Résumé mis à jour avec succès");
                          }}
                        >
                          <Check className="h-6 w-6" />
                        </button>
                      ) : (
                        <button
                          className="p-0 hover:text-secondary-50 transition-colors duration-200"
                          title="Éditer"
                          onClick={() => {
                            setEditingSummary(true);
                            showInfo("Mode édition activé");
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        className="p-0 hover:text-secondary-50 transition-colors duration-200"
                        title="Télécharger"
                        onClick={handleDownloadPDF}
                      >
                        <Download className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right mt-4">
                    <h6 className="mb-2 text-primary">Cliquez ici pour voir les listes de documents à soumettre</h6>
                    <button 
                      className="px-6 py-2 bg-primary text-main font-semibold rounded-lg hover:bg-accent transition-colors duration-200 shadow-md"
                      onClick={handleShowList}
                    >
                      Voir plus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Liste des documents */}
        {showList && (
          <div className="bg-gray-200 rounded-lg">
            <div className="flex">
              <div className="flex-1 text-center">
                <img src={Image4} alt="Liste documents" className="w-full h-full object-cover rounded-l-lg" />
              </div>

              <div className="flex-1 p-6">
                <div>
                  <h3 className="font-bold text-xl text-secondary">
                    Liste des documents à soumettre
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}