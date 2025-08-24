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
import { apiWithNotifications } from "../services/api";
import { useDao } from "../contexts/DaoContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    resetDaoProcess,
  } = useDao();
  const [uploadError, setUploadError] = useState("");

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

  const handleEditInWord = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!daoDocId) return;
    const resp = await apiWithNotifications.post("/dao/generate_docx", {
      document_id: daoDocId,
      content_markdown: summary, // votre table markdown
    });
    const path = resp.data.file_path;
    // Navigation SPA pour éviter un reload qui purge potentiellement l'état
    const q = new URLSearchParams({ path, title: "DAO.docx" }).toString();
    window.history.pushState({}, "", `/word-editor?${q}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const currentStep = getCurrentStep();
  const progressPercent = currentStep * 25;

  const stepLabels = [
    "1 Téléverser le DAO",
    "2 Extraction du fichier",
    "3 Résumé du fichier",
    "4 Documents à soumettre",
  ];

  const handleSubmitKeywords = async () => {
    if (!keywords.trim()) {
      showWarning("Veuillez saisir des mots-clés");
      return;
    }
    if (!daoDocId) {
      showError("Aucun document DAO téléversé");
      return;
    }
    try {
      const { data } = await apiWithNotifications.post("/dao/extract_summary", {
        document_id: daoDocId,
        keywords,
      });
      setSummary((data.table_markdown && data.table_markdown.trim()) ? data.table_markdown : (data.summary || ""));
      setKeywordsSubmitted(true);
      showSuccess("Résumé généré");
    } catch {}
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

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   

      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des documents d'Appel d'Offre
          </h5>
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
        {uploadConfirmed && file && (
          <div className="rounded-lg">
            <div className="flex">

              <div className="flex-1 p-6">
                <div>
                  <h3 className="font-bold text-xl text-secondary mb-4">
                    Extraction du fichier {file?.name || ""}
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
                      <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {summary}
                        </ReactMarkdown>
                      </div>
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
                          title="Éditer dans Word"
                          onClick={handleEditInWord}
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

              <div className="flex-1 p-6">
                <div>
                  <h3 className="font-bold text-xl text-secondary">
                    Liste des documents à soumettre
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {requiredDocs.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white rounded-md p-3">
                        <span className={`mt-1 h-2 w-2 rounded-full ${d.obligatoire ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                        <div>
                          <div className="font-semibold text-gray-800">{d.type}</div>
                          <div className="text-sm text-gray-600">{d.description}</div>
                          {d.obligatoire && <div className="text-xs text-red-600">Obligatoire</div>}
                        </div>
                      </li>
                    ))}
                    {requiredDocs.length === 0 && (
                      <li className="text-sm text-gray-600">Aucun élément</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}