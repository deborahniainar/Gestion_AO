import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { Description, CloudDownload, Add, Edit, Delete } from "@mui/icons-material";
import { useDao } from '../contexts/DaoContext'
import api from '../services/api'

/* Small Modal to add a Poste (lightweight, local) */
const PosteModal = ({ open, onClose, onSave, initialData = null }) => {
  const initialForm = { numero: '', nom: '' }
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (open && initialData) {
      setForm({
        numero: initialData.numero ?? '',
        nom: initialData.nom ?? ''
      })
      return
    }
    setForm(initialForm)
  }, [open, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    const payload = {
      numero: form.numero || '',
      nom: form.nom || ''
    }
    onSave(payload)
    setForm(initialForm)
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[420px]">
        <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter un Poste</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">N°</label>
              <input name="numero" value={form.numero} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="N°" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input name="nom" value={form.nom} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="Nom" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">Enregistrer</button>
        </div>
      </div>
    </div>
  )
}

/* Small Modal to add an Article (lightweight, local) */
const ArticleModal = ({ open, onClose, onSave, initialData = null }) => {
  const initialForm = { numero: '', designation: '', quantite: '', unite: '', coefficientK: '', productionPerDay: '' }
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (open && initialData) {
      // support old keys (description/quantite) and new structure
      setForm({
        numero: initialData.numero ?? '',
        designation: initialData.designation ?? initialData.description ?? '',
        quantite: initialData.quantite ?? initialData.quantite ?? '',
        unite: initialData.unite ?? '',
        coefficientK: initialData.coefficientK ?? initialData.coefficient_k ?? '',
        productionPerDay: initialData.productionPerDay ?? initialData.production_per_day ?? ''
      })
      return
    }
    setForm(initialForm)
  }, [open, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    const payload = {
      numero: form.numero || '',
      designation: form.designation || '',
      quantite: form.quantite ? Number(String(form.quantite).replace(/,/g, '.')) : 0,
      unite: form.unite || '',
      coefficientK: form.coefficientK ? Number(String(form.coefficientK).replace(/,/g, '.')) : null,
      productionPerDay: form.productionPerDay ? Number(String(form.productionPerDay).replace(/,/g, '.')) : null
    }
    onSave(payload)
    setForm(initialForm)
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[520px] max-w-full">
        <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter un Article</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">N°</label>
              <input name="numero" value={form.numero} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="N°" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Désignation</label>
              <input name="designation" value={form.designation} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="Désignation" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantité</label>
              <input name="quantite" value={form.quantite} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unité</label>
              <input name="unite" value={form.unite} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="Unité" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Coefficient K</label>
              <input name="coefficientK" value={form.coefficientK} onChange={handleChange} type="number" step="0.01" className="w-full border rounded px-2 py-1" placeholder="K" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Production / Jour</label>
              <input name="productionPerDay" value={form.productionPerDay} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" placeholder="0" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">Enregistrer</button>
        </div>
      </div>
    </div>
  )
}

/* Article workspace modal (edit an existing article) */
const ArticleWorkspaceModal = ({ open, onClose, article = null, onSave }) => {
  const initialForm = article ? {
    numero: article.numero ?? '',
    designation: article.designation ?? article.description ?? '',
    quantite: article.quantite ?? '',
    unite: article.unite ?? '',
    coefficientK: article.coefficientK ?? article.coefficient_k ?? '',
    productionPerDay: article.productionPerDay ?? article.production_per_day ?? ''
  } : { numero: '', designation: '', quantite: '', unite: '', coefficientK: '', productionPerDay: '' }
  const [form, setForm] = useState(initialForm)

  useEffect(() => { setForm(initialForm) }, [open, article])

  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })) }

  const handleSave = () => {
    const payload = {
      numero: form.numero || '',
      designation: form.designation || '',
      quantite: form.quantite ? Number(String(form.quantite).replace(/,/g, '.')) : 0,
      unite: form.unite || '',
      coefficientK: form.coefficientK ? Number(String(form.coefficientK).replace(/,/g, '.')) : null,
      productionPerDay: form.productionPerDay ? Number(String(form.productionPerDay).replace(/,/g, '.')) : null
    }
    onSave && onSave(payload)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[520px] max-w-full">
        <h2 className="text-lg font-bold mb-4 text-secondary">Espace de travail - Article</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">N°</label>
            <input name="numero" value={form.numero} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Désignation</label>
            <input name="designation" value={form.designation} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantité</label>
            <input name="quantite" value={form.quantite} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unité</label>
            <input name="unite" value={form.unite} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Coefficient K</label>
            <input name="coefficientK" value={form.coefficientK} onChange={handleChange} type="number" step="0.01" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Production / Jour</label>
            <input name="productionPerDay" value={form.productionPerDay} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => onClose && onClose()} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}

