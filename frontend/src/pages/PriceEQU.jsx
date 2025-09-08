import { useState, useEffect, useCallback } from "react"
import Sidebar from "../components/Sidebar"
import {
  CloudDownload,
  Help,
  Add,
  Description,
  Edit,
  Delete,
} from "@mui/icons-material"
import { useDao } from "../contexts/DaoContext"
import api from "../services/api"

const INITIAL_EQU_FORM = {
  materielId: '',
  description: '',
  vr: '',
  dt_percent: '',
  dt_value: '',
  nj: '',
  amort_j: '',
  cc: '',
  cl: '',
  cpr: '',
  tlpr_percent: '',
  tlpr_value: '',
  cmo: '',
  cmoId: '',            // { changed code } added field to track selected personnel id
  tj: '',
  twm: '',
  total_h: '',
}

/* ----------------------------- Modal Component (Equipment) ----------------------------- */
const Modal = ({ open, onClose, onSave, initialData = null, personnels = [] }) => {
  const [form, setForm] = useState(INITIAL_EQU_FORM)
  const [errors, setErrors] = useState({})
  const [materiels, setMateriels] = useState([])
  // personnels & defaultPersonnels are provided via props from PriceEQU

  useEffect(() => {
    // load materiels for selection
    const load = async () => {
      try {
        const res = await api.get('/materiels/')
        const items = Array.isArray(res.data) ? res.data : []
        setMateriels(items)
      } catch (err) {
        console.warn('failed to load materiels', err)
      }
    }
    load()
  }, [])

  // Modal no longer fetches personnels itself; it uses the personnels prop passed by PriceEQU

  useEffect(() => {
    if (open && initialData) {
      setForm({
        materielId: initialData.materielId ?? '',
        description: initialData.description ?? initialData.designation ?? '',
        vr: initialData.vr ?? '',
        dt_percent: initialData.dt_percent ?? '',
        dt_value: initialData.dt_value ?? '',
        nj: initialData.nj ?? '',
        amort_j: initialData.amort_j ?? '',
        cc: initialData.cc ?? '',
        cl: initialData.cl ?? '',
        cpr: initialData.cpr ?? '',
        tlpr_percent: initialData.tlpr_percent ?? '',
        tlpr_value: initialData.tlpr_value ?? '',
        cmo: initialData.cmo ?? '',
        cmoId: initialData.cmoId ?? '', // { changed code } preserve selected personnel when editing
        tj: initialData.tj ?? '',
        twm: initialData.twm ?? '',
        total_h: initialData.total_h ?? '',
      })
      setErrors({})
      return
    }
    setForm(INITIAL_EQU_FORM)
    setErrors({})
  }, [open, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  // when materiel selected, prefill description
  useEffect(() => {
    if (!form.materielId || materiels.length === 0) return
    const m = materiels.find(x => String(x.id) === String(form.materielId))
    if (m) setForm(prev => ({ ...prev, description: m.designation || m.nom || m.design || prev.description }))
  }, [form.materielId, materiels])

  // when a CMO personnel is selected, set the cmo numeric value to that person's totalHourly
  useEffect(() => {
    if (!form.cmoId || personnels.length === 0) return
    const p = personnels.find(x => String(x.id) === String(form.cmoId))
    if (p) {
      setForm(prev => ({ ...prev, cmo: (p.totalHourly ?? 0).toString() }))
      setErrors(prev => ({ ...prev, cmo: '' }))
    }
  }, [form.cmoId, personnels])

  const computeDerived = (values) => {
    const vr = Number(values.vr || 0)
    const dtp = Number(values.dt_percent || 0)
    const dtv = Number(((vr * dtp) / 100).toFixed(2))
    const A = vr + dtv // VR + Taxes[T]
    const nj = Number(values.nj || 0) || 0
    const amort_j = nj > 0 ? Number((A / nj).toFixed(2)) : 0
    const cc = Number(values.cc || 0)
    const cl = Number(values.cl || 0)
    const cpr = Number(values.cpr || 0)
    const tlpr_p = Number(values.tlpr_percent || 0)
    const tlpr_v = Number((((cc + cl + cpr) * tlpr_p) / 100).toFixed(2))
    const cmo = Number(values.cmo || 0)
    const tj = Number((amort_j + cc + cl + cpr + tlpr_v + cmo).toFixed(2))
    const twm = Number(values.twm || 0) || 0
    const total_h = twm > 0 ? Number((tj / twm).toFixed(2)) : 0
    return { dtv, A, amort_j, tlpr_v, tj, total_h }
  }

  const validate = () => {
    // Required fields: materielId, description, vr, dt_percent, nj, twm
    const required = ['materielId', 'description', 'vr', 'dt_percent', 'nj', 'twm']
    const newErrors = {}

    required.forEach((field) => {
      const val = form[field]
      if (val === '' || val === null || val === undefined) {
        newErrors[field] = 'Champ requis'
        return
      }
      // numeric checks
      if (['vr', 'dt_percent', 'nj', 'twm'].includes(field)) {
        const num = Number(val)
        if (Number.isNaN(num)) {
          newErrors[field] = 'Doit être un nombre'
          return
        }
        if ((field === 'vr' || field === 'nj' || field === 'twm') && num <= 0) {
          newErrors[field] = 'Doit être supérieur à 0'
          return
        }
      }
    })

    // optional numeric fields: validate if provided
    const optionalNumeric = ['cc', 'cl', 'cpr', 'tlpr_percent', 'cmo']
    for (const field of optionalNumeric) {
      const val = form[field]
      if (val !== '' && val !== null && val !== undefined) {
        const num = Number(val)
        if (Number.isNaN(num)) newErrors[field] = 'Doit être un nombre'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const derived = computeDerived(form)
    const payload = {
      materielId: form.materielId || null,
      description: form.description || '',
      vr: Number(form.vr || 0),
      dt_percent: Number(form.dt_percent || 0),
      dt_value: derived.dtv,
      vr_plus_taxes: derived.A,
      nj: Number(form.nj || 0),
      amort_j: derived.amort_j,
      cc: Number(form.cc || 0),
      cl: Number(form.cl || 0),
      cpr: Number(form.cpr || 0),
      tlpr_percent: Number(form.tlpr_percent || 0),
      tlpr_value: derived.tlpr_v,
      cmo: Number(form.cmo || 0),
      tj: derived.tj,
      twm: Number(form.twm || 0),
      total_h: derived.total_h,
    }
    onSave(payload)
    setForm(INITIAL_EQU_FORM)
    onClose()
  }

  if (!open) return null

  const isFormValid = (
    form.materielId !== '' &&
    form.description !== '' &&
    form.vr !== '' && Number(form.vr) > 0 &&
    form.dt_percent !== '' &&
    form.nj !== '' && Number(form.nj) > 0 &&
    form.twm !== '' && Number(form.twm) > 0
  )

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[440px]">
        <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter un équipement</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Equipement <span className="text-red-500">*</span></label>
            <select name="materielId" value={form.materielId} onChange={handleChange} className="w-full border rounded px-2 py-1">
              <option value="">-- Sélectionner un équipement --</option>
              {materiels.map(m => (<option key={m.id} value={m.id}>{m.designation || m.nom || m.nombre || (`#${m.id}`)}</option>))}
            </select>
            {errors.materielId && <p className="text-xs text-red-600 mt-1">{errors.materielId}</p>}
          </div>

          <div className="grid gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Valeur de Remplacement (VR) <span className="text-red-500">*</span></label>
              <input name="vr" value={form.vr} onChange={handleChange} type="number" placeholder="Valeur de Remplacement (VR)" className="w-full border rounded px-2 py-1" />
              {errors.vr && <p className="text-xs text-red-600 mt-1">{errors.vr}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Droits & Taxes (%) <span className="text-red-500">*</span></label>
              <input name="dt_percent" value={form.dt_percent} onChange={handleChange} placeholder="Valeur du pourcentage (ex: 20)" type="number" className="w-full border rounded px-2 py-1" />
              {errors.dt_percent && <p className="text-xs text-red-600 mt-1">{errors.dt_percent}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de jours <span className="text-red-500">*</span></label>
              <input name="nj" value={form.nj} onChange={handleChange} placeholder="Durée de vie utile" type="number" className="w-full border rounded px-2 py-1" />
              {errors.nj && <p className="text-xs text-red-600 mt-1">{errors.nj}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Carburant</label>
              <input name="cc" value={form.cc} onChange={handleChange} type="number" placeholder="Coût Carburant/jour" className="w-full border rounded px-2 py-1" />
              {errors.cc && <p className="text-xs text-red-600 mt-1">{errors.cc}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lubrifiant (Lub)</label>
              <input name="cl" value={form.cl} onChange={handleChange} type="number" placeholder="Coût Lubrifiant/Jour" className="w-full border rounded px-2 py-1" />
              {errors.cl && <p className="text-xs text-red-600 mt-1">{errors.cl}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pièces Rechange (PR)</label>
              <input name="cpr" value={form.cpr} onChange={handleChange} type="number" placeholder="Coût des pièces de rechange/jour" className="w-full border rounded px-2 py-1" />
              {errors.cpr && <p className="text-xs text-red-600 mt-1">{errors.cpr}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">% Taxes Lub & PR</label>
              <input name="tlpr_percent" value={form.tlpr_percent} onChange={handleChange} type="number" placeholder="Valeur du pourcentage (ex: 20)" className="w-full border rounded px-2 py-1" />
              {errors.tlpr_percent && <p className="text-xs text-red-600 mt-1">{errors.tlpr_percent}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Main d'oeuvre</label>
              <select name="cmoId" value={form.cmoId} onChange={handleChange} className="w-full border rounded px-2 py-1">
                <option value="">-- Sélectionner une main d'oeuvre (CMO) --</option>
                {personnels.map(p => {
                  // display only the function (fonction). fallback to poste or id if missing or empty
                  const display = (p.fonction && String(p.fonction).trim()) || (p.poste && String(p.poste).trim()) || `#${p.id}`
                  return (<option key={p.id} value={p.id}>{display}</option>)
                })}
              </select>
              {/* show numeric cmo value for clarity (readonly) */}
              <input readOnly name="cmo" value={form.cmo} type="number" placeholder="Coût main d'oeuvre/jour (total horaire)" className="w-full border rounded px-2 py-1 mt-2 bg-gray-50" />
              {errors.cmo && <p className="text-xs text-red-600 mt-1">{errors.cmo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Temps travail <span className="text-red-500">*</span></label>
              <input name="twm" value={form.twm} onChange={handleChange} type="number" placeholder="Temps de Travail Journalier Moyen" className="w-full border rounded px-2 py-1" />
              {errors.twm && <p className="text-xs text-red-600 mt-1">{errors.twm}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
          <button onClick={handleSubmit} disabled={!isFormValid} className={`px-4 py-2 ${isFormValid ? 'bg-secondary text-white hover:bg-secondary/90' : 'bg-gray-300 text-gray-600 cursor-not-allowed'} rounded`}>Enregistrer</button>
        </div>
      </div>
    </div>
  )
}

// format numbers with thousand separators (French locale)
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(String(value).replace(/,/g, '.'))
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/* ----------------------------- Equipment Table Component ----------------------------- */
const EquipmentTable = ({ rows, onEdit, onDelete }) => {
  const columns = [
    { key: 'description', label: 'Description' },
    { key: 'vr', label: 'Valeur de Remplacement' },
    { key: 'dt_value', label: 'Droit et Taxes (valeur)' },
    { key: 'vr_plus_taxes', label: 'VR+Taxes' },
    { key: 'nj', label: 'Nombre Jours' },
    { key: 'amort_j', label: 'Amortissement/Jour' },
    { key: 'cc', label: 'Coût Carburant/Jour' },
    { key: 'cl', label: 'Coût Lubrifiant/Jour' },
    { key: 'cpr', label: 'Coût Pièce de Rechange/Jour' },
    { key: 'tlpr_value', label: 'Taxe sur Lub & PR/Jour' },
    { key: 'cmo', label: 'Coût Main d\'oeuvre/Jour' },
    { key: 'tj', label: 'Total/Jour' },
    { key: 'twm', label: 'Temps de Travail Journalier Moyen' },
    { key: 'total_h', label: 'Total/Heure' },
  ]
  const numericKeys = columns.map(c => c.key)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-secondary border-collapse text-sm">
        <thead className="bg-gray-100 dark:bg-primary/40">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="text-primary dark:text-muted border border-secondary px-2 py-2 text-left">{col.label}</th>
            ))}
            <th className="text-primary dark:text-muted border border-secondary px-3 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.key} className="text-accent dark:text-muted border border-secondary px-2 py-2">{(row[col.key] !== undefined && row[col.key] !== null) ? (numericKeys.includes(col.key) ? formatNumber(row[col.key], 2) : String(row[col.key])) : '-'}</td>
              ))}
              <td className="text-center border border-secondary px-3 py-2">
                <button onClick={() => onEdit(row, idx)} className="text-green-600 hover:text-green-800 mr-2"><Edit fontSize="small" /></button>
                <button onClick={() => onDelete(idx)} className="text-red-600 hover:text-red-800"><Delete fontSize="small" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ----------------------------- Confirm Modal Component ----------------------------- */
const ConfirmModal = ({ open, message = 'Confirmer ?', onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[360px]">
        <h3 className="text-lg font-medium mb-3">Confirmation</h3>
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Supprimer</button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Main Component ----------------------------- */
const PriceEQU = () => {
  const [openModal, setOpenModal] = useState(false)
  const [rows, setRows] = useState([])
  const [rowsByLot, setRowsByLot] = useState({}) // in-memory map: { [lotName]: rows[] }
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingInitial, setEditingInitial] = useState(null)
  const [daos, setDaos] = useState([])
  const { savedLots, daoDocId, setSavedLots, setDaoId, setDaoDocId } = useDao()
  const [lot, setLot] = useState("")
  // personnels used for the Modal CMO select. defaultPersonnels is the API fallback.
  const [personnels, setPersonnels] = useState([])
  const [defaultPersonnels, setDefaultPersonnels] = useState([])

  // load default personnels from /personnels/ once
  useEffect(() => {
    const loadP = async () => {
      try {
        const res = await api.get('/personnels/')
        const list = Array.isArray(res.data) ? res.data.map(p => {
          const salaireMensuel = p.salaire_mensuel ?? p.salaire ?? p.salaireMensuel ?? 0
          const horaireMensuel = p.horaire_mensuel ?? p.horaireMensuel ?? 0
          const salaireHoraire = (horaireMensuel && horaireMensuel > 0) ? Number((salaireMensuel / horaireMensuel).toFixed(2)) : (p.salaire_horaire ?? p.salaireHoraire ?? 0)
          return {
            id: p.id,
            nom: p.nom,
            prenom: p.prenom,
            fonction: p.fonction,
            salaireMensuel,
            horaireMensuel,
            salaireHoraire,
            totalHourly: salaireHoraire,
            source: 'api'
          }
        }) : []
        setPersonnels(list)
        setDefaultPersonnels(list)
      } catch (err) {
        console.warn('[PriceEQU] failed to load personnels', err)
      }
    }
    loadP()
  }, [])

  // Extract personnel-like entries from the selected lot (other price sections) to be used as CMO options
  const fetchPersonnelsForLot = useCallback(async (lotId) => {
    if (!daoDocId || !lotId) return []
    try {
      const res = await api.get(`/dao/${daoDocId}`)
      const lots = Array.isArray(res.data?.lots) ? res.data.lots : []
      const lotObj = lots.find(l => Number(l.id) === Number(lotId) || Number(l.lot_id) === Number(lotId))
      if (!lotObj) return []

      const candidateKeys = ['priceMO', 'price_mo', 'mo', 'priceMTX', 'price_mtx', 'mtx', 'priceSDP', 'price_sdp', 'sdp', 'priceBDE', 'price_bde', 'bde', 'workforce', 'personnels', 'priceMO_rows']
      const rows = []
      for (const k of candidateKeys) {
        if (Array.isArray(lotObj[k])) rows.push(...lotObj[k])
      }
      for (const key of Object.keys(lotObj)) {
        const val = lotObj[key]
        if (val && typeof val === 'object' && Array.isArray(val.rows)) rows.push(...val.rows)
      }

      const map = new Map()
      for (const r of rows) {
        const id = r.cmo_personnel_id ?? r.personnel_id ?? r.id ?? null
        let totalHourly = null
        if (r.total_h !== undefined) totalHourly = Number(r.total_h)
        else if (r.total !== undefined) totalHourly = Number(r.total)
        else if (r.tj !== undefined && r.twm !== undefined) {
          const twm = Number(r.twm || 0)
          const tj = Number(r.tj || 0)
          totalHourly = twm > 0 ? Number((tj / twm).toFixed(2)) : null
        } else if (r.cmo !== undefined) totalHourly = Number(r.cmo)

        const nom = r.nom ?? r.name ?? r.personnel_name ?? r.designation ?? r.description ?? ''
        const prenom = r.prenom ?? ''
        if (id === null && !nom && (totalHourly === null || Number.isNaN(totalHourly))) continue
        const key = id ?? `${nom}_${prenom}_${(totalHourly || 0)}`
        if (!map.has(key)) {
          map.set(key, {
            id: id ?? key,
            // keep raw name parts; prefer to use fonction/poste at render time
            nom: nom || '',
            prenom,
            fonction: r.fonction ?? '',
            poste: r.poste ?? r.poste_name ?? r.poste_nom ?? r.poste_designation ?? r.poste_label ?? '',
            totalHourly: (Number.isFinite(totalHourly) ? totalHourly : 0),
            source: 'lot'
          })
        }
      }

      return Array.from(map.values())
    } catch (err) {
      console.warn('[PriceEQU] failed to extract personnels from lot', lotId, err)
      return []
    }
  }, [daoDocId])

  /* ---------- API Calls ---------- */
  const fetchDaos = useCallback(async () => {
    try {
      const res = await api.get("/dao/")
      setDaos(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("[PriceMO] failed to load DAOs", err)
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
      console.error("[PriceMO] failed to fetch lots", err)
      setSavedLots([])
      setDaoId(null)
    }
  }, [daoDocId, setDaoId, setSavedLots])

  useEffect(() => { fetchDaoLots() }, [fetchDaoLots])

  // Fetch persisted rows for a lot from backend (EQUIPMENTS)
  const fetchRowsForLot = useCallback(async (lotId) => {
    if (!daoDocId || !lotId) return []
    try {
      // backend exposes the lot + nested arrays at GET /dao/:document_id
      const res = await api.get(`/dao/${daoDocId}`)
      const lots = Array.isArray(res.data?.lots) ? res.data.lots : []
      const lotObj = lots.find(l => Number(l.id) === Number(lotId) || Number(l.lot_id) === Number(lotId))
      const data = Array.isArray(lotObj?.priceEQU) ? lotObj.priceEQU : (Array.isArray(lotObj?.price_equ) ? lotObj.price_equ : (Array.isArray(lotObj?.equipements) ? lotObj.equipements : []))

      return data.map((m) => {
        // Support multiple possible field names that may come from different sources
        const vr = Number(m.vr ?? m.vr_value ?? m.valeur_remplacement ?? m.prix_unitaire ?? 0)
        const dt_percent = Number(m.dt_percent ?? m.dt ?? m.droits ?? 0)
        let dt_value = 0
        if (m.dt_value !== undefined && m.dt_value !== null) {
          dt_value = Number(m.dt_value)
        } else {
          dt_value = Number(((vr * dt_percent) / 100) || 0)
        }
        const vr_plus_taxes = Number((vr + dt_value).toFixed(2))
        const nj = Number(m.nj ?? m.nb_jours ?? m.quantite ?? 0)
        const amort_j = nj > 0 ? Number((vr_plus_taxes / nj).toFixed(2)) : 0
        const cc = Number(m.cc ?? 0)
        const cl = Number(m.cl ?? 0)
        const cpr = Number(m.cpr ?? 0)
        const tlpr_percent = Number(m.tlpr_percent ?? 0)
        const tlpr_value = Number((((cc + cl + cpr) * tlpr_percent) / 100).toFixed(2))
        const cmo = Number(m.cmo ?? 0)
        const cmoId = m.cmo_personnel_id ?? m.cmoId ?? m.cmo_id ?? null // { changed code } try to read persisted personnel id
        const tj = Number((amort_j + cc + cl + cpr + tlpr_value + cmo).toFixed(2))
        const twm = Number(m.twm ?? 0) || 0
        const total_h = twm > 0 ? Number((tj / twm).toFixed(2)) : 0

        return {
          materielId: m.materiel_id ?? m.materielId ?? m.id ?? null,
          description: m.description ?? m.designation ?? m.name ?? '',
          vr: vr ? vr.toFixed(2) : '0.00',
          dt_percent: dt_percent ? dt_percent.toFixed(2) : '0.00',
          dt_value: dt_value ? dt_value.toFixed(2) : '0.00',
          vr_plus_taxes: vr_plus_taxes ? vr_plus_taxes.toFixed(2) : '0.00',
          nj: nj ? String(nj) : '0',
          amort_j: amort_j ? amort_j.toFixed(2) : '0.00',
          cc: cc ? cc.toFixed(2) : '0.00',
          cl: cl ? cl.toFixed(2) : '0.00',
          cpr: cpr ? cpr.toFixed(2) : '0.00',
          tlpr_percent: tlpr_percent ? tlpr_percent.toFixed(2) : '0.00',
          tlpr_value: tlpr_value ? tlpr_value.toFixed(2) : '0.00',
          cmo: cmo ? cmo.toFixed(2) : '0.00',
          cmoId: cmoId ?? '', // { changed code } attach cmo personnel id to row for editing
          tj: tj ? tj.toFixed(2) : '0.00',
          twm: twm ? twm.toFixed(2) : '0.00',
          total_h: total_h ? total_h.toFixed(2) : '0.00',
        }
      })
    } catch (err) {
      console.warn('[PriceEQU] failed to fetch equipment rows for lot', lotId, err)
      return []
    }
  }, [daoDocId])

  // Save rows for a lot to backend (PUT) - equipments
  const saveRowsForLot = useCallback(async (lotId, rowsToSave) => {
    if (!daoDocId || !lotId) return
    try {
      const payload = Array.isArray(rowsToSave) ? rowsToSave.map(r => ({
        // Primary persisted fields expected by the backend
        designation: r.description ?? '',
        materiel_id: r.materielId ?? null,
        quantite: r.nj ? Number(String(r.nj).replace(/,/g, '.')) : 0,
        prix_unitaire: r.vr ? Number(String(r.vr).replace(/,/g, '.')) : 0,
        total: r.tj ? Number(String(r.tj).replace(/,/g, '.')) : 0,
        // Keep other computed fields in the payload (backend currently ignores them but may be extended later)
        vr: r.vr ? Number(String(r.vr).replace(/,/g, '.')) : 0,
        dt_percent: r.dt_percent ? Number(String(r.dt_percent).replace(/,/g, '.')) : 0,
        dt_value: r.dt_value ? Number(String(r.dt_value).replace(/,/g, '.')) : 0,
        vr_plus_taxes: r.vr_plus_taxes ? Number(String(r.vr_plus_taxes).replace(/,/g, '.')) : 0,
        nj: r.nj ? Number(String(r.nj).replace(/,/g, '.')) : 0,
        amort_j: r.amort_j ? Number(String(r.amort_j).replace(/,/g, '.')) : 0,
        cc: r.cc ? Number(String(r.cc).replace(/,/g, '.')) : 0,
        cl: r.cl ? Number(String(r.cl).replace(/,/g, '.')) : 0,
        cpr: r.cpr ? Number(String(r.cpr).replace(/,/g, '.')) : 0,
        tlpr_percent: r.tlpr_percent ? Number(String(r.tlpr_percent).replace(/,/g, '.')) : 0,
        tlpr_value: r.tlpr_value ? Number(String(r.tlpr_value).replace(/,/g, '.')) : 0,
        cmo: r.cmo ? Number(String(r.cmo).replace(/,/g, '.')) : 0,
        cmo_personnel_id: r.cmoId ?? null, // { changed code } persist selected personnel id when available
        tj: r.tj ? Number(String(r.tj).replace(/,/g, '.')) : 0,
        twm: r.twm ? Number(String(r.twm).replace(/,/g, '.')) : 0,
        total_h: r.total_h ? Number(String(r.total_h).replace(/,/g, '.')) : 0,
      })) : []

      await api.put(`/dao/${daoDocId}/lots/${lotId}/equipments`, payload)
      console.log('[PriceEQU] saved equipment rows for lot', lotId)
    } catch (err) {
      console.warn('[PriceEQU] failed to save equipment rows for lot', lotId, err)
    }
  }, [daoDocId])

  // Export current lot rows as Excel (.xlsx) - Equipment
  const exportCurrentLotExcel = async () => {
    if (!lot) {
      alert('Aucun lot sélectionné pour l\'export')
      return
    }
    try {
      const XLSX = await import('xlsx')
      const currentRows = rows || []
      const headers = ['Description', 'Valeur de Remplacement (VR)', 'Droit et Taxes', 'VR + Taxes', 'Nombre de Jour de Durée de Vie Utile', 'Amortissement/Jour', 'Coût Carburant/Jour', 'Coût Lubrifiant/Jour', 'Coût Pièce de Rechange (PR)/Jour', 'Taxe sur Lub et PR', 'Cout Main d\'Oeuvre/Jour', 'Total/Jour', 'Temps de Travail Journalier Moyen', 'Total/Heure']
      const lotObj = (savedLots || []).find(s => String(s.id) === String(lot))
      const lotName = lotObj ? (lotObj.name || `lot-${lot}`) : `lot-${lot}`
      const title = 'Ventilation des coûts d\'équipement'
      const wsData = [[title], [], headers, ...currentRows.map(r => [r.description ?? '', r.vr ?? '', r.dt_value ?? '', r.vr_plus_taxes ?? '', r.nj ?? '', r.amort_j ?? '', r.cc ?? '', r.cl ?? '', r.cpr ?? '', r.tlpr_value ?? '', r.cmo ?? '', r.tj ?? '', r.twm ?? '', r.total_h ?? ''])]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Equipements')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const filename = `dao-${daoDocId || 'unknown'}_${lotName.replace(/[^a-z0-9\-_]/gi, '_')}.xlsx`
      a.href = url
      a.setAttribute('download', filename)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[PriceEQU] Excel export failed', err)
      alert('L\'export Excel nécessite la librairie "xlsx". Veuillez installer la dépendance (xlsx) et recharger l\'application.')
    }
  }

  /* ---------- Table actions & calculations (Equipment) ---------- */
  const addRow = (data) => {
    setRows((prev) => {
      const next = [...prev, data]
      if (lot) {
        setRowsByLot(prevMap => ({ ...prevMap, [lot]: next }))
        saveRowsForLot(lot, next)
      }
      return next
    })
  }

  const updateRow = (idx, data) => {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === idx ? data : r))
      if (lot) { setRowsByLot(prevMap => ({ ...prevMap, [lot]: next })); saveRowsForLot(lot, next) }
      return next
    })
  }

  const deleteRow = (idx) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (lot) { setRowsByLot(prevMap => ({ ...prevMap, [lot]: next })); saveRowsForLot(lot, next) }
      return next
    })
  }

  // deletion workflow using in-app confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState(null)

  const requestDeleteRow = (idx) => {
    setPendingDeleteIdx(idx)
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (pendingDeleteIdx != null) {
      deleteRow(pendingDeleteIdx)
    }
    setConfirmOpen(false)
    setPendingDeleteIdx(null)
  }

  const cancelDelete = () => {
    setConfirmOpen(false)
    setPendingDeleteIdx(null)
  }

  const editRow = (row, idx) => {
    const initial = { ...row }
    setEditingIndex(idx)
    setEditingInitial(initial)
    setOpenModal(true)
  }

  const handleSave = (payload) => {
    if (editingIndex !== null && editingIndex !== undefined) {
      updateRow(editingIndex, payload)
      setEditingIndex(null)
      setEditingInitial(null)
    } else {
      addRow(payload)
    }
  }

  return (
    <div className="flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out">
      <Sidebar />
      <main className="flex-1 p-4 lg:ml-64 ml-16">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">Ventilation des prix de base pour les équipements (Convertis par Heure)</h5>
        </header>

        {/* Main card */}
        <div className="bg-muted dark:bg-accent rounded-lg shadow-md p-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          {/* DAO & Lot Selectors */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-3 flex-1 bg-white/60 dark:bg-primary/30 border border-muted-50 rounded-md px-3 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/10 text-secondary"><Description fontSize="small" /></span>
              <label className="text-secondary font-medium whitespace-nowrap">DAO :</label>
              <select className="text-primary dark:text-muted ml-auto border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-64" value={daoDocId || ""} onChange={(e) => {
                const val = e.target.value
                if (!val) {
                  setDaoDocId(null)
                  setDaoId(null)
                  setSavedLots([])
                  return
                }
                setDaoDocId(Number(val))
              }}>
                <option value="">Sélectionner un DAO</option>
                {daos.map((d, i) => {
                  const display = d.original_name || d.original_filename || (d.filename ? d.filename.split('/').pop() : null) || `DAO ${d.document_id}`
                  return (<option key={i} value={d.document_id}>{display}</option>)
                })}
              </select>

              {daoDocId ? (
                <>
                  <label className="text-secondary font-medium whitespace-nowrap ml-3">Lot :</label>
                  <select
                    className="border border-gray-300 dark:border-muted-50 text-primary dark:text-muted bg-white dark:bg-primary text-sm rounded px-3 py-2 w-40"
                    value={lot}
                    onChange={async (e) => {
                      const val = e.target.value
                      // save current rows for previous lot in-memory before switching
                      if (lot) {
                        // persist previous lot (do not await UI-blocking, but handle)
                        saveRowsForLot(lot, rows).catch(() => { })
                        setRowsByLot(prev => ({ ...prev, [lot]: rows }))
                      }

                      if (!val) {
                        setLot("")
                        setRows([])
                        return
                      }

                      const lotId = Number(val)
                      setLot(lotId)

                      // load rows for selected lot: prefer in-memory cache, else fetch
                      const cached = rowsByLot[lotId]
                      if (Array.isArray(cached) && cached.length > 0) {
                        setRows(cached)
                      } else {
                        const fetched = await fetchRowsForLot(lotId)
                        setRows(Array.isArray(fetched) ? fetched : [])
                        setRowsByLot(prev => ({ ...prev, [lotId]: Array.isArray(fetched) ? fetched : [] }))
                      }

                      // Prefer lot-derived personnels for CMO select, fallback to defaultPersonnels
                      if (val) {
                        const personnelsFromLot = await fetchPersonnelsForLot(Number(val))
                        if (Array.isArray(personnelsFromLot) && personnelsFromLot.length > 0) {
                          setPersonnels(personnelsFromLot)
                        } else {
                          setPersonnels(defaultPersonnels)
                        }
                      } else {
                        setPersonnels(defaultPersonnels)
                      }
                    }}
                  >
                    <option value="">Sélectionner un Lot</option>
                    {(savedLots || []).map((s, i) => (<option key={i} value={s.id}>{s.name}</option>))}
                  </select>
                </>
              ) : (
                <div className="ml-3 text-sm text-gray-500">Aucun DAO sélectionné.</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (lot) exportCurrentLotExcel() }}
                title={lot ? "Exporter en Excel (.xlsx)" : "Sélectionnez un lot pour pouvoir exporter"}
                disabled={!lot}
                className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md ${lot ? 'bg-secondary hover:bg-secondary/90 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'}`}
                aria-disabled={!lot}
              >
                <CloudDownload fontSize="small" />Exporter
              </button>
            </div>
          </div>

          {/* Action + Table */}
          {lot ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setOpenModal(true)} className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md"><Add fontSize="small" />Ajouter un équipement</button>
              </div>

              <EquipmentTable rows={rows} onDelete={requestDeleteRow} onEdit={editRow} />
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500">Sélectionner un Lot.</div>
          )}
        </div>

        {/* Modal - only available when a lot is selected */}
        {lot && (
          <>
            <Modal open={openModal} onClose={() => { setOpenModal(false); setEditingIndex(null); setEditingInitial(null); }} onSave={handleSave} initialData={editingInitial} personnels={personnels} defaultPersonnels={defaultPersonnels} />
            <ConfirmModal open={confirmOpen} message={"Supprimer cette ligne ?"} onConfirm={confirmDelete} onCancel={cancelDelete} />
          </>
        )}
      </main>
    </div>
  )
}

export default PriceEQU