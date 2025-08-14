import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  CloudArrowDown,
  QuestionCircle,
  CloudUpload,
  ListCheck,
  Pencil,
  Download,
  Check
} from "react-bootstrap-icons";
import Sidebar from "../../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import "./DAO.css";
import Image1 from "../../assets/Image1.png";
import Image2 from "../../assets/Image2.png";
import Image3 from "../../assets/Image3.png";
import Image4 from "../../assets/Image4.png";

export default function GestionDAO() {
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadConfirmed, setUploadConfirmed] = useState(false);
  const [keywordsSubmitted, setKeywordsSubmitted] = useState(false);
  const [ShowList, setShowtList] = useState(false);
  const [summary, setSummary] = useState("Le présent Apell d'Offre concerne .............");
  const [editingSummary, setEditingSummary] = useState(false);

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
    setUploadConfirmed(false);
    const f = e.target.files?.[0];
    if (!f) return;

    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExts = [".pdf", ".docx"]; // corrigé

    const hasValidMime = allowedMimes.includes(f.type);
    const hasValidExt = allowedExts.some((ext) => f.name.toLowerCase().endsWith(ext));

    if (!(hasValidMime || hasValidExt)) {
      setUploadError("Formats autorisés : PDF (.pdf) ou Word (.docx)");
      setFile(null);
      e.target.value = "";
      return;
    }

    setUploadError("");
    setFile(f);
    if (f) setKeywordsSubmitted(false);
    if (f) setShowtList(false);
  };

  const getCurrentStep = () => {
    if (!file) return 1;
    if (!uploadConfirmed) return 1;
    if (!keywordsSubmitted) return 2;
    if (!ShowList) return 3;
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
    if (!keywords.trim()) return;
    setKeywordsSubmitted(true);
  };

  const handleShowList = () => {
    setShowtList(true); // corrigé
  };

  const handleDownloadPDF = () => {
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
  };

  return (
    <div className="d-flex gestion-dao">
      <Sidebar />

      <main className="flex-grow-1 gestion-dao__main">
        {/* Header */}
        <header className="d-flex justify-content-between align-items-center px-4 py-3 gestion-dao__header">
          <h5 className="mb-0 fw-bold gestion-dao__title">
            Gestion des documents d'Appel d'Offre
          </h5>

          <div className="d-flex gap-3">
            <button className="btn d-flex align-items-center justify-content-center gestion-dao__iconbtn">
              <CloudArrowDown className="gestion-dao__icon" size={40} />
            </button>
            <button className="btn d-flex align-items-center justify-content-center gestion-dao__iconbtn">
              <QuestionCircle className="gestion-dao__icon" size={30} />
            </button>
          </div>
        </header>

        {/* Progress Bar + Step Indicator */}
        <div className="px-5 mb-4">
          <div className="mb-3 gestion-dao__progress">
            <div
              className="gestion-dao__progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="d-flex justify-content-between align-items-center position-absolute w-100 h-100 px-2">
              {stepLabels.map((label, index) => (
                <div key={index} className="d-flex flex-column align-items-center gestion-dao__step">
                  <span className="fw-bold">{index + 1}</span>
                  <span className="gestion-dao__step-small">
                    {label.split(" ").slice(1).join(" ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center justify-content-center me-3 gestion-dao__current-step">
              {currentStep}
            </div>
            <span className="fw-semibold gestion-dao__current-label">
              {stepLabels[currentStep - 1]}
            </span>
          </div>
        </div>

        {/* Section 1: Upload */}
        <div className="section-upload">
          <div className="row">
            <div className="col-md text-center full-height-section">
              <img src={Image1} alt="Upload du DAO" className="img-fluid" />
            </div>

            <div className="col-md-5 m-3">
              <h3 className="fw-bold section-upload__title">Upload du DAO</h3>

              <div className="p-4 section-upload__box">
                <div className="text-center">
                  <CloudUpload size={60} className="section-upload__icon mb-3" />
                  <p className="text-black-50 mb-3">Glissez / déposez votre fichier ici</p>

                  <input
                    type="file"
                    className="form-control mb-3 section-upload__input"
                    accept=".pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleUpload}
                  />

                  {uploadError && <small className="text-warning">{uploadError}</small>}
                  {file && <p className="text-black-50 mt-2">Fichier sélectionné : {file.name}</p>}

                  <button
                    className="btn section-upload__btn mt-3"
                    onClick={() => setUploadConfirmed(true)}
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
          <div className="row section-extraction">
            <div className="col-md text-center full-height-section">
              <img src={Image2} alt="Extraction du fichier" className="img-fluid" />
            </div>

            <div className="col-md-5 m-3">
              <div className="p-4">
                <h3 className="fw-bold section-extraction__title">
                  Extraction du fichier {file.name}
                </h3>

                <p className="text-muted mb-3 section-extraction__help">
                  Entrez des mots clés pour une meilleur résumé
                </p>

                <div className="mb-4">
                  <textarea
                    className="form-control section-extraction__textarea"
                    rows="6"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Ex: date limite, blabla"
                  />
                </div>

                <div className="text-end">
                  <button
                    className="btn fw-semibold btn-orange px-4 py-2"
                    onClick={handleSubmitKeywords}
                  >
                    Soumettre
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Résumé */}
        {keywordsSubmitted && (
          <div className="section-summary__container">
            <div className="row">
              <div className="col-md text-center full-height-section">
                <img src={Image3} alt="Résumé du fichier" className="img-fluid" />
              </div>

              <div className="col-md-5 m-3">
                <div className="p-4">
                  <h3 className="fw-bold mb-3 summary-title">Résumé du DAO</h3>

                  <div className="section-summary">
                    {editingSummary ? (
                      <textarea
                        className="form-control section-summary__textarea"
                        rows="6"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                      />
                    ) : (
                      <p className="mb-0 section-summary__text">{summary}</p>
                    )}

                    <div className="d-flex align-items-center gap-3 section-summary__actions">
                      <button className="btn p-0 section-summary__iconbtn" title="Mettre en forme">
                        <ListCheck size={22} />
                      </button>

                      {editingSummary ? (
                        <button
                          className="btn p-0 section-summary__iconbtn"
                          title="Valider"
                          onClick={() => setEditingSummary(false)}
                        >
                          <Check size={22} />
                        </button>
                      ) : (
                        <button
                          className="btn p-0 section-summary__iconbtn"
                          title="Éditer"
                          onClick={() => setEditingSummary(true)}
                        >
                          <Pencil size={20} />
                        </button>
                      )}

                      <button
                        className="btn p-0 section-summary__iconbtn"
                        title="Télécharger"
                        onClick={handleDownloadPDF}
                      >
                        <Download size={22} />
                      </button>
                    </div>
                  </div>

                  <div className="text-end">
                    <h6 className="mb-2">Cliquez ici pour voir les listes de documents à soumettre</h6>
                    <button className="btn fw-semibold btn-orange px-4 py-2" onClick={handleShowList}>
                      Voir plus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Liste des documents */}
        {ShowList && (
          <div className="row section-documents">
            <div className="col-md text-center full-height-section">
              <img src={Image4} alt="Liste documents" className="img-fluid" />
            </div>

            <div className="col-md-5 m-3">
              <div className="p-4">
                <h3 className="fw-bold section-documents__title">
                  Liste des documents à soumettre
                </h3>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