const PriceSDP = () => {
  const [rows, setRows] = useState([])
  const [openArticleModal, setOpenArticleModal] = useState(false)
  const [openArticleWorkspaceModal, setOpenArticleWorkspaceModal] = useState(false)
  const [activeArticle, setActiveArticle] = useState(null) // {posteIndex, articleIndex}
  const [currentPosteIndex, setCurrentPosteIndex] = useState(null)
  const [editPosteIndex, setEditPosteIndex] = useState(null)
  const [daos, setDaos] = useState([])
  const { savedLots, daoDocId, setSavedLots, setDaoId, setDaoDocId } = useDao()
  const [lot, setLot] = useState("")
  // poste modal state
  const [openPosteModal, setOpenPosteModal] = useState(false)
  const [currentArticleIndex, setCurrentArticleIndex] = useState(null)

  // workspace (inline) pour l'article sélectionné
  const [workspaceForm, setWorkspaceForm] = useState(null)

  // reset postes list when lot changes
  useEffect(() => {
    setRows([])
  }, [lot])

  const fetchDaos = useCallback(async () => {
    try {
      const res = await api.get('/dao/')
      setDaos(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('[PriceSDP] failed to load DAOs', err)
    }
  }, [])

  useEffect(() => { fetchDaos() }, [fetchDaos])

  const fetchDaoLots = useCallback(async () => {
    if (!daoDocId) return
    try {
      const res = await api.get(`/dao/${daoDocId}`)
      const lots = Array.isArray(res.data?.lots) ? res.data.lots.map((l) => ({ id: l.id, name: l.lot_name })) : []
      setSavedLots(lots)
      if (res.data?.dao_id) setDaoId(res.data.dao_id)
    } catch (err) {
      console.error('[PriceSDP] failed to fetch lots', err)
      setSavedLots([])
      setDaoId(null)
    }
  }, [daoDocId, setDaoId, setSavedLots])

  useEffect(() => { fetchDaoLots() }, [fetchDaoLots])

  useEffect(() => {
    if (!activeArticle) { setWorkspaceForm(null); return }
    const { posteIndex, articleIndex } = activeArticle
    const art = rows?.[posteIndex]?.articles?.[articleIndex]
    setWorkspaceForm({
      numero: art?.numero ?? '',
      designation: art?.designation ?? art?.description ?? '',
      quantite: art?.quantite ?? '',
      unite: art?.unite ?? '',
      coefficientK: art?.coefficientK ?? art?.coefficient_k ?? '',
      productionPerDay: art?.productionPerDay ?? art?.production_per_day ?? ''
    })
  }, [activeArticle, rows])

  const handleWorkspaceChange = (e) => {
    const { name, value } = e.target
    setWorkspaceForm(prev => ({ ...prev, [name]: value }))
  }

  const handleWorkspaceSave = () => {
    if (!activeArticle) return
    const { posteIndex, articleIndex } = activeArticle
    const payload = {
      numero: workspaceForm.numero || '',
      designation: workspaceForm.designation || '',
      quantite: workspaceForm.quantite ? Number(String(workspaceForm.quantite).replace(/,/g, '.')) : 0,
      unite: workspaceForm.unite || '',
      coefficientK: workspaceForm.coefficientK ? Number(String(workspaceForm.coefficientK).replace(/,/g, '.')) : null,
      productionPerDay: workspaceForm.productionPerDay ? Number(String(workspaceForm.productionPerDay).replace(/,/g, '.')) : null
    }
    setRows(prev => prev.map((p, pi) => {
      if (pi !== posteIndex) return p
      const newArticles = (p.articles || []).map((ar, ai) => ai === articleIndex ? { ...ar, ...payload } : ar)
      return { ...p, articles: newArticles }
    }))
    setActiveArticle(null)
  }

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">Gestion des Sous-détail de prix</h5>
        </header>

        <div className="bg-muted dark:bg-accent rounded-lg shadow-md p-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-3 flex-1 bg-white/60 dark:bg-primary/30 border border-muted-50 rounded-md px-3 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/10 text-secondary"><Description fontSize="small" /></span>

              <label className="text-secondary font-medium whitespace-nowrap">DAO :</label>
              <select className="text-primary dark:text-muted ml-auto border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-64" value={daoDocId || ""} onChange={(e) => {
                const val = e.target.value
                if (!val) { setDaoDocId(null); setDaoId(null); setSavedLots([]); return }
                setDaoDocId(Number(val))
              }}>
                <option value="">Sélectionner un DAO</option>
                {daos.map((d, i) => {
                  const display = d.original_name || (d.filename ? d.filename.split('/').pop() : null) || `DAO ${d.document_id}`
                  return (<option key={i} value={d.document_id}>{display}</option>)
                })}
              </select>

              {daoDocId ? (
                <>
                  <label className="text-secondary font-medium whitespace-nowrap ml-3">Lot :</label>
                  <select className="border border-gray-300 dark:border-muted-50 text-primary dark:text-muted bg-white dark:bg-primary text-sm rounded px-3 py-2 w-40" value={lot} onChange={(e) => {
                    const val = e.target.value
                    if (!val) { setLot(""); return }
                    setLot(Number(val))
                  }}>
                    <option value="">Sélectionner un Lot</option>
                    {(savedLots || []).map((s, i) => (<option key={i} value={s.id}>{s.name}</option>))}
                  </select>
                </>
              ) : (
                <div className="ml-3 text-sm text-gray-500">Aucun DAO sélectionné.</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button disabled={!lot} title="Exporter en Excel (.xlsx)" className="inline-flex items-center gap-2 bg-secondary/60 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-md"><CloudDownload fontSize="small" />XLSX</button>
              <button disabled={!lot} title="Exporter en PDF" className="inline-flex items-center gap-2 bg-gray-100 disabled:opacity-50 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-md"><CloudDownload fontSize="small" />PDF</button>
            </div>
          </div>

          {lot ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditPosteIndex(null); setOpenPosteModal(true) }} className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md"><Add fontSize="small" />Ajouter une Poste</button>
                </div>
              </div>

              {/* list shown immediately under the add button */}
              <div className="mb-4">
                {(rows || []).length === 0 ? (
                  <div className="p-4 text-sm text-muted">Le lot est sélectionné — vous pouvez ajouter un poste.</div>
                ) : (
                  <div className="p-2">
                    <ul className="flex flex-wrap gap-3 -mx-2">
                      {rows.map((r, i) => (
                        <li key={i} className="p-2 bg-main dark:bg-primary/20 rounded-md box-border">
                          <div className="h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xl text-secondary">{`Poste N°: ${r.numero || ''}`}</div>
                              <div className="flex items-center gap-2">
                                <button title="Éditer le poste" onClick={() => { setEditPosteIndex(i); setOpenPosteModal(true); }} className="p-1 rounded hover:bg-success-100"><Edit fontSize="small" className="text-success" /></button>
                                <button title="Supprimer le poste" onClick={() => {
                                  if (!window.confirm('Supprimer ce poste ?')) return
                                  setRows(prev => prev.filter((_, idx) => idx !== i))
                                  if (currentPosteIndex === i) setCurrentPosteIndex(null)
                                  if (editPosteIndex === i) setEditPosteIndex(null)
                                }} className="p-1 rounded hover:bg-red-100"><Delete fontSize="small" className="text-red-500" /></button>
                              </div>
                            </div>

                            {/* articles list for this poste */}
                            {(r.articles || []).length === 0 ? (
                              <div className="text-sm text-accent mt-2">Aucun article pour ce poste.</div>
                            ) : (
                              <ul className="mt-2 space-y-1">
                                {r.articles.map((a, ai) => {
                                  const designation = a.designation ?? a.description ?? ''
                                  const quantite = a.quantite ?? 0
                                  const unite = a.unite ?? ''
                                  const numero = a.numero ? `N°${a.numero} ` : ''
                                  return (
                                    <li key={ai}>
                                      <button
                                        onClick={() => { setActiveArticle({ posteIndex: i, articleIndex: ai }) }}
                                        className="w-full text-left text-lg text-primary dark:text-muted hover:underline"
                                      >
                                        {`Article ${numero}${designation}${quantite ? ' ×' + quantite : ''}${unite ? ' ' + unite : ''}`}
                                      </button>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}

                            {/* move the "Ajouter un Article" button to the bottom of the card */}
                            <div className="mt-3">
                              <button onClick={() => { setCurrentPosteIndex(i); setOpenArticleModal(true); }} className="inline-flex items-center gap-2 text-sm bg-muted hover:bg-primary text-secondary px-3 py-1 rounded-md">Ajouter un Article</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* per-poste article buttons shown inline with each poste above */}
              </div>
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500">Sélectionnez un Lot.</div>
          )}
        </div>

        {lot && (
          <>
            <PosteModal open={openPosteModal} onClose={() => { setOpenPosteModal(false); setEditPosteIndex(null) }} initialData={editPosteIndex != null ? rows[editPosteIndex] : null} onSave={(payload) => {
              if (editPosteIndex != null) {
                setRows(prev => prev.map((r, i) => i === editPosteIndex ? { ...r, ...payload } : r))
                setEditPosteIndex(null)
                setOpenPosteModal(false)
                return
              }
              setRows(prev => [...prev, payload])
              setOpenPosteModal(false)
            }} />

            <ArticleModal
              open={openArticleModal}
              initialData={(currentPosteIndex != null && currentArticleIndex != null) ? (rows[currentPosteIndex]?.articles?.[currentArticleIndex]) : null}
              onClose={() => { setOpenArticleModal(false); setCurrentPosteIndex(null); setCurrentArticleIndex(null); }}
              onSave={(payload) => {
                // if currentArticleIndex is set, update existing article
                if (currentPosteIndex != null && currentArticleIndex != null) {
                  setRows(prev => prev.map((p, idx) => {
                    if (idx !== currentPosteIndex) return p
                    const newArticles = (p.articles || []).map((ar, ai) => ai === currentArticleIndex ? { ...ar, ...payload } : ar)
                    return { ...p, articles: newArticles }
                  }))
                  setCurrentArticleIndex(null)
                  setCurrentPosteIndex(null)
                  setOpenArticleModal(false)
                  return
                }
                // else append to currentPosteIndex
                console.log('[PriceSDP] article added', payload, 'for poste', currentPosteIndex)
                if (currentPosteIndex == null) return
                setRows(prev => prev.map((p, idx) => idx === currentPosteIndex ? { ...p, articles: [...(p.articles || []), payload] } : p))
                setCurrentPosteIndex(null)
                setOpenArticleModal(false)
              }}
            />
          </>
        )}

        {/* Inline workspace for the selected article */}
        {activeArticle && (
          <div className="mt-4 p-4 border border-muted-50 rounded-md bg-white/60 dark:bg-primary/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-secondary">SDP{rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.numero ?? 'Article'}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveArticle(null)} className="px-3 py-1 bg-gray-100 rounded">Fermer</button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-primary dark:text-muted">
              <div><span className="font-medium">N° du prix unitaire:</span> {rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.numero ?? ''}</div>
              <div><span className="font-medium">Designation du prix Unitaire:</span> {rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.designation ?? rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.description ?? ''}</div>
              <div><span className="font-medium">Quantité estimé:</span> {`${rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.quantite ?? ''}${rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.unite ? ' ' + rows[activeArticle.posteIndex].articles[activeArticle.articleIndex].unite : ''}`}</div>
              <div><span className="font-medium">Production par jour:</span> {rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.productionPerDay ?? rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.production_per_day ?? ''}</div>
            </div>

            <div className="mt-4">
              <button onClick={() => console.log('Ajouter un Element pour', activeArticle)} className="px-3 py-1 bg-secondary text-white rounded">Ajouter un Element</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default PriceSDP
