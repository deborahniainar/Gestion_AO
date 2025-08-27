import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { NotificationService, NotificationMessages } from '../services/notifications'
import { soumissionsWorkspacesAPI } from '../services/api'
import {
  CloudDownload,
  Add,
  Save,
  Description,
  Edit,
  Delete
} from "@mui/icons-material";

const Soumissions = () => {
  const STORAGE_KEY = 'soumissions_state_v1';

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

  const [appelOffre, setAppelOffre] = useState('Nom Appel d’Offre actuel');
  const [lot, setLot] = useState('Lot 1');
  // Persisted entirely via backend
  const [lotNames, setLotNames] = useState([]);
  const workspaceCacheRef = useRef(new Map()); // key: `${appelOffre}::${lot}` => { listes }
  const lotInputDebounceRef = useRef(null);
  const [loadingLots, setLoadingLots] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const navigate = useNavigate();
  const autosaveDebounceRef = useRef(null);
  const currentLotRef = useRef('');
  const currentAoRef = useRef('');

  useEffect(() => { currentLotRef.current = lot; }, [lot]);
  useEffect(() => { currentAoRef.current = appelOffre; }, [appelOffre]);
  // Modèle multi-cartes: chaque carte = une liste de sous-tâches
  const [listes, setListes] = useState([]);

  // Initial load from backend
  useEffect(() => {
    (async () => {
      try {
        setLoadingLots(true);
        const res = await soumissionsWorkspacesAPI.listLots(appelOffre);
        const names = Array.isArray(res.data) ? res.data : [];
        setLotNames(names);
        if (names.length > 0) {
          const selected = lot && names.includes(lot) ? lot : names[0];
          setLot(selected);
          try {
            setLoadingWorkspace(true);
            const ws = await soumissionsWorkspacesAPI.getWorkspace(selected, appelOffre);
            const data = ws.data || {};
            setListes(Array.isArray(data.listes) ? data.listes : []);
          } catch (_) {
            setListes([]);
          } finally {
            setLoadingWorkspace(false);
          }
        }
      } catch (e) {
        NotificationService.error("Chargement des lots (backend) échoué");
      } finally {
        setLoadingLots(false);
      }
    })();
  }, []);

  // Charger la liste des lots depuis le backend quand l'appel d'offre change
  useEffect(() => {
    (async () => {
      try {
        setLoadingLots(true);
        const res = await soumissionsWorkspacesAPI.listLots(appelOffre);
        const names = Array.isArray(res.data) ? res.data : [];
        setLotNames(names);
        // Pre-load current lot if present in cache, else fetch and cache
        const cacheKey = `${appelOffre}::${lot}`;
        const cached = workspaceCacheRef.current.get(cacheKey);
        if (cached) {
          setListes(Array.isArray(cached.listes) ? cached.listes : []);
        } else if (lot) {
          setLoadingWorkspace(true);
          soumissionsWorkspacesAPI.getWorkspace(lot, appelOffre, { createIfMissing: true })
            .then(ws => {
              const data = ws.data || {};
              const listesData = Array.isArray(data.listes) ? data.listes : [];
              workspaceCacheRef.current.set(cacheKey, { listes: listesData });
              setListes(listesData);
            })
            .catch(() => {})
            .finally(() => setLoadingWorkspace(false));
        }
      } catch (e) {
        // silencieux: on garde juste les lots locaux en suggestions
      } finally {
        setLoadingLots(false);
      }
    })();
  }, [appelOffre]);

  // Actions
  const handleGenererDepuisDAO = () => {
    const seeds = [
      { id: crypto.randomUUID(), titre: 'Page de garde', done: false },
      { id: crypto.randomUUID(), titre: 'Lettre de soumission', done: false },
      { id: crypto.randomUUID(), titre: 'Fiche de renseignement', done: false },
      { id: crypto.randomUUID(), titre: 'Déclaration sur l’honneur', done: false }
    ];
    setListes(prev => {
      if (prev.length === 0) return [{ id: crypto.randomUUID(), titre: 'Tâche à faire', sousTaches: seeds }];
      const [first, ...rest] = prev;
      return [{ ...first, sousTaches: seeds }, ...rest];
    });
    NotificationService.success('Sous-tâches générées à partir du DAO (exemple)');
  };

  // Autosave workspace when listes changes (debounced), except while loading
  useEffect(() => {
    if (loadingWorkspace) return;
    const lotNow = currentLotRef.current;
    const aoNow = currentAoRef.current;
    if (!lotNow || !aoNow) return;
    if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    autosaveDebounceRef.current = setTimeout(() => {
      const cacheKey = `${aoNow}::${lotNow}`;
      const payload = { listes: Array.isArray(listes) ? listes : [] };
      soumissionsWorkspacesAPI.saveWorkspace(lotNow, payload, aoNow)
        .then(() => {
          workspaceCacheRef.current.set(cacheKey, { listes: payload.listes });
          // refresh lot names silently (in case a new lot name was used)
          soumissionsWorkspacesAPI.listLots(aoNow)
            .then(r => setLotNames(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});
        })
        .catch(() => {
          // silent; could add retry/backoff later
        });
    }, 400);
    return () => {
      if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    };
  }, [listes, loadingWorkspace]);

  const handleSupprimerLot = () => {
    if (!lot) return;
    if (!confirm(`Supprimer le lot "${lot}" ?`)) return;
    soumissionsWorkspacesAPI.deleteWorkspace(lot, appelOffre)
      .then(() => {
        NotificationService.success('Lot supprimé');
        setListes([]);
        // rafraîchir la liste et vider le champ si le lot supprimé était sélectionné
        soumissionsWorkspacesAPI.listLots(appelOffre)
          .then(r => {
            const names = Array.isArray(r.data) ? r.data : [];
            setLotNames(names);
            if (names.length === 0) {
              setLot('');
            } else if (!names.includes(lot)) {
              setLot(names[0]);
              // charger le nouveau lot courant en arrière-plan
              const cacheKey = `${appelOffre}::${names[0]}`;
              setLoadingWorkspace(true);
              soumissionsWorkspacesAPI.getWorkspace(names[0], appelOffre, { createIfMissing: true })
                .then(ws => {
                  const data = ws.data || {};
                  const listesData = Array.isArray(data.listes) ? data.listes : [];
                  workspaceCacheRef.current.set(cacheKey, { listes: listesData });
                  setListes(listesData);
                })
                .catch(() => setListes([]))
                .finally(() => setLoadingWorkspace(false));
            }
          })
          .catch(() => {});
      })
      .catch(() => {
        NotificationService.error('Échec suppression lot');
      });
  };

  const handleExporter = () => {
    try {
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
        .catch(() => NotificationService.error("Échec de l'export"));
    } catch (e) {
      NotificationService.error('Échec de lexport');
    }
  };

  const handleAjouterListe = () => {
    setModal({ open: true, type: 'addList', payload: {}, value: '' });
  };

  const handleAjouterSousTache = (listeId) => {
    setModal({ open: true, type: 'addSubtask', payload: { listeId }, value: '' });
  };

  // Suppression d'une sous-tâche
  const handleDeleteSousTache = (listeId, sousTacheId) => {
    setModal({ open: true, type: 'confirmDeleteSubtask', payload: { listeId, sousTacheId }, value: '' });
  };

  // Renommer/Supprimer une carte (tâche)
  const handleRenameListe = (listeId) => {
    const target = listes.find(l => l.id === listeId);
    if (!target) return;
    setModal({ open: true, type: 'renameList', payload: { listeId }, value: target.titre });
  };

  const handleDeleteListe = (listeId) => {
    setModal({ open: true, type: 'confirmDeleteList', payload: { listeId }, value: '' });
  };

  // Renommer une sous-tâche
  const handleRenameSousTache = (listeId, sousTacheId) => {
    const liste = listes.find(l => l.id === listeId);
    const st = liste?.sousTaches?.find(s => s.id === sousTacheId);
    setModal({ open: true, type: 'renameSubtask', payload: { listeId, sousTacheId }, value: st?.titre || '' });
  };

  // Modal state and handlers
  const [modal, setModal] = useState({ open: false, type: null, payload: {}, value: '' });
  const closeModal = () => setModal({ open: false, type: null, payload: {}, value: '' });
  const confirmModal = () => {
    const { type, payload, value } = modal;
    if (type === 'addList') {
      let titre = (value || '').trim();
      if (!titre) return;
      if (titre === '1') titre = 'Tâches à faire';
      else if (titre === '2') titre = 'Tâches En Cours';
      else if (titre === '3') titre = 'Tâches Terminées';
      setListes(prev => [...prev, { id: crypto.randomUUID(), titre, sousTaches: [] }]);
      NotificationService.success('Carte ajoutée');
    } else if (type === 'addSubtask') {
      const { listeId } = payload || {};
      const titre = (value || '').trim();
      if (!titre) return;
      setListes(prev => prev.map(l => {
        if (l.id !== listeId) return l;
        return { ...l, sousTaches: [...(l.sousTaches || []), { id: crypto.randomUUID(), titre, done: false }] };
      }));
      NotificationService.success('Sous-tâche ajoutée');
    } else if (type === 'renameList') {
      const { listeId } = payload || {};
      const titre = (value || '').trim();
      if (!titre) return;
      setListes(prev => prev.map(l => l.id === listeId ? { ...l, titre } : l));
      NotificationService.success('Tâche renommée');
    } else if (type === 'renameSubtask') {
      const { listeId, sousTacheId } = payload || {};
      const titre = (value || '').trim();
      if (!titre) return;
      setListes(prev => prev.map(l => {
        if (l.id !== listeId) return l;
        return { ...l, sousTaches: (l.sousTaches || []).map(s => s.id === sousTacheId ? { ...s, titre } : s) };
      }));
      NotificationService.success('Sous-tâche renommée');
    } else if (type === 'confirmDeleteList') {
      const { listeId } = payload || {};
      setListes(prev => prev.filter(l => l.id !== listeId));
      NotificationService.success('Tâche supprimée');
    } else if (type === 'confirmDeleteSubtask') {
      const { listeId, sousTacheId } = payload || {};
      setListes(prev => prev.map(l => {
        if (l.id !== listeId) return l;
        return { ...l, sousTaches: (l.sousTaches || []).filter(st => st.id !== sousTacheId) };
      }));
      NotificationService.success('Sous-tâche supprimée');
    }
    closeModal();
  };

  // Drag & Drop state
  const [dragData, setDragData] = useState(null); // { listeId, sousTacheId }
  const [dragOverListId, setDragOverListId] = useState(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState(null);

  const handleDragStartSubtask = (listeId, sousTacheId) => {
    setDragData({ listeId, sousTacheId });
  };

  const handleDragEndSubtask = () => {
    setDragData(null);
    setDragOverListId(null);
    setDragOverSubtaskId(null);
  };

  const handleDragOverList = (listeId, e) => {
    e.preventDefault();
    setDragOverListId(listeId);
  };

  const handleDropOnList = (targetListId) => {
    if (!dragData) return;
    const { listeId: sourceListId, sousTacheId } = dragData;
    if (!sourceListId || !sousTacheId) return;

    setListes(prev => {
      let moved = null;
      const withoutFrom = prev.map(l => {
        if (l.id !== sourceListId) return l;
        const remaining = (l.sousTaches || []).filter(st => {
          if (st.id === sousTacheId) {
            moved = st;
            return false;
          }
          return true;
        });
        return { ...l, sousTaches: remaining };
      });

      if (!moved) return prev;
      return withoutFrom.map(l => {
        if (l.id !== targetListId) return l;
        return { ...l, sousTaches: [ ...(l.sousTaches || []), moved ] };
      });
    });

    setDragData(null);
    setDragOverListId(null);
    setDragOverSubtaskId(null);
  };

  const handleDragOverSubtask = (listeId, sousTacheId, e) => {
    e.preventDefault();
    setDragOverListId(listeId);
    setDragOverSubtaskId(sousTacheId);
  };

  const handleDropOnSubtask = (targetListId, targetSubtaskId) => {
    if (!dragData) return;
    const { listeId: sourceListId, sousTacheId } = dragData;
    if (!sourceListId || !sousTacheId) return;

    setListes(prev => {
      const sourceOriginalIndex = prev.find(l => l.id === sourceListId)?.sousTaches?.findIndex(st => st.id === sousTacheId) ?? -1;
      const targetOriginalIndex = prev.find(l => l.id === targetListId)?.sousTaches?.findIndex(st => st.id === targetSubtaskId) ?? -1;

      let moved = null;
      const withoutFrom = prev.map(l => {
        if (l.id !== sourceListId) return l;
        const remaining = (l.sousTaches || []).filter(st => {
          if (st.id === sousTacheId) {
            moved = st;
            return false;
          }
          return true;
        });
        return { ...l, sousTaches: remaining };
      });

      if (!moved) return prev;

      return withoutFrom.map(l => {
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
    });

    setDragData(null);
    setDragOverListId(null);
    setDragOverSubtaskId(null);
  };

  // Toggle sous-tâche: si cochée dans "Tâches à faire", déplacer vers "Tâches En Cours" (création auto)
  const normalizeTitle = (t) => (t || '').toLowerCase();
  const isTodoList = (t) => {
    const n = normalizeTitle(t);
    return n.includes('à faire') || n.includes('a faire');
  };
  const isInProgressList = (t) => normalizeTitle(t).includes('en cours');
  const isDoneList = (t) => {
    const n = normalizeTitle(t);
    return n.includes('termin'); // couvre "terminé", "terminée", "terminées"
  };

  const handleToggleSousTache = (listeId, sousTacheId) => {
    setListes(prev => {
      // Trouver la liste source et la sous-tâche
      const sourceList = prev.find(l => l.id === listeId);
      if (!sourceList) return prev;
      const sub = (sourceList.sousTaches || []).find(s => s.id === sousTacheId);
      if (!sub) return prev;

      const nextDone = !sub.done;

      // Si on coche dans "Tâches à faire" => déplacer vers "Tâches En Cours"
      if (nextDone && isTodoList(sourceList.titre)) {
        // Rechercher/Créer la liste "Tâches En Cours"
        let targetListIndex = prev.findIndex(l => isInProgressList(l.titre));
        let newState = prev.map(l => ({ ...l }));
        if (targetListIndex === -1) {
          const newList = { id: crypto.randomUUID(), titre: 'Tâches En Cours', sousTaches: [] };
          newState = [...newState, newList];
          targetListIndex = newState.length - 1;
        }

        // Retirer de la source
        newState = newState.map(l => {
          if (l.id !== listeId) return l;
          return { ...l, sousTaches: (l.sousTaches || []).filter(s => s.id !== sousTacheId) };
        });

        // Ajouter à la cible (done reset à false en "En Cours")
        const targetList = newState[targetListIndex];
        const moved = { ...sub, done: false };
        const updatedTarget = { ...targetList, sousTaches: [ ...(targetList.sousTaches || []), moved ] };
        newState[targetListIndex] = updatedTarget;
        return newState;
      }

      // Si on coche dans "Tâches En Cours" => déplacer vers "Tâches Terminées"
      if (nextDone && isInProgressList(sourceList.titre)) {
        let targetListIndex = prev.findIndex(l => isDoneList(l.titre));
        let newState = prev.map(l => ({ ...l }));
        if (targetListIndex === -1) {
          const newList = { id: crypto.randomUUID(), titre: 'Tâches Terminées', sousTaches: [] };
          newState = [...newState, newList];
          targetListIndex = newState.length - 1;
        }

        // Retirer de la source
        newState = newState.map(l => {
          if (l.id !== listeId) return l;
          return { ...l, sousTaches: (l.sousTaches || []).filter(s => s.id !== sousTacheId) };
        });

        // Ajouter à la cible (done true en "Terminées")
        const targetList = newState[targetListIndex];
        const moved = { ...sub, done: true };
        const updatedTarget = { ...targetList, sousTaches: [ ...(targetList.sousTaches || []), moved ] };
        newState[targetListIndex] = updatedTarget;
        return newState;
      }

      // Sinon: simple toggle dans la même liste
      return prev.map(l => {
        if (l.id !== listeId) return l;
        return {
          ...l,
          sousTaches: (l.sousTaches || []).map(s => s.id === sousTacheId ? { ...s, done: nextDone } : s)
        };
      });
    });
  };

  const handleOpenSubtask = async (listeId, sousTache) => {
    if (!sousTache) return;
    try {
      const { data } = await soumissionsWorkspacesAPI.getOnlyOfficeUrl(lot, sousTache.id, appelOffre);
      const url = data?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        NotificationService.error("URL OnlyOffice indisponible");
      }
    } catch (_) {
      NotificationService.error("Impossible d'ouvrir OnlyOffice");
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
                className="ml-auto border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-64"
                value={appelOffre}
                onChange={(e) => setAppelOffre(e.target.value)}
              >
                <option value="Nom Appel d’Offre actuel">Nom Appel d’Offre actuel</option>
              </select>
              <label className="text-secondary font-medium whitespace-nowrap ml-3">Lot :</label>
              <input
                type="text"
                className="border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-40"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const cacheKey = `${appelOffre}::${lot}`;
                    setLoadingWorkspace(true);
                    soumissionsWorkspacesAPI.getWorkspace(lot, appelOffre, { createIfMissing: true })
                      .then(res => {
                        const data = res.data || {};
                        const listesData = Array.isArray(data.listes) ? data.listes : [];
                        workspaceCacheRef.current.set(cacheKey, { listes: listesData });
                        setListes(listesData);
                      })
                      .catch(() => {
                        setListes([]);
                      })
                      .finally(() => setLoadingWorkspace(false));
                  }
                }}
                onBlur={() => {
                  const cacheKey = `${appelOffre}::${lot}`;
                  const cached = workspaceCacheRef.current.get(cacheKey);
                  if (cached) {
                    setListes(Array.isArray(cached.listes) ? cached.listes : []);
                  }
                  // Refresh in background (debounced safety)
                  if (lotInputDebounceRef.current) clearTimeout(lotInputDebounceRef.current);
                  lotInputDebounceRef.current = setTimeout(() => {
                    soumissionsWorkspacesAPI.getWorkspace(lot, appelOffre, { createIfMissing: true })
                      .then(res => {
                        const data = res.data || {};
                        const listesData = Array.isArray(data.listes) ? data.listes : [];
                        workspaceCacheRef.current.set(cacheKey, { listes: listesData });
                        setListes(listesData);
                      })
                      .catch(() => {
                        if (!cached) setListes([]);
                      });
                  }, 150);
                }}
                placeholder="Saisir le lot"
                list="lots-datalist"
              />
              {(loadingLots || loadingWorkspace) && (
                <span className="ml-2 inline-block h-5 w-5 border-2 border-secondary/70 border-t-transparent rounded-full animate-spin" aria-label="Chargement..."></span>
              )}
              <datalist id="lots-datalist">
                {(lotNames || []).map(nomLot => (
                  <option key={nomLot} value={nomLot} />
                ))}
              </datalist>
              <button onClick={handleGenererDepuisDAO} className="ml-3 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md whitespace-nowrap">
                Générer à partir du DAO
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleSupprimerLot} className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
                <Delete fontSize="small" />
                Supprimer le lot
              </button>
              <button onClick={handleExporter} className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white text-sm px-3 py-2 rounded-md">
                <CloudDownload fontSize="small" />
                Exporter
              </button>
            </div>
          </div>

          {/* Action ajouter carte */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={handleAjouterListe} className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md">
              <Add fontSize="small" />
              Ajouter une tâche
            </button>
          </div>

          {/* Corps avec colonnes de cartes */}
          <div className="flex gap-4">
            {/* Colonnes */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {listes.map(liste => (
                <div
                  key={liste.id}
                  className={`w-full md:w-96 bg-white/60 dark:bg-primary/30 border ${dragOverListId===liste.id ? 'border-secondary' : 'border-muted-50'} rounded-lg p-4 shrink-0`}
                  onDragOver={(e) => handleDragOverList(liste.id, e)}
                  onDrop={() => handleDropOnList(liste.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h6 className="text-sm font-semibold text-secondary">{liste.titre}</h6>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRenameListe(liste.id)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200/70 text-gray-700" title="Modifier">
                        <Edit fontSize="small" />
                      </button>
                      <button onClick={() => handleDeleteListe(liste.id)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 text-red-600" title="Supprimer">
                        <Delete fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(liste.sousTaches || []).map(st => (
                      <div
                        key={st.id}
                        className={`group flex items-center justify-between bg-white dark:bg-primary border ${dragOverSubtaskId===st.id ? 'border-secondary' : 'border-muted-50'} rounded-md px-3 py-2 text-sm shadow-sm`}
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
                          <button onClick={(e) => { e.stopPropagation(); handleRenameSousTache(liste.id, st.id); }} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200/70 text-gray-700" title="Modifier">
                            <Edit fontSize="small" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSousTache(liste.id, st.id); }} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 text-red-600" title="Supprimer">
                            <Delete fontSize="small" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleAjouterSousTache(liste.id)} className="mt-4 text-sm text-secondary underline underline-offset-2">
                    Ajouter une sous-tâche
                  </button>
                </div>
              ))}
            </div>
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
                    {['Tâches à faire','Tâches En Cours','Tâches Terminées'].map(opt => (
                      <button key={opt} onClick={() => setModal(m => ({ ...m, value: opt }))} className={`text-xs px-2 py-1 rounded border ${modal.value===opt ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-primary border-muted-50'}`}>{opt}</button>
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
