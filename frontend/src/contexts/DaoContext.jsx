import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const DaoContext = createContext(null);

const STORAGE_KEY = "daoState";

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const DaoProvider = ({ children }) => {
  const persisted = loadState();

  const [file, setFile] = useState(null); // not persisted (File is not serializable)
  const [daoDocId, setDaoDocId] = useState(persisted?.daoDocId ?? null);
  const [keywords, setKeywords] = useState(persisted?.keywords ?? "");
  const [uploadConfirmed, setUploadConfirmed] = useState(persisted?.uploadConfirmed ?? false);
  const [keywordsSubmitted, setKeywordsSubmitted] = useState(persisted?.keywordsSubmitted ?? false);
  const [showList, setShowList] = useState(persisted?.showList ?? false);
  const [summary, setSummary] = useState(persisted?.summary ?? "Le présent Appel d'Offre concerne .............");
  const [editingSummary, setEditingSummary] = useState(false);
  const [requiredDocs, setRequiredDocs] = useState(persisted?.requiredDocs ?? []);
  const [daoId, setDaoId] = useState(persisted?.daoId ?? null);
  const [savedLots, setSavedLots] = useState(persisted?.savedLots ?? []);

  useEffect(() => {
    const stateToPersist = {
      daoDocId,
      keywords,
      uploadConfirmed,
      keywordsSubmitted,
      showList,
      summary,
      requiredDocs,
      daoId,
      savedLots,
    };
    saveState(stateToPersist);
  }, [daoDocId, keywords, uploadConfirmed, keywordsSubmitted, showList, summary, requiredDocs, daoId, savedLots]);

  const resetDaoProcess = () => {
    setDaoDocId(null);
    setKeywords("");
    setUploadConfirmed(false);
    setKeywordsSubmitted(false);
    setShowList(false);
    setSummary("Le présent Appel d'Offre concerne .............");
    setEditingSummary(false);
    setRequiredDocs([]);
    setDaoId(null);
    setSavedLots([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {
      //
    }
  };

  const value = useMemo(() => ({
    // state
    file, daoDocId, keywords, uploadConfirmed, keywordsSubmitted, showList, summary, editingSummary, requiredDocs,
    daoId, savedLots,
    // setters
    setFile, setDaoDocId, setKeywords, setUploadConfirmed, setKeywordsSubmitted, setShowList, setSummary, setEditingSummary, setRequiredDocs,
    setDaoId, setSavedLots,
    // actions
    resetDaoProcess,
  }), [file, daoDocId, keywords, uploadConfirmed, keywordsSubmitted, showList, summary, editingSummary, requiredDocs, daoId, savedLots]);

  return (
    <DaoContext.Provider value={value}>
      {children}
    </DaoContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDao = () => useContext(DaoContext);


