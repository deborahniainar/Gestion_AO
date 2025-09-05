import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { Description, CloudDownload, Add, Edit, Delete, Close } from "@mui/icons-material";
import { useDao } from '../contexts/DaoContext'
import api from '../services/api'

/***********************
 * Modals for Poste and Article
 ***********************/

/* Small Modal to add a Poste (lightweight, local) */
const PosteModal = ({ open, onClose, onSave, initialData = null }) => {
  const initialForm = { numero: '', nom: '' }
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open && initialData) {
      setForm({
        numero: initialData.numero ?? '',
        nom: initialData.nom ?? ''
      })
      setErrors({})
      return
    }
    setForm(initialForm)
    setErrors({})
  }, [open, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = () => {
    const newErrors = {}
    if (!form.numero || String(form.numero).trim() === '') newErrors.numero = 'Ce champ est obligatoire'
    if (!form.nom || String(form.nom).trim() === '') newErrors.nom = 'Ce champ est obligatoire'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
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
              <label className="block text-sm font-medium mb-1">N° <span className="text-red-500">*</span></label>
              <input name="numero" value={form.numero} onChange={handleChange} required className="w-full border rounded px-2 py-1" placeholder="N°" />
              {errors.numero && <div className="text-xs text-red-500 mt-1">{errors.numero}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom <span className="text-red-500">*</span></label>
              <input name="nom" value={form.nom} onChange={handleChange} required className="w-full border rounded px-2 py-1" placeholder="Nom" />
              {errors.nom && <div className="text-xs text-red-500 mt-1">{errors.nom}</div>}
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
  const [errors, setErrors] = useState({})

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
      setErrors({})
      return
    }
    setForm(initialForm)
    setErrors({})
  }, [open, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = () => {
    const newErrors = {}
    if (!form.numero || String(form.numero).trim() === '') newErrors.numero = 'Ce champ est obligatoire'
    if (!form.designation || String(form.designation).trim() === '') newErrors.designation = 'Ce champ est obligatoire'
    if (form.quantite === '' || form.quantite === null || isNaN(Number(form.quantite))) newErrors.quantite = 'Quantité requise'
    if (!form.unite || String(form.unite).trim() === '') newErrors.unite = 'Ce champ est obligatoire'
    if (form.coefficientK === '' || form.coefficientK === null || isNaN(Number(form.coefficientK))) newErrors.coefficientK = 'Valeur requise'
    if (form.productionPerDay === '' || form.productionPerDay === null || isNaN(Number(form.productionPerDay))) newErrors.productionPerDay = 'Valeur requise'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }

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
              <input name="numero" value={form.numero} onChange={handleChange} required className="w-full border rounded px-2 py-1" placeholder="N°" />
              {errors.numero && <div className="text-xs text-red-500 mt-1">{errors.numero}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Désignation</label>
              <input name="designation" value={form.designation} onChange={handleChange} required className="w-full border rounded px-2 py-1" placeholder="Désignation" />
              {errors.designation && <div className="text-xs text-red-500 mt-1">{errors.designation}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantité <span className="text-red-500">*</span></label>
              <input name="quantite" value={form.quantite} onChange={handleChange} type="number" required className="w-full border rounded px-2 py-1" placeholder="0" />
              {errors.quantite && <div className="text-xs text-red-500 mt-1">{errors.quantite}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unité <span className="text-red-500">*</span></label>
              <input name="unite" value={form.unite} onChange={handleChange} required className="w-full border rounded px-2 py-1" placeholder="Unité" />
              {errors.unite && <div className="text-xs text-red-500 mt-1">{errors.unite}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Coefficient K <span className="text-red-500">*</span></label>
              <input name="coefficientK" value={form.coefficientK} onChange={handleChange} type="number" step="0.01" required className="w-full border rounded px-2 py-1" placeholder="K" />
              {errors.coefficientK && <div className="text-xs text-red-500 mt-1">{errors.coefficientK}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Production/Jour <span className="text-red-500">*</span></label>
              <input name="productionPerDay" value={form.productionPerDay} onChange={handleChange} type="number" required className="w-full border rounded px-2 py-1" placeholder="0" />
              {errors.productionPerDay && <div className="text-xs text-red-500 mt-1">{errors.productionPerDay}</div>}
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
  const [errors, setErrors] = useState({})

  useEffect(() => { setForm(initialForm) }, [open, article])
  useEffect(() => { if (open) setErrors({}) }, [open])

  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })) }

  const handleSave = () => {
    const newErrors = {}
    if (!form.numero || String(form.numero).trim() === '') newErrors.numero = 'Ce champ est obligatoire'
    if (!form.designation || String(form.designation).trim() === '') newErrors.designation = 'Ce champ est obligatoire'
    if (form.quantite === '' || form.quantite === null || isNaN(Number(form.quantite))) newErrors.quantite = 'Quantité requise'
    if (!form.unite || String(form.unite).trim() === '') newErrors.unite = 'Ce champ est obligatoire'
    if (form.coefficientK === '' || form.coefficientK === null || isNaN(Number(form.coefficientK))) newErrors.coefficientK = 'Valeur requise'
    if (form.productionPerDay === '' || form.productionPerDay === null || isNaN(Number(form.productionPerDay))) newErrors.productionPerDay = 'Valeur requise'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }

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
            <input name="numero" value={form.numero} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
            {errors.numero && <div className="text-xs text-red-500 mt-1">{errors.numero}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Désignation</label>
            <input name="designation" value={form.designation} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
            {errors.designation && <div className="text-xs text-red-500 mt-1">{errors.designation}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantité</label>
            <input name="quantite" value={form.quantite} onChange={handleChange} type="number" required className="w-full border rounded px-2 py-1" />
            {errors.quantite && <div className="text-xs text-red-500 mt-1">{errors.quantite}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unité</label>
            <input name="unite" value={form.unite} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
            {errors.unite && <div className="text-xs text-red-500 mt-1">{errors.unite}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Coefficient K</label>
            <input name="coefficientK" value={form.coefficientK} onChange={handleChange} type="number" step="0.01" required className="w-full border rounded px-2 py-1" />
            {errors.coefficientK && <div className="text-xs text-red-500 mt-1">{errors.coefficientK}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Production/Jour</label>
            <input name="productionPerDay" value={form.productionPerDay} onChange={handleChange} type="number" required className="w-full border rounded px-2 py-1" />
            {errors.productionPerDay && <div className="text-xs text-red-500 mt-1">{errors.productionPerDay}</div>}
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

/***********************
 * Confirmation Modal réutilisable
 ***********************/

const ConfirmModal = ({ open, message, onCancel, onConfirm }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[420px]">
        <h3 className="text-lg font-semibold text-secondary mb-3">Confirmer</h3>
        <div className="text-sm text-primary dark:text-muted mb-4">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Supprimer</button>
        </div>
      </div>
    </div>
  )
}

/***********************
 * Main PriceSDP Component
 ***********************/

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

  // add-element form inside workspace
  const [showAddElementForm, setShowAddElementForm] = useState(false)
  const [elementForm, setElementForm] = useState({ elementType: "Main d'oeuvre", designation: '', quantity: '', unit: '' })
  const [designationOptions, setDesignationOptions] = useState([])
  const [loadingDesignations, setLoadingDesignations] = useState(false)
  // track if we are editing an existing element (index in the article.elements array)
  const [editingElementIndex, setEditingElementIndex] = useState(null)

  // Nouveaux états pour le modal de confirmation
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  // element-level validation state
  const [elementErrors, setElementErrors] = useState({})

  // load designation options from the selected lot depending on element type
  const loadDesignationOptions = useCallback(async (type) => {
    if (!daoDocId || !lot) return []
    setLoadingDesignations(true)
    try {
      const res = await api.get(`/dao/${daoDocId}`)
      const lots = Array.isArray(res.data?.lots) ? res.data.lots : []
      const lotObj = lots.find(l => Number(l.id) === Number(lot) || Number(l.lot_id) === Number(lot))
      if (!lotObj) return []

      const mapArr = (keys) => {
        const out = []
        for (const k of keys) {
          if (Array.isArray(lotObj[k])) out.push(...lotObj[k])
        }
        // also check nested objects with rows
        for (const key of Object.keys(lotObj)) {
          const val = lotObj[key]
          if (val && typeof val === 'object' && Array.isArray(val.rows)) out.push(...val.rows)
        }
        return out
      }

      let candidates = []
      if (type === "Main d'oeuvre") {
        candidates = mapArr(['priceMO', 'price_mo', 'mo', 'priceMO_rows', 'workforce', 'personnels'])
      } else if (type === 'Matériaux') {
        candidates = mapArr(['priceMTX', 'price_mtx', 'mtx', 'priceMTX_rows', 'materials', 'matieres'])
      } else if (type === 'Equipements') {
        candidates = mapArr(['priceEQU', 'price_equ', 'equipements', 'equipments', 'priceEQU_rows'])
      }

      // Build options
      const opts = candidates.map((c, idx) => {
        const label = (c.designation ?? c.description ?? c.nom ?? c.name ?? (c.poste ? String(c.poste) : '')) || (c.numero ? `Poste ${c.numero}` : `item-${idx}`)
        const value = JSON.stringify({ idx, id: c.id ?? c.personnel_id ?? c.cmo_personnel_id ?? null, rawKey: idx })
        return { label, value, raw: c }
      })
      setDesignationOptions(opts)
      return opts
    } catch (err) {
      console.warn('[PriceSDP] failed to load designations for lot', lot, err)
      setDesignationOptions([])
      return []
    } finally {
      setLoadingDesignations(false)
    }
  }, [daoDocId, lot])

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

  const handleElementChange = (e) => {
    const { name, value } = e.target
    setElementForm(prev => ({ ...prev, [name]: value }))
  }

  // Change element type (Main/Mat/Equip) and reload designation options
  const handleElementTypeChange = async (e) => {
    const val = e.target.value
    setElementForm(prev => ({ ...prev, elementType: val, designation: '' }))
    await loadDesignationOptions(val)
  }

  // Start adding a new element or editing an existing one (pass elementIndex to edit)
  const handleStartAddElement = async (elementIndex = null) => {
    // reset editing index by default
    setEditingElementIndex(null)
    if (elementIndex != null && activeArticle) {
      const { posteIndex, articleIndex } = activeArticle
      const art = rows?.[posteIndex]?.articles?.[articleIndex] || {}
      const elems = Array.isArray(art.elements) ? art.elements : []
      const el = elems[elementIndex]
      if (el) {
        setElementForm({ elementType: el.type || "Main d'oeuvre", designation: el.designation || '', quantity: el.quantity ?? '', unit: el.unit || '' })
        setEditingElementIndex(elementIndex)
        await loadDesignationOptions(el.type || "Main d'oeuvre")
        setShowAddElementForm(true)
        return
      }
    }
    // new element
    setElementForm({ elementType: "Main d'oeuvre", designation: '', quantity: '', unit: '' })
    setEditingElementIndex(null)
    await loadDesignationOptions("Main d'oeuvre")
    setShowAddElementForm(true)
  }

  // validate element form before adding
  const validateElementForm = () => {
    const errs = {}
    if (!elementForm.elementType || String(elementForm.elementType).trim() === '') errs.elementType = 'Type requis'
    if (!elementForm.designation || String(elementForm.designation).trim() === '') errs.designation = 'Désignation requise'
    if (elementForm.quantity === '' || elementForm.quantity === null || isNaN(Number(elementForm.quantity))) errs.quantity = 'Quantité requise'
    if (!elementForm.unit || String(elementForm.unit).trim() === '') errs.unit = 'Unité requise'
    setElementErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddElement = () => {
    if (!validateElementForm()) return
    if (!activeArticle) return
    const { posteIndex, articleIndex } = activeArticle

    // try to attach the original raw object for later price calculations
    let selectedRaw = null
    let selectedLabel = null
    try {
      const sel = designationOptions.find(o => o.value === elementForm.designation)
      selectedRaw = sel ? sel.raw : null
      selectedLabel = sel ? sel.label : null
    } catch (err) {
      selectedRaw = null
      selectedLabel = null
    }

    const payload = {
      type: elementForm.elementType,
      designation: elementForm.designation,
      label: selectedLabel,
      quantity: elementForm.quantity ? Number(String(elementForm.quantity).replace(/,/g, '.')) : 0,
      unit: elementForm.unit || '',
      raw: selectedRaw
    }

    setRows(prev => prev.map((p, pi) => {
      if (pi !== posteIndex) return p
      const articles = Array.isArray(p.articles) ? [...p.articles] : []
      const a = { ...(articles[articleIndex] || {}) }
      const existing = Array.isArray(a.elements) ? [...a.elements] : []
      if (editingElementIndex != null && editingElementIndex >= 0 && editingElementIndex < existing.length) {
        // replace existing element
        existing[editingElementIndex] = payload
        a.elements = existing
      } else {
        // append
        a.elements = [...existing, payload]
      }
      articles[articleIndex] = a
      return { ...p, articles }
    }))

    setShowAddElementForm(false)
    setEditingElementIndex(null)
    setElementForm({ elementType: "Main d'oeuvre", designation: '', quantity: '', unit: '' })
    setElementErrors({})
  }

  // Edit an element: open modal pre-filled
  const handleEditElement = async (elementIndex) => {
    await handleStartAddElement(elementIndex)
  }

  // Delete an element from the active article
  const handleDeleteElement = (elementIndex) => {
    if (!activeArticle) return
    // Open confirmation modal and set the actual delete action
    setConfirmMessage('Supprimer cet élément ?')
    setConfirmAction(() => () => {
      const { posteIndex, articleIndex } = activeArticle
      setRows(prev => prev.map((p, pi) => {
        if (pi !== posteIndex) return p
        const articles = Array.isArray(p.articles) ? [...p.articles] : []
        const a = { ...(articles[articleIndex] || {}) }
        a.elements = Array.isArray(a.elements) ? a.elements.filter((_, idx) => idx !== elementIndex) : []
        articles[articleIndex] = a
        return { ...p, articles }
      }))
    })
    setConfirmOpen(true)
  }

  // helper: compute row totals for exports (same logic as table)
  const computeRowTotalsForExport = (e, art) => {
    const qUnit = Number(e.quantity || 0)
    const production = Number(art.productionPerDay ?? art.production_per_day ?? 1) || 1
    const DH = qUnit * production
    const raw = e.raw || {}
    const unit = e.unit || art.unite || ''

    const puMO = Number(
      raw.total_h ?? raw.total_hour ?? raw.total ?? raw.th ?? raw.th_mo ?? raw.prix_h ?? raw.prix_horaire ?? raw.tarif_horaire ?? raw.price_unit ?? raw.pu ?? raw.price ?? 0
    ) || 0
    const puMTX = Number(
      raw.total ?? raw.total_m ?? raw.total_unit ?? raw.total_price ?? raw.price_unit ?? raw.pu ?? raw.price ?? 0
    ) || 0

    const moTotal = (String(e.type || '').toLowerCase().includes('main')) ? (DH * puMO) : 0
    const mtxTotal = (String(e.type || '').toLowerCase().includes('mat')) ? (DH * puMTX) : 0

    const amortPerDay = Number(
      raw.amortissement_jour ?? raw.amortissement_j ?? raw.amortissement_day ?? raw.amortissement ?? raw.amortissement_total ?? raw.amort_j ?? raw.A ?? 0
    ) || 0
    const carburantPerDay = Number(
      raw.carburant_jour ?? raw.carburant_j ?? raw.carburant_day ?? raw.carburant ?? raw.carburant_total ?? raw.cc ?? 0
    ) || 0
    const lubrifiantPerDay = Number(
      raw.lubrifiant_jour ?? raw.lubrifiant_j ?? raw.lubrifiant_day ?? raw.lubrifiant ?? raw.cl ?? raw.CL ?? 0
    ) || 0
    const entretienPerDay = Number(
      raw.cpr ?? raw.entretien_jour ?? raw.entretien_j ?? raw.entretien_day ?? raw.entretien ?? 0
    ) || 0

    const twm = Number(raw.twm ?? raw.twm_equ ?? raw.TWM ?? raw.taux_mise ?? 1) || 1

    const amortH = twm ? (amortPerDay / twm) : 0
    const carburantH = twm ? (carburantPerDay / twm) : 0
    const lubrifiantH = twm ? (lubrifiantPerDay / twm) : 0
    const sumCarLubH = carburantH + lubrifiantH
    const entretienH = twm ? (entretienPerDay / twm) : 0
    const equPerH = amortH + sumCarLubH + entretienH
    const equTotal = (String(e.type || '').toLowerCase().includes('equip')) ? (DH * equPerH) : 0

    return { qUnit, production, DH, unit, puMO, puMTX, moTotal, mtxTotal, amortH, sumCarLubH, entretienH, equTotal }
  }

  // Export the current active article workspace to Excel
  const exportWorkspaceExcel = async () => {
    if (!activeArticle) { alert('Aucun article actif à exporter'); return }
    const { posteIndex, articleIndex } = activeArticle
    const art = rows?.[posteIndex]?.articles?.[articleIndex] || {}
    const elems = Array.isArray(art.elements) ? art.elements : []
    try {
      const XLSX = await import('xlsx')
      const headers = ['Désignation', 'Qté unitaire', 'Durée (h/j)', 'Unité', 'Prix unitaire (MO)', 'TOTAL/jour (MO)', 'Prix unitaire (MAT)', 'TOTAL/jour (MAT)', 'AMORTISSEMENT/h (EQU)', 'CARBURANT-LUBRIFIANTS/h (EQU)', 'ENTRETIEN/h (EQU)', 'TOTAL/jour (EQU)', 'TOTAUX/jour']
      const rowsData = elems.map(e => {
        const t = computeRowTotalsForExport(e, art)
        return [
          e.label ?? e.designation ?? (e.raw && (e.raw.designation || e.raw.description || e.raw.nom)) ?? '',
          t.qUnit || '',
          t.DH ? t.DH.toFixed(2) : '',
          t.unit || '',
          (String(e.type || '').toLowerCase().includes('main') ? (t.puMO ? t.puMO.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('main') ? (t.moTotal ? t.moTotal.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('mat') ? (t.puMTX ? t.puMTX.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('mat') ? (t.mtxTotal ? t.mtxTotal.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.amortH ? t.amortH.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.sumCarLubH ? t.sumCarLubH.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.entretienH ? t.entretienH.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.equTotal ? t.equTotal.toFixed(2) : '') : ''),
          (((String(e.type || '').toLowerCase().includes('main') ? t.moTotal : 0) + (String(e.type || '').toLowerCase().includes('mat') ? t.mtxTotal : 0) + (String(e.type || '').toLowerCase().includes('equip') ? t.equTotal : 0))).toFixed(2)
        ]
      })

      const wsData = [headers, ...rowsData]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'SDP')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const numero = art.numero || `unknown`
      const filename = `SDP${String(numero).replace(/[^a-z0-9\-_]/gi, '_')}.xlsx`
      a.href = url
      a.setAttribute('download', filename)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Excel export failed', err)
      alert('L\'export Excel nécessite la librairie "xlsx". Veuillez installer la dépendance (xlsx) et recharger l\'application.')
    }
  }

  // Export the current active article workspace to PDF
  const exportWorkspacePDF = async () => {
    if (!activeArticle) { alert('Aucun article actif à exporter'); return }
    const { posteIndex, articleIndex } = activeArticle
    const art = rows?.[posteIndex]?.articles?.[articleIndex] || {}
    const elems = Array.isArray(art.elements) ? art.elements : []
    try {
      const { jsPDF } = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')
      const autoTable = autoTableModule && (autoTableModule.default || autoTableModule)
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const margin = 40
      const title = `SDP${art.numero || ''}`
      doc.setFontSize(14)
      doc.text(title, margin, 60)
      const headers = ['Désignation', 'Qté unitaire', 'Durée (h/j)', 'Unité', 'Prix unitaire (MO)', 'TOTAL/jour (MO)', 'Prix unitaire (MAT)', 'TOTAL/jour (MAT)', 'AMORTISSEMENT/h (EQU)', 'CARBURANT-LUBRIFIANTS/h (EQU)', 'ENTRETIEN/h (EQU)', 'TOTAL/jour (EQU)', 'TOTAUX/jour']
      const body = elems.map(e => {
        const t = computeRowTotalsForExport(e, art)
        return [
          e.label ?? e.designation ?? (e.raw && (e.raw.designation || e.raw.description || e.raw.nom)) ?? '',
          t.qUnit || '',
          t.DH ? t.DH.toFixed(2) : '',
          t.unit || '',
          (String(e.type || '').toLowerCase().includes('main') ? (t.puMO ? t.puMO.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('main') ? (t.moTotal ? t.moTotal.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('mat') ? (t.puMTX ? t.puMTX.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('mat') ? (t.mtxTotal ? t.mtxTotal.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.amortH ? t.amortH.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.sumCarLubH ? t.sumCarLubH.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.entretienH ? t.entretienH.toFixed(2) : '') : ''),
          (String(e.type || '').toLowerCase().includes('equip') ? (t.equTotal ? t.equTotal.toFixed(2) : '') : ''),
          (((String(e.type || '').toLowerCase().includes('main') ? t.moTotal : 0) + (String(e.type || '').toLowerCase().includes('mat') ? t.mtxTotal : 0) + (String(e.type || '').toLowerCase().includes('equip') ? t.equTotal : 0))).toFixed(2)
        ]
      })

      if (typeof autoTable === 'function') {
        autoTable(doc, { head: [headers], body: body, startY: 80, margin: { left: margin, right: margin } })
      } else if (typeof doc.autoTable === 'function') {
        doc.autoTable({ head: [headers], body: body, startY: 80, margin: { left: margin, right: margin } })
      } else {
        throw new Error('jspdf-autotable not available')
      }

      const numero = art.numero || `unknown`
      const filename = `SDP+${String(numero).replace(/[^a-z0-9\-_]/gi, '_')}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF export failed', err)
      alert('L\'export PDF nécessite les librairies "jspdf" et "jspdf-autotable". Veuillez les installer et recharger l\'application.')
    }
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
              <button disabled={!activeArticle} onClick={exportWorkspaceExcel} title="Exporter workspace actif en Excel (.xlsx)" className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm ${activeArticle ? 'bg-secondary hover:bg-secondary/90 text-white' : 'bg-secondary/60 disabled:opacity-50 text-white cursor-not-allowed'}`}><CloudDownload fontSize="small" />XLSX</button>
              <button disabled={!activeArticle} onClick={exportWorkspacePDF} title="Exporter workspace actif en PDF" className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm ${activeArticle ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-100 disabled:opacity-50 text-gray-400 cursor-not-allowed'}`}><CloudDownload fontSize="small" />PDF</button>
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
                                  // open confirmation modal and capture current index
                                  setConfirmMessage('Supprimer ce poste ?')
                                  setConfirmAction(() => () => {
                                    setRows(prev => prev.filter((_, idx) => idx !== i))
                                    if (currentPosteIndex === i) setCurrentPosteIndex(null)
                                    if (editPosteIndex === i) setEditPosteIndex(null)
                                  })
                                  setConfirmOpen(true)
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
                {/* Export workspace buttons (active article) */}
                {/* <button title="Exporter workspace en Excel (XLSX)" onClick={exportWorkspaceExcel} className="inline-flex items-center gap-2 bg-secondary/60 text-white text-sm px-2 py-1 rounded-md hover:bg-secondary/90">
                  <CloudDownload fontSize="small" />XLSX
                </button>
                <button title="Exporter workspace en PDF" onClick={exportWorkspacePDF} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded-md hover:bg-gray-200">
                  <CloudDownload fontSize="small" />PDF
                </button> */}

                {/* Edit article */}
                <button title="Éditer l'article" onClick={() => {
                  const { posteIndex, articleIndex } = activeArticle
                  setCurrentPosteIndex(posteIndex)
                  setCurrentArticleIndex(articleIndex)
                  setOpenArticleModal(true)
                }} className="p-1 rounded hover:bg-success-100">
                  <Edit fontSize="small" className="text-success" />
                </button>

                {/* Delete article (uses global confirm modal) */}
                <button title="Supprimer l'article" onClick={() => {
                  const { posteIndex, articleIndex } = activeArticle
                  setConfirmMessage('Supprimer cet article ?')
                  setConfirmAction(() => () => {
                    setRows(prev => prev.map((p, pi) => {
                      if (pi !== posteIndex) return p
                      const articles = Array.isArray(p.articles) ? [...p.articles] : []
                      articles.splice(articleIndex, 1)
                      return { ...p, articles }
                    }))
                    setActiveArticle(null)
                    setCurrentArticleIndex(null)
                    setCurrentPosteIndex(null)
                  })
                  setConfirmOpen(true)
                }} className="p-1 rounded hover:bg-red-100">
                  <Delete fontSize="small" className="text-red-500" />
                </button>

                {/* Close workspace */}
                <button title="Fermer" onClick={() => setActiveArticle(null)} className="p-1 rounded hover:bg-gray-200">
                  <Close fontSize="small" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-primary dark:text-muted">
              <div><span className="font-medium">N° du prix unitaire:</span> {rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.numero ?? ''}</div>
              <div><span className="font-medium">Designation du prix Unitaire:</span> {rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.designation ?? rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.description ?? ''}</div>
              <div><span className="font-medium">Quantité estimé:</span> {`${rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.quantite ?? ''}${rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.unite ? ' ' + rows[activeArticle.posteIndex].articles[activeArticle.articleIndex].unite : ''}`}</div>
              <div><span className="font-medium">Production par jour:</span> {rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.productionPerDay ?? rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex]?.production_per_day ?? ''}</div>
            </div>

            {/* keep the original trigger button in the workspace */}
            <div className="mt-4">
              <button onClick={handleStartAddElement} className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">
                <Add fontSize="small" className="mr-2" /> Ajouter un élément
              </button>
            </div>

            {/* Add Element Modal (uses the same form fields as before, now in a modal) */}
            {showAddElementForm && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[520px] max-w-full">
                  <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter un élément</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type d'élément</label>
                        <select name="elementType" value={elementForm.elementType} onChange={handleElementTypeChange} className="w-full border rounded px-2 py-1">
                          <option value="Main d'oeuvre">Main d'oeuvre</option>
                          <option value="Matériaux">Matériaux</option>
                          <option value="Equipements">Equipements</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Désignation</label>
                        <select name="designation" value={elementForm.designation} onChange={handleElementChange} className="w-full border rounded px-2 py-1" disabled={loadingDesignations}>
                          <option value="">Sélectionner une désignation</option>
                          {designationOptions.map((opt, idx) => (
                            <option key={idx} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {loadingDesignations && <div className="text-sm text-muted">Chargement des désignations...</div>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Quantité Unitaire</label>
                        <input name="quantity" value={elementForm.quantity} onChange={handleElementChange} type="number" className="w-full border rounded px-2 py-1" placeholder="0" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Unité</label>
                        <input name="unit" value={elementForm.unit} onChange={handleElementChange} className="w-full border rounded px-2 py-1" placeholder="Unité" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setShowAddElementForm(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
                    <button onClick={handleAddElement} className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">Ajouter l'élément</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tableau structuré : n'apparaît que si l'article a des éléments */}
            {activeArticle && (() => {
              const art = rows?.[activeArticle.posteIndex]?.articles?.[activeArticle.articleIndex] || {}
              const elems = Array.isArray(art.elements) ? art.elements : []
              if (elems.length === 0) return null

              const isType = (e, key) => (String(e.type || '').toLowerCase()).includes(key)

              // Tri des éléments par type : Main d'oeuvre -> Matériaux -> Equipements
              const orderPriority = (el) => {
                const t = String(el?.type || '').toLowerCase()
                if (t.includes('main')) return 0
                if (t.includes('mat')) return 1
                if (t.includes('equip')) return 2
                return 3
              }

              // ensure we have a sorted array of elements by the defined priority
              const sortedElems = [...elems].sort((a, b) => {
                const oa = orderPriority(a)
                const ob = orderPriority(b)
                return oa - ob
              })

              // build grouped arrays (Main, Matériaux, Equipements, others)
              const mains = sortedElems.filter(e => isType(e, 'main'))
              const mats = sortedElems.filter(e => isType(e, 'mat'))
              const equips = sortedElems.filter(e => isType(e, 'equip'))
              const others = sortedElems.filter(e => !isType(e, 'main') && !isType(e, 'mat') && !isType(e, 'equip'))

              // helper to compute totals for an element (without mutating outer sums)
              const computeRowTotals = (e) => {
                const qUnit = Number(e.quantity || 0)
                const production = Number(art.productionPerDay ?? art.production_per_day ?? 1) || 1
                const DH = qUnit * production
                const raw = e.raw || {}
                const unit = e.unit || art.unite || ''

                const puMO = Number(
                  raw.total_h ?? raw.total_hour ?? raw.total ?? raw.th ?? raw.th_mo ?? raw.prix_h ?? raw.prix_horaire ?? raw.tarif_horaire ?? raw.price_unit ?? raw.pu ?? raw.price ?? 0
                ) || 0
                const puMTX = Number(
                  raw.total ?? raw.total_m ?? raw.total_unit ?? raw.total_price ?? raw.price_unit ?? raw.pu ?? raw.price ?? 0
                ) || 0

                const moTotal = isType(e, 'main') ? (DH * puMO) : 0
                const mtxTotal = isType(e, 'mat') ? (DH * puMTX) : 0

                // For equipment: expect per-day values in the equipment raw row and a TWM on the same row
                // amortissement/H = amortissement_jour / twm
                const amortPerDay = Number(
                  raw.amortissement_jour ?? raw.amortissement_j ?? raw.amortissement_day ?? raw.amortissement ?? raw.amortissement_total ?? raw.amort_j ?? raw.A ?? 0
                ) || 0
                const carburantPerDay = Number(
                  raw.carburant_jour ?? raw.carburant_j ?? raw.carburant_day ?? raw.carburant ?? raw.carburant_total ?? raw.cc ?? 0
                ) || 0
                const lubrifiantPerDay = Number(
                  raw.lubrifiant_jour ?? raw.lubrifiant_j ?? raw.lubrifiant_day ?? raw.lubrifiant ?? raw.cl ?? raw.CL ?? 0
                ) || 0
                // prefer cpr (coût pièces de rechange) as the entretien per-day value if present
                const entretienPerDay = Number(
                  raw.cpr ?? raw.entretien_jour ?? raw.entretien_j ?? raw.entretien_day ?? raw.entretien ?? 0
                ) || 0

                const twm = Number(raw.twm ?? raw.twm_equ ?? raw.TWM ?? raw.taux_mise ?? 1) || 1

                const amortH = twm ? (amortPerDay / twm) : 0
                const carburantH = twm ? (carburantPerDay / twm) : 0
                const lubrifiantH = twm ? (lubrifiantPerDay / twm) : 0
                const sumCarLubH = carburantH + lubrifiantH
                const entretienH = twm ? (entretienPerDay / twm) : 0
                const equPerH = amortH + sumCarLubH + entretienH
                const equTotal = isType(e, 'equip') ? (DH * equPerH) : 0

                return { qUnit, production, DH, unit, puMO, puMTX, moTotal, mtxTotal, amortH, carburantH: carburantH, lubrifiantH: lubrifiantH, sumCarLubH, entretienH, equTotal }
              }

              // compute group subtotals without mutating sums
              const sumMO = mains.reduce((acc, el) => acc + computeRowTotals(el).moTotal, 0)
              const sumMTX = mats.reduce((acc, el) => acc + computeRowTotals(el).mtxTotal, 0)
              const sumEQU = equips.reduce((acc, el) => acc + computeRowTotals(el).equTotal, 0)

              const renderElementRow = (e, keyIdx) => {
                const { qUnit, DH, unit, puMO, puMTX, moTotal, mtxTotal, amortH, sumCarLubH, entretienH, equTotal } = computeRowTotals(e)
                const raw = e.raw || {}

                return (
                  <tr key={keyIdx} className="odd:bg-white even:bg-gray-50">
                    <td className="border p-2 align-top">{e.label ?? raw.designation ?? raw.description ?? raw.nom ?? raw.name ?? (raw.prenom ? `${raw.prenom} ${raw.nom}` : '') ?? e.designation ?? ''}</td>
                    <td className="border p-2 text-right">{qUnit !== 0 ? qUnit : ''}</td>
                    <td className="border p-2 text-right">{DH ? DH.toFixed(2) : ''}</td>
                    <td className="border p-2">{unit}</td>

                    {/* MO columns */}
                    <td className="border p-2 text-right">{isType(e, 'main') ? puMO.toFixed(2) : ''}</td>
                    <td className="border p-2 text-right">{isType(e, 'main') ? moTotal.toFixed(2) : ''}</td>

                    {/* MAT columns */}
                    <td className="border p-2 text-right">{isType(e, 'mat') ? puMTX.toFixed(2) : ''}</td>
                    <td className="border p-2 text-right">{isType(e, 'mat') ? mtxTotal.toFixed(2) : ''}</td>

                    {/* EQU columns */}
                    <td className="border p-2 text-right">{isType(e, 'equip') ? amortH.toFixed(2) : ''}</td>
                    <td className="border p-2 text-right">{isType(e, 'equip') ? sumCarLubH.toFixed(2) : ''}</td>
                    <td className="border p-2 text-right">{isType(e, 'equip') ? entretienH.toFixed(2) : ''}</td>
                    <td className="border p-2 text-right">{isType(e, 'equip') ? equTotal.toFixed(2) : ''}</td>

                    <td className="border p-2 text-right">{(((isType(e, 'main') ? moTotal : 0) + (isType(e, 'mat') ? mtxTotal : 0) + (isType(e, 'equip') ? equTotal : 0))).toFixed(2)}</td>

                    {/* Action column */}
                    <td className="border p-2 text-center">
                      <button onClick={() => handleEditElement(typeof keyIdx === 'string' ? Number(keyIdx.split('-').pop()) : keyIdx)} className="p-1 mr-2 hover:bg-success-100 rounded"><Edit fontSize="small" className="text-success" /></button>
                      <button onClick={() => handleDeleteElement(typeof keyIdx === 'string' ? Number(keyIdx.split('-').pop()) : keyIdx)} className="p-1 hover:bg-red-100 rounded"><Delete fontSize="small" className="text-red-500" /></button>
                    </td>

                  </tr>
                )
              }

              const rowsJsx = []

              const pushGroup = (label, items, groupTotal) => {
                if (!items || items.length === 0) return
                rowsJsx.push(
                  <tr key={`group-${label}`} className="bg-gray-100 font-semibold">
                    <td className="border p-2" colSpan={14}>{label}</td>
                  </tr>
                )
                items.forEach((it) => {
                  const elIndex = elems.indexOf(it)
                  rowsJsx.push(renderElementRow(it, `${label}-${elIndex}`, elIndex))
                })
                // subtotal row for this group in the last column
                rowsJsx.push(
                  <tr key={`subtotal-${label}`} className="bg-gray-50 font-semibold">
                    <td className="border p-2" colSpan={12}>{`Total ${label}`}</td>
                    <td className="border p-2 text-right">{groupTotal.toFixed(2)}</td>
                  </tr>
                )
              }

              pushGroup("Main d'oeuvre", mains, sumMO)
              pushGroup('Matériaux', mats, sumMTX)
              pushGroup('Equipements', equips, sumEQU)
              pushGroup('Autres', others, 0)

              const totalT = sumMO + sumMTX + sumEQU
              const coefK = Number(art.coefficientK ?? art.coefficient_k ?? 1) || 1
              const productionForNet = Number(art.productionPerDay ?? art.production_per_day ?? 1) || 1
              const costNetPerUnit = productionForNet !== 0 ? ((coefK * totalT) / productionForNet) : 0

              return (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">ÉLÉMENTS DU PRIX / DÉSIGNATION</th>
                        <th className="border p-2">Qté unitaire</th>
                        <th className="border p-2">Quantité OU DUREE EN HEURE/Jour</th>
                        <th className="border p-2">Unité</th>
                        <th className="border p-2 text-center">Prix unitaire (MO)</th>
                        <th className="border p-2 text-center">TOTAL/jour (MO)</th>
                        <th className="border p-2 text-center">Prix unitaire (MAT)</th>
                        <th className="border p-2 text-center">TOTAL/jour (MAT)</th>
                        <th className="border p-2 text-center">AMORTISSEMENT/h (EQU)</th>
                        <th className="border p-2 text-center">CARBURANT-LUBRIFIANTS/h (EQU)</th>
                        <th className="border p-2 text-center">ENTRETIEN/h (EQU)</th>
                        <th className="border p-2 text-center">TOTAL/jour (EQU)</th>
                        <th className="border p-2">TOTAUX/jour</th>
                        <th className="border p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsJsx}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted font-semibold">
                        <td className="p-2">Totaux</td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right">{totalT ? totalT.toFixed(2) : ''}</td>
                        <td className="p-2 border"></td>
                      </tr>
                      <tr className="bg-muted font-semibold">
                        <td className="p-2">Coût Net / Unité</td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right">{costNetPerUnit ? costNetPerUnit.toFixed(2) : ''}</td>
                        <td className="p-2 border"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })()}
          </div>
        )}
      </main>

      {/* Confirmation modal global */}
      <ConfirmModal
        open={confirmOpen}
        message={confirmMessage}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={() => { try { confirmAction && confirmAction() } catch (err) { console.error('confirm action failed', err) } finally { setConfirmOpen(false); setConfirmAction(null) } }}
      />
    </div>
  )
}

export default PriceSDP
