import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { NotificationService, NotificationMessages } from '../services/notifications'
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

  const [appelOffre, setAppelOffre] = useState('Nom Appel d’Offre actuel');
  // Modèle multi-cartes: chaque carte = une liste de sous-tâches
  const [listes, setListes] = useState([
    {
      id: 'l1',
      titre: 'Tâche à faire',
      sousTaches: [
        { id: 'st1', titre: 'Page de garde', done: false },
        { id: 'st2', titre: 'Lettre de soumission', done: false },
        { id: 'st3', titre: 'Fiche de renseignement', done: false },
        { id: 'st4', titre: 'Formulaire blablabla', done: false }
      ]
    }
  ]);

  // Charger depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          setAppelOffre(parsed.appelOffre || 'Nom Appel d’Offre actuel');
          if (Array.isArray(parsed.listes)) {
            // migration si ancienne structure avec items
            const migrated = parsed.listes.map(l => {
              if (Array.isArray(l.sousTaches)) {
                return { ...l, sousTaches: l.sousTaches.map(s => ({ ...s, done: !!s.done })) };
              }
              if (Array.isArray(l.items)) {
                return { id: l.id || crypto.randomUUID(), titre: l.titre || 'Liste', sousTaches: l.items.map(it => ({ id: it.id || crypto.randomUUID(), titre: it.titre, done: !!it.done })) };
              }
              return { id: l.id || crypto.randomUUID(), titre: l.titre || 'Liste', sousTaches: [] };
            });
            setListes(migrated);
          } else if (Array.isArray(parsed.taches)) {
            // rétrocompatibilité plus ancienne
            setListes([{ id: 'l1', titre: 'Tâche à faire', sousTaches: parsed.taches.map(it => ({ id: it.id || crypto.randomUUID(), titre: it.titre, done: !!it.done })) }]);
          }
        }
      }
    } catch (e) {
      NotificationService.error("Impossible de charger les données locales");
    }
  }, []);

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

  const handleEnregistrer = () => {
    try {
      const payload = { appelOffre, listes };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      NotificationService.success('Enregistré localement');
    } catch (e) {
      NotificationService.error("Échec de l'enregistrement local");
    }
  };

  const handleExporter = () => {
    try {
      const payload = { exporteLe: new Date().toISOString(), appelOffre, listes };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soumission_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      NotificationService.success('Export JSON téléchargé');
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

  const handleDragStartSubtask = (listeId, sousTacheId) => {
    setDragData({ listeId, sousTacheId });
  };

  const handleDragEndSubtask = () => {
    setDragData(null);
    setDragOverListId(null);
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
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16 overflow-x-hidden'>
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
              <button onClick={handleGenererDepuisDAO} className="ml-3 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md whitespace-nowrap">
                Générer à partir du DAO
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleEnregistrer} className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-2 rounded-md">
                <Save fontSize="small" />
                Enregistrer
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
                        className="group flex items-center justify-between bg-white dark:bg-primary border border-muted-50 rounded-md px-3 py-2 text-sm shadow-sm"
                        draggable
                        onDragStart={() => handleDragStartSubtask(liste.id, st.id)}
                        onDragEnd={handleDragEndSubtask}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            aria-label="Marquer comme terminé"
                            checked={!!st.done}
                            onChange={() => handleToggleSousTache(liste.id, st.id)}
                            className="h-4 w-4 accent-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          />
                          <span className={`truncate ${st.done ? 'line-through text-gray-400' : ''}`}>{st.titre}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => handleRenameSousTache(liste.id, st.id)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200/70 text-gray-700" title="Modifier">
                            <Edit fontSize="small" />
                          </button>
                          <button onClick={() => handleDeleteSousTache(liste.id, st.id)} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 text-red-600" title="Supprimer">
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
                />
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
