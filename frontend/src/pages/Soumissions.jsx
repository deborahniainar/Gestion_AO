import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { NotificationService, NotificationMessages } from '../services/notifications'
import { soumissionsWorkspacesAPI } from '../services/api'
import api from '../services/api'
import {
  CloudDownload,
  Add,
  Save,
  Description,
  Edit,
  Delete
} from "@mui/icons-material";

const Soumissions = () => {
  const SUGGESTED_SOUS_TACHES = [
    'Page de garde Technique',
    'Fiche de reseignements sur le soumissionnaire',
    'Documents administratifs',
    'Antécédent des marchés',
    'Déclaration PES',
    'Déclaration relative à EASHS',
    'Situation de performance financière',
    'Lettre de soumission',
    "Déclaration de garantie d'Offres",
    'Documents techniques',
    'Note méthodologique',
    'Gestion des ressources',
    'Personnels Clés Proposé',
    "Code de conduite pour le personnel de l'entrepreneur",
    'Stratégies de gestion',
    'Page de garde Financière',
    'Lètre de soumission Financière',
    'Bordereau de prix Unitaire',
    'Détail de calcul K1',
    'Sous-détails des PU et décomposition des prix forfaitaires',
    'Le DQE',
    'Copie du RIB'
  ];

  const [appelOffre, setAppelOffre] = useState('')
  const [lot, setLot] = useState('')
  const [lotNames, setLotNames] = useState([])
  const [daos, setDaos] = useState([])
  const [daoDocId, setDaoDocId] = useState(null)
  const [loadingLots, setLoadingLots] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const workspaceReady = !!lot // vrai seulement si un lot est sélectionné
  // const navigate = useNavigate();

  // Listes et map des contenus sont entièrement gérées par le backend
  const [listes, setListes] = useState([]);

  useEffect(() => {
    // Initial load: fetch DAOs to populate selector (match PriceMO behavior)
    (async () => {
      try {
        const res = await api.get('/dao/')
        const list = Array.isArray(res.data) ? res.data : []
        setDaos(list)
        if (list.length > 0) {
          const first = list[0]
          const id = first.document_id ?? first.id ?? null
          setDaoDocId(id)
          // keep appelOffre param in sync (string) so backend workspace API receives a value
          setAppelOffre(id ? String(id) : '')
          // also set lotNames if DAO contains lots
          if (Array.isArray(first.lots)) {
            const names = first.lots.map(l => l.lot_name || l.name || l.titre).filter(Boolean)
            setLotNames(names)
            if (names.length > 0) setLot(names[0])
          }
        } else {
          setDaoDocId(null)
        }
      } catch (e) {
        NotificationService.error('Impossible de charger les DAOs')
        setDaos([])
        setDaoDocId(null)
      }
    })();
  }, []);

  useEffect(() => {
    // refresh lots when daoDocId (selected DAO) or appelOffre changes
    (async () => {
      setLoadingLots(true);
      try {
        // if a DAO is selected, prefer fetching its lots from /dao/:id
        if (daoDocId) {
          try {
            const resDao = await api.get(`/dao/${daoDocId}`)
            const lots = Array.isArray(resDao.data?.lots) ? resDao.data.lots : []
            const names = lots.map(l => l.lot_name || l.name || l.titre).filter(Boolean)
            setLotNames(names)
            if (names.length > 0) setLot(prev => (prev && names.includes(prev)) ? prev : names[0])
            else setLot('')
          } catch (err) {
            // fall back to workspace listLots
            const res = await soumissionsWorkspacesAPI.listLots(appelOffre);
            const names = Array.isArray(res.data) ? res.data : [];
            setLotNames(names);
            if (names.length > 0) setLot(prev => (prev && names.includes(prev)) ? prev : names[0])
            else setLot('')
          }
        } else {
          const res = await soumissionsWorkspacesAPI.listLots(appelOffre);
          const names = Array.isArray(res.data) ? res.data : [];
          setLotNames(names);
          if (names.length > 0) setLot(prev => (prev && names.includes(prev)) ? prev : names[0])
          else setLot('')
        }
      } catch (e) {
        setLotNames([]);
        setLot('')
      } finally {
        setLoadingLots(false);
      }
    })();
  }, [daoDocId, appelOffre]);

  useEffect(() => {
    // load workspace when lot changes
    if (!lot) return;
    (async () => {
      setLoadingWorkspace(true);
      try {
        const ws = await soumissionsWorkspacesAPI.getWorkspace(lot, appelOffre, { createIfMissing: true });
        setListes(Array.isArray(ws.data.listes) ? ws.data.listes : []);
      } catch (e) {
        setListes([]);
      } finally {
        setLoadingWorkspace(false);
      }
    })();
  }, [lot, appelOffre]);

  // Helpers to persist full workspace to backend
  const persistWorkspace = async (newListes) => {
    try {
      await soumissionsWorkspacesAPI.saveWorkspace(lot, { listes: newListes }, appelOffre);
    } catch (e) {
      NotificationService.error('Échec sauvegarde');
    }
  };

  const handleSupprimerLot = async () => {
    if (!lot) return;
    if (!confirm(`Supprimer le lot "${lot}" ?`)) return;
    try {
      await soumissionsWorkspacesAPI.deleteWorkspace(lot, appelOffre);
      NotificationService.success('Lot supprimé');
      setListes([]);
      const res = await soumissionsWorkspacesAPI.listLots(appelOffre);
      const names = Array.isArray(res.data) ? res.data : [];
      setLotNames(names);
      if (names.length > 0) setLot(names[0]);
      else setLot('');
    } catch (e) {
      NotificationService.error('Échec suppression lot');
    }
  };

  const handleExporter = () => {
    soumissionsWorkspacesAPI.exportFinished(lot, appelOffre)
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${Date.now()}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        NotificationService.success('Export DOCX téléchargé');
      })
      .catch(() => NotificationService.error('Échec de l\'export'));
  };

  // Modals simplified
  const [modal, setModal] = useState({ open: false, type: null, payload: {}, value: '' });
  const closeModal = () => setModal({ open: false, type: null, payload: {}, value: '' });
  const confirmModal = async () => {
    const { type, payload, value } = modal;
    if (type === 'addList') {
      let titre = (value || '').trim();
      if (!titre) return;
      const newTask = { id: crypto.randomUUID(), titre, sousTaches: [] };
      const newListes = [...listes, newTask];
      setListes(newListes);
      await persistWorkspace(newListes);
    } else if (type === 'addSubtask') {
      const { listeId } = payload || {};
      const titre = (value || '').trim();
      if (!titre) return;
      const newListes = listes.map(l => l.id === listeId ? { ...l, sousTaches: [...(l.sousTaches || []), { id: crypto.randomUUID(), titre, done: false }] } : l);
      setListes(newListes);
      await persistWorkspace(newListes);
    } else if (type === 'renameList') {
      const { listeId } = payload || {};
      const titre = (value || '').trim();
      if (!titre) return;
      const newListes = listes.map(l => l.id === listeId ? { ...l, titre } : l);
      setListes(newListes);
      await persistWorkspace(newListes);
    } else if (type === 'renameSubtask') {
      const { listeId, sousTacheId } = payload || {};
      const titre = (value || '').trim();
      if (!titre) return;
      const newListes = listes.map(l => {
        if (l.id !== listeId) return l;
        return { ...l, sousTaches: (l.sousTaches || []).map(s => s.id === sousTacheId ? { ...s, titre } : s) };
      });
      setListes(newListes);
      await persistWorkspace(newListes);
    } else if (type === 'confirmDeleteList') {
      const { listeId } = payload || {};
      const newListes = listes.filter(l => l.id !== listeId);
      setListes(newListes);
      await persistWorkspace(newListes);
    } else if (type === 'confirmDeleteSubtask') {
      const { listeId, sousTacheId } = payload || {};
      const newListes = listes.map(l => {
        if (l.id !== listeId) return l;
        return { ...l, sousTaches: (l.sousTaches || []).filter(st => st.id !== sousTacheId) };
      });
      setListes(newListes);
      await persistWorkspace(newListes);
    }
    closeModal();
  };

  // Drag & Drop simplified: update local state then persist
  const [dragData, setDragData] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState(null);

  const handleDragStartSubtask = (listeId, sousTacheId) => setDragData({ listeId, sousTacheId });
  const handleDragEndSubtask = () => { setDragData(null); setDragOverListId(null); setDragOverSubtaskId(null); };
  const handleDragOverList = (listeId, e) => { e.preventDefault(); setDragOverListId(listeId); };
  const handleDropOnList = async (targetListId) => {
    if (!dragData) return;
    const { listeId: sourceListId, sousTacheId } = dragData;
    if (!sourceListId || !sousTacheId) return;
    let moved = null;
    const withoutFrom = listes.map(l => {
      if (l.id !== sourceListId) return l;
      const remaining = (l.sousTaches || []).filter(st => { if (st.id === sousTacheId) { moved = st; return false } return true });
      return { ...l, sousTaches: remaining };
    });
    if (!moved) return;
    const newListes = withoutFrom.map(l => l.id !== targetListId ? l : { ...l, sousTaches: [...(l.sousTaches || []), moved] });
    setListes(newListes);
    await persistWorkspace(newListes);
    handleDragEndSubtask();
  };

  const handleDragOverSubtask = (listeId, sousTacheId, e) => { e.preventDefault(); setDragOverListId(listeId); setDragOverSubtaskId(sousTacheId); };
  const handleDropOnSubtask = async (targetListId, targetSubtaskId) => {
    if (!dragData) return;
    const { listeId: sourceListId, sousTacheId } = dragData;
    if (!sourceListId || !sousTacheId) return;
    const sourceOriginalIndex = listes.find(l => l.id === sourceListId)?.sousTaches?.findIndex(st => st.id === sousTacheId) ?? -1;
    const targetOriginalIndex = listes.find(l => l.id === targetListId)?.sousTaches?.findIndex(st => st.id === targetSubtaskId) ?? -1;

    let moved = null;
    const withoutFrom = listes.map(l => {
      if (l.id !== sourceListId) return l;
      const remaining = (l.sousTaches || []).filter(st => { if (st.id === sousTacheId) { moved = st; return false } return true });
      return { ...l, sousTaches: remaining };
    });
    if (!moved) return;
    const newListes = withoutFrom.map(l => {
      if (l.id !== targetListId) return l;
      const list = [...(l.sousTaches || [])];
      let insertIndex = list.findIndex(st => st.id === targetSubtaskId);
      if (insertIndex === -1) insertIndex = list.length;
      if (sourceListId === targetListId && sourceOriginalIndex !== -1 && targetOriginalIndex !== -1 && sourceOriginalIndex < targetOriginalIndex) {
        insertIndex = Math.max(0, insertIndex - 1);
      }
      list.splice(insertIndex, 0, moved);
      return { ...l, sousTaches: list };
    });
    setListes(newListes);
    await persistWorkspace(newListes);
    handleDragEndSubtask();
  };

  // Toggle sous-tache moved logic to persist
  const normalizeTitle = (t) => (t || '').toLowerCase();
  const isTodoList = (t) => { const n = normalizeTitle(t); return n.includes('à faire') || n.includes('a faire') };
  const isInProgressList = (t) => normalizeTitle(t).includes('en cours');
  const isDoneList = (t) => { const n = normalizeTitle(t); return n.includes('termin') };

  const handleToggleSousTache = async (listeId, sousTacheId) => {
    const newListes = [...listes];
    // find source
    const sourceList = newListes.find(l => l.id === listeId);
    if (!sourceList) return;
    const sub = (sourceList.sousTaches || []).find(s => s.id === sousTacheId);
    if (!sub) return;
    const nextDone = !sub.done;

    if (nextDone && isTodoList(sourceList.titre)) {
      // move to in progress
      let target = newListes.find(l => isInProgressList(l.titre));
      if (!target) {
        const newTask = { id: crypto.randomUUID(), titre: 'Tâches En Cours', sousTaches: [] };
        newListes.push(newTask);
        target = newListes[newListes.length - 1];
      }
      // remove from source
      sourceList.sousTaches = (sourceList.sousTaches || []).filter(s => s.id !== sousTacheId);
      // add to target with done=false
      target.sousTaches = [...(target.sousTaches || []), { ...sub, done: false }];
      setListes(newListes);
      await persistWorkspace(newListes);
      return;
    }

    if (nextDone && isInProgressList(sourceList.titre)) {
      let target = newListes.find(l => isDoneList(l.titre));
      if (!target) {
        const newTask = { id: crypto.randomUUID(), titre: 'Tâches Terminées', sousTaches: [] };
        newListes.push(newTask);
        target = newListes[newListes.length - 1];
      }
      sourceList.sousTaches = (sourceList.sousTaches || []).filter(s => s.id !== sousTacheId);
      target.sousTaches = [...(target.sousTaches || []), { ...sub, done: true }];
      setListes(newListes);
      await persistWorkspace(newListes);
      return;
    }

    // otherwise toggle in place
    const updated = newListes.map(l => l.id !== listeId ? l : { ...l, sousTaches: (l.sousTaches || []).map(s => s.id === sousTacheId ? { ...s, done: !s.done } : s) });
    setListes(updated);
    await persistWorkspace(updated);
  };

  const handleOpenSubtask = async (listeId, sousTache) => {
    if (!sousTache) return;
    try {
      const { data } = await soumissionsWorkspacesAPI.getOnlyOfficeUrl(lot, sousTache.id, appelOffre);
      const url = data?.url;
      if (url) window.open(url, '_blank');
      else NotificationService.error('URL OnlyOffice indisponible');
    } catch (e) {
      NotificationService.error('Impossible d\'ouvrir OnlyOffice');
    }
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16 overflow-x-hidden'>
        {loadingWorkspace && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="flex flex-col items-center gap-3">
              <span className="inline-block h-12 w-12 border-4 border-secondary/80 border-t-transparent rounded-full animate-spin" aria-label="Chargement du workspace..."></span>
              <p className="text-white text-sm">Chargement du workspace...</p>
            </div>
          </div>
        )}
        {/* En-tête */}
        <header className="sticky top-0 z-20 flex items-center px-6 py-5 bg-muted dark:bg-accent border border-muted-50 rounded-lg mb-6 shadow-sm">
          <h5 className="text-xl font-bold text-secondary m-0">Gestion de Soumission</h5>
        </header>

        {/* Carte principale */}
        <div className="bg-muted dark:bg-accent rounded-lg shadow-md p-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          {/* Ligne Appel d'Offre + actions */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-3 flex-1 bg-white/60 dark:bg-primary/30 border border-muted-50 rounded-md px-3 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                <Description fontSize="small" />
              </span>

              <label className="text-secondary font-medium whitespace-nowrap">Appel d’Offre :</label>

              <select
                className="text-primary dark:text-muted ml-auto border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-64"
                value={daoDocId ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  if (!val) {
                    setDaoDocId(null)
                    setAppelOffre('')
                    setLotNames([])
                    setLot('')
                    return
                  }
                  setDaoDocId(val)
                  setAppelOffre(String(val))
                }}
              >
                <option value="">Sélectionner un DAO</option>
                {(daos || []).map(d => {
                  const display = d.original_name || (d.filename ? d.filename.split('/').pop() : null) || `DAO ${d.document_id}`
                  const id = d.document_id ?? d.id
                  return (<option key={id} value={id}>{display}</option>)
                })}
              </select>

              {appelOffre ? (
                <>
                  <label className="text-secondary font-medium whitespace-nowrap ml-3">Lot :</label>
                  <select
                    className="border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-40"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                  >
                    <option value="">Sélectionner un Lot</option>
                    {(lotNames || []).map(nomLot => (
                      <option key={nomLot} value={nomLot}>{nomLot}</option>
                    ))}
                  </select>
                </>
              ) : (
                <div className="ml-3 text-sm text-gray-500">Aucun DAO sélectionné.</div>
              )}

              {(loadingLots || loadingWorkspace) && (
                <span className="ml-2 inline-block h-5 w-5 border-2 border-secondary/70 border-t-transparent rounded-full animate-spin" aria-label="Chargement..."></span>
              )}

            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleExporter} className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white text-sm px-3 py-2 rounded-md">
                <CloudDownload fontSize="small" />
                Exporter
              </button>
            </div>
          </div>

          {/* Action ajouter carte */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => { if (!workspaceReady) return; setModal({ open: true, type: 'addList', payload: {}, value: '' }) }}
              disabled={!workspaceReady}
              className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md ${workspaceReady ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
            >
              <Add fontSize="small" />
              Ajouter une tâche
            </button>
          </div>

          {/* Corps avec colonnes de cartes */}
          <div className="flex gap-4">
            {/* Colonnes */}
            {workspaceReady ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {listes.map(liste => (
                  <div
                    key={liste.id}
                    className={`w-full md:w-96 bg-white/60 dark:bg-primary/30 border ${dragOverListId === liste.id ? 'border-secondary' : 'border-muted-50'} rounded-lg p-4 shrink-0`}
                    onDragOver={(e) => handleDragOverList(liste.id, e)}
                    onDrop={() => handleDropOnList(liste.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="text-sm font-semibold text-secondary">{liste.titre}</h6>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ open: true, type: 'renameList', payload: { listeId: liste.id }, value: liste.titre })} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200/70 text-gray-700" title="Modifier">
                          <Edit fontSize="small" />
                        </button>
                        <button onClick={() => setModal({ open: true, type: 'confirmDeleteList', payload: { listeId: liste.id }, value: '' })} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 text-red-600" title="Supprimer">
                          <Delete fontSize="small" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {(liste.sousTaches || []).map(st => (
                        <div
                          key={st.id}
                          className={`group flex items-center justify-between bg-white dark:bg-primary border ${dragOverSubtaskId === st.id ? 'border-secondary' : 'border-muted-50'} rounded-md px-3 py-2 text-sm shadow-sm`}
                          draggable
                          onDragStart={() => handleDragStartSubtask(liste.id, st.id)}
                          onDragEnd={handleDragEndSubtask}
                          onDragOver={(e) => handleDragOverSubtask(liste.id, st.id, e)}
                          onDrop={() => handleDropOnSubtask(liste.id, st.id)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              aria-label="Marquer comme terminé"
                              checked={!!st.done}
                              onChange={(e) => { e.stopPropagation(); handleToggleSousTache(liste.id, st.id); }}
                              className="h-4 w-4 accent-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            />
                            <span
                              className={`truncate cursor-pointer hover:underline ${st.done ? 'line-through text-gray-400' : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleOpenSubtask(liste.id, st); }}
                              title="Ouvrir l'espace de travail"
                            >
                              {st.titre}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, type: 'renameSubtask', payload: { listeId: liste.id, sousTacheId: st.id }, value: st.titre }); }} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200/70 text-gray-700" title="Modifier">
                              <Edit fontSize="small" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, type: 'confirmDeleteSubtask', payload: { listeId: liste.id, sousTacheId: st.id }, value: '' }); }} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 text-red-600" title="Supprimer">
                              <Delete fontSize="small" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setModal({ open: true, type: 'addSubtask', payload: { listeId: liste.id }, value: '' })} className="mt-4 text-sm text-secondary underline underline-offset-2">
                      Ajouter une sous-tâche
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-gray-500">Sélectionner un Lot pour afficher le workspace.</div>
            )}
          </div>
        </div>

        {/* Modal */}
        {modal.open && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white dark:bg-primary border border-muted-50 rounded-lg shadow-xl">
              <div className="px-5 py-4 border-b border-muted-50 flex items-center justify-between">
                <h6 className="text-sm font-semibold text-secondary">
                  {modal.type === 'addList' && 'Nouvelle tâche'}
                  {modal.type === 'addSubtask' && 'Nouvelle sous-tâche'}
                  {modal.type === 'renameList' && 'Renommer la tâche'}
                  {modal.type === 'renameSubtask' && 'Renommer la sous-tâche'}
                  {modal.type === 'confirmDeleteList' && 'Supprimer la tâche ?'}
                  {modal.type === 'confirmDeleteSubtask' && 'Supprimer la sous-tâche ?'}
                </h6>
                <button onClick={closeModal} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-primary/40">×</button>
              </div>

              {(modal.type === 'addList' || modal.type === 'addSubtask' || modal.type === 'renameList' || modal.type === 'renameSubtask') && (
                <div className="px-5 py-4 space-y-3">
                  {modal.type === 'addList' && (
                    <div className="flex flex-wrap gap-2">
                      {['Tâches à faire', 'Tâches En Cours', 'Tâches Terminées'].map(opt => (
                        <button key={opt} onClick={() => setModal(m => ({ ...m, value: opt }))} className={`text-xs px-2 py-1 rounded border ${modal.value === opt ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-primary border-muted-50'}`}>{opt}</button>
                      ))}
                    </div>
                  )}
                  <input
                    autoFocus
                    value={modal.value}
                    onChange={(e) => setModal(m => ({ ...m, value: e.target.value }))}
                    placeholder={modal.type === 'addList' ? 'Titre de la tâche' : 'Nom'}
                    className="w-full border border-muted-50 rounded px-3 py-2 bg-white dark:bg-primary"
                    list={modal.type === 'addSubtask' ? 'suggested-sous-taches' : undefined}
                  />
                  {modal.type === 'addSubtask' && (
                    <datalist id="suggested-sous-taches">
                      {SUGGESTED_SOUS_TACHES.map(opt => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  )}
                </div>
              )}

              {(modal.type === 'confirmDeleteList' || modal.type === 'confirmDeleteSubtask') && (
                <div className="px-5 py-4">
                  <p className="text-sm">Cette action est irréversible.</p>
                </div>
              )}

              <div className="px-5 py-4 border-t border-muted-50 flex justify-end gap-2">
                <button onClick={closeModal} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Annuler</button>
                <button onClick={confirmModal} className="px-3 py-2 rounded bg-secondary hover:bg-secondary/90 text-white text-sm">Confirmer</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default Soumissions
