import { useState, useEffect, useCallback, useRef } from "react"
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

// Initial form template
const INITIAL_FORM = {
  personnelId: "",
  poste: "",
  salaireMensuel: "",
  valeurHoraireMensuel: "",
  heuresSup: "",
  charges: "",
  temps: "",
}

/* ----------------------------- Modal Component ----------------------------- */
const Modal = ({ open, onClose, onSave, personnels = [], initialData = null }) => {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})

  // initialize form from initialData when editing, otherwise reset
  useEffect(() => {
    if (open && initialData) {
      setForm({
        personnelId: initialData.personnelId ?? "",
        poste: initialData.poste ?? "",
        salaireMensuel: initialData.salaireMensuel ?? "",
        valeurHoraireMensuel: initialData.valeurHoraireMensuel ?? (initialData._hm ?? ""),
        heuresSup: initialData.heuresSup ?? "",
        charges: initialData.charges ?? "",
        temps: initialData.temps ?? "",
      })
      setErrors({})
      return
    }
    setForm(INITIAL_FORM)
    setErrors({})
  }, [open, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  // When a personnel is selected, autofill poste and salaireMensuel
  useEffect(() => {
    if (!form.personnelId) return
    const p = personnels.find((x) => String(x.id) === String(form.personnelId))
    if (p) {
      setForm((prev) => ({
        ...prev,
        poste: ((p.nom || p.prenom) ? `${p.nom || ''} ${p.prenom || ''}`.trim() : '') || p.fonction || prev.poste,
        salaireMensuel: p.salaire ?? p.salaire_mensuel ?? prev.salaireMensuel,
      }))
    }
  }, [form.personnelId, personnels])

  const validate = () => {
    // Required fields: personnel selection, poste (from personnel) and HM
    const required = ['personnelId', 'poste', 'valeurHoraireMensuel']
    const newErrors = {}

    required.forEach((field) => {
      const val = form[field]
      if (val === '' || val === null || val === undefined) {
        newErrors[field] = 'Champ requis'
        return
      }

      // HM must be numeric and > 0
      if (field === 'valeurHoraireMensuel') {
        const num = Number(val)
        if (Number.isNaN(num)) {
          newErrors[field] = 'Doit être un nombre'
          return
        }
        if (num <= 0) {
          newErrors[field] = 'Doit être supérieur à 0'
          return
        }
      }
    })

    // Optional numeric fields: validate only if provided
    const optionalNumeric = ['heuresSup', 'charges', 'temps']
    for (const field of optionalNumeric) {
      const val = form[field]
      if (val !== '' && val !== null && val !== undefined) {
        const num = Number(val)
        if (Number.isNaN(num)) {
          newErrors[field] = 'Doit être un nombre'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    // Basic normalization of numeric values
    const payload = {
      personnelId: form.personnelId || null,
      poste: form.poste || "",
      salaireMensuel: form.salaireMensuel ? Number(form.salaireMensuel) : 0,
      valeurHoraireMensuel: form.valeurHoraireMensuel ? Number(form.valeurHoraireMensuel) : 0,
      heuresSup: form.heuresSup ? Number(form.heuresSup) : 0,
      charges: form.charges ? Number(form.charges) : 0,
      temps: form.temps ? Number(form.temps) : 0,
    }
    onSave(payload)
    onClose()
  }

  if (!open) return null

  const isFormValid = (
    form.personnelId !== '' &&
    form.poste !== '' &&
    form.valeurHoraireMensuel !== '' && Number(form.valeurHoraireMensuel) > 0
  )

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[440px]">
        <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter une main d'œuvre</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Poste</label>
            <select
              name="personnelId"
              value={form.personnelId}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Choisir un poste / personnel --</option>
              {personnels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.prenom}{p.fonction ? ` — ${p.fonction}` : ''}
                </option>
              ))}
            </select>
            {errors.personnelId && <p className="text-xs text-red-600 mt-1">{errors.personnelId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Horaire Mensuel</label>
            <input name="valeurHoraireMensuel" value={form.valeurHoraireMensuel} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" placeholder="Valeur Horaire Mensuel" required />
            {errors.valeurHoraireMensuel && <p className="text-xs text-red-600 mt-1">{errors.valeurHoraireMensuel}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Heure Supplémentaire</label>
            <input name="heuresSup" value={form.heuresSup} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" placeholder="Valeur de l'Heure supplémentaire" />
            {errors.heuresSup && <p className="text-xs text-red-600 mt-1">{errors.heuresSup}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Charges Sociales</label>
            <input name="charges" value={form.charges} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" placeholder="Charges Sociales" />
            {errors.charges && <p className="text-xs text-red-600 mt-1">{errors.charges}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Temps de Déplacement</label>
            <input name="temps" value={form.temps} onChange={handleChange} type="number" className="w-full border rounded px-2 py-1" placeholder="Temps de déplacement en heure" />
            {errors.temps && <p className="text-xs text-red-600 mt-1">{errors.temps}</p>}
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

/* ----------------------------- Help Guide Modal ----------------------------- */
const HelpGuideModal = ({ open, onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Guide Utilisateur – Gestion de la Main d'Œuvre</h2>

        <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">

          <section>
            <h3 className="text-lg font-semibold mb-2">1. Introduction</h3>
            <p>
              Cette page permet de gérer la main d’œuvre pour chaque DAO et Lot, en calculant automatiquement le salaire horaire, les heures supplémentaires, les charges sociales et le temps de déplacement.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. Sélection du DAO et du Lot</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sélectionnez un DAO dans le menu déroulant.</li>
              <li>Ensuite, choisissez un Lot correspondant au DAO sélectionné.</li>
              <li>Les lignes existantes pour le lot sélectionné s’affichent dans le tableau.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. Ajouter une main d’œuvre</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cliquez sur <strong>Ajouter une main d’œuvre</strong>.</li>
              <li>Remplissez le formulaire :</li>
              <ul className="list-circle pl-5 space-y-1">
                <li><strong>Poste :</strong> Sélectionnez le personnel ou entrez manuellement.</li>
                <li><strong>Horaire Mensuel :</strong> Valeur obligatoire pour calcul du salaire horaire.</li>
                <li><strong>Heures Supplémentaires :</strong> Optionnel.</li>
                <li><strong>Charges Sociales :</strong> Optionnel.</li>
                <li><strong>Temps de Déplacement :</strong> Optionnel.</li>
              </ul>
              <li>Cliquez sur <strong>Enregistrer</strong> pour ajouter la ligne au tableau.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">4. Modifier une ligne</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cliquez sur l’icône <strong>Modifier</strong> dans la colonne Action.</li>
              <li>Modifiez les valeurs dans le formulaire.</li>
              <li>Cliquez sur <strong>Enregistrer</strong> pour appliquer les modifications.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">5. Supprimer une ligne</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cliquez sur l’icône <strong>Supprimer</strong>.</li>
              <li>Confirmez la suppression dans la fenêtre de confirmation.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">6. Calculs automatiques</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Salaire Horaire :</strong> calculé automatiquement : Salaire Mensuel ÷ Horaire Mensuel.</li>
              <li><strong>Total Horaire :</strong> somme du salaire horaire + heures sup + charges + temps de déplacement.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">7. Export Excel</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sélectionnez un Lot.</li>
              <li>Cliquez sur <strong>Exporter</strong> pour générer un fichier Excel (.xlsx) contenant toutes les lignes du lot.</li>
              <li>Le fichier inclut : Poste, Salaire Mensuel, Salaire Horaire, Heures Supplémentaires, Charges Sociales, Temps de Déplacement, Total Horaire.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">8. Bonnes pratiques</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sélectionnez toujours le DAO et le Lot avant d’ajouter ou modifier des lignes.</li>
              <li>Vérifiez les champs numériques avant d’enregistrer.</li>
              <li>Les modifications sont automatiquement enregistrées pour le lot sélectionné.</li>
            </ul>
          </section>

        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Table Component ----------------------------- */
const WorkforceTable = ({ rows, onEdit, onDelete }) => {
  const columns = [
    { key: "poste", label: "Poste" },
    { key: "salaireMensuel", label: "Salaire Mensuel" },
    { key: "salaireHoraire", label: "Salaire Horaire" },
    { key: "heuresSup", label: "Heures Supplémentaires" },
    { key: "charges", label: "Charges Sociales" },
    { key: "temps", label: "Temps de Déplacement" },
    { key: "total", label: "Total Horaire" },
  ]

  const numericKeys = ['salaireMensuel', 'salaireHoraire', 'heuresSup', 'charges', 'temps', 'total']

  // format numbers with thousand separators (French locale)
  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '') return '-'
    const n = Number(String(value).replace(/,/g, '.'))
    if (!Number.isFinite(n)) return String(value)
    return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-secondary border-collapse">
        <thead className="bg-gray-100 dark:bg-primary/40">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="text-primary dark:text-muted border border-secondary px-3 py-2 text-left">{col.label}</th>
            ))}
            <th className="text-primary dark:text-muted border border-secondary px-3 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => {
                const val = row[col.key]
                return (
                  <td key={col.key} className="text-accent dark:text-muted border border-secondary px-3 py-2">{
                    numericKeys.includes(col.key) ? (val !== undefined && val !== null && val !== '' ? formatNumber(val, 2) : '-') : (val ?? '-')
                  }</td>
                )
              })}
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
const PriceMO = () => {
  const [openModal, setOpenModal] = useState(false)
  const [rows, setRows] = useState([])
  const [rowsByLot, setRowsByLot] = useState({}) // in-memory map: { [lotName]: rows[] }
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingInitial, setEditingInitial] = useState(null)
  const [daos, setDaos] = useState([])
  const [personnels, setPersonnels] = useState([])
  const { savedLots, daoDocId, setSavedLots, setDaoId, setDaoDocId } = useDao()
  const [lot, setLot] = useState("")
  const [helpOpen, setHelpOpen] = useState(false)

  // Dropdown refs & state for button-based selectors
  const daoBtnRef = useRef(null)
  const lotBtnRef = useRef(null)
  const [daoMenuOpen, setDaoMenuOpen] = useState(false)
  const [lotMenuOpen, setLotMenuOpen] = useState(false)

  // Close menus on outside click or Escape
  useEffect(() => {
    const onDocClick = (e) => {
      if (daoMenuOpen && daoBtnRef.current && !daoBtnRef.current.contains(e.target)) setDaoMenuOpen(false)
      if (lotMenuOpen && lotBtnRef.current && !lotBtnRef.current.contains(e.target)) setLotMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDaoMenuOpen(false)
        setLotMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [daoMenuOpen, lotMenuOpen])

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

  // load personnels for selection
  const fetchPersonnels = useCallback(async () => {
    try {
      const res = await api.get('/personnels/')
      // backend returns list of personnels; ensure mapping to expected fields
      const list = Array.isArray(res.data) ? res.data.map(p => ({
        id: p.id,
        nom: p.nom,
        prenom: p.prenom,
        fonction: p.fonction,
        salaire: p.salaire_mensuel ?? p.salaire ?? p.salaireMensuel ?? 0,
      })) : []
      setPersonnels(list)
    } catch (err) {
      console.error('[PriceMO] failed to load personnels', err)
    }
  }, [])

  useEffect(() => { fetchPersonnels() }, [fetchPersonnels])

  // Fetch persisted rows for a lot from backend
  const fetchRowsForLot = useCallback(async (lotId) => {
    if (!daoDocId || !lotId) return []
    try {
      const res = await api.get(`/dao/${daoDocId}/lots/${lotId}/workforce`)
      const data = Array.isArray(res.data) ? res.data : []
      // Map backend DAO shape to frontend table row shape
      return data.map((m) => {
        const HM = m.horaire_mensuel ? Number(m.horaire_mensuel) : 0
        const SH = m.salaire_horaire ? Number(m.salaire_horaire) : 0
        const HS = m.heuresSup ?? m.heures_sup ?? 0
        const CS = m.charges ? Number(m.charges) : 0
        const TD = m.temps ? Number(m.temps) : 0

        // determine personnel id (backend may use different keys)
        const personnelId = m.personnelId ?? m.personnel_id ?? null
        const p = personnelId ? personnels.find(pp => String(pp.id) === String(personnelId)) : null

        // Prefer persisted salaire_mensuel from backend; if missing, prefer personnel.salary; otherwise fall back to SH*HM
        let SM = 0
        if (m.salaire_mensuel || m.salaireMensuel) {
          SM = Number(m.salaire_mensuel ?? m.salaireMensuel)
        } else if (p && (p.salaire || p.salaire_mensuel)) {
          SM = Number(p.salaire ?? p.salaire_mensuel)
        } else if (HM && SH) {
          SM = Number((SH * HM).toFixed(2))
        } else {
          SM = 0
        }

        const total = m.total ? Number(m.total) : Number((SH + HS + CS + TD).toFixed(2))
        const posteLabel = p?.fonction ?? m.poste ?? ""

        return {
          personnelId: personnelId,
          poste: posteLabel,
          salaireMensuel: SM ? Number(SM).toFixed(2) : "0.00",
          salaireHoraire: SH ? Number(SH).toFixed(2) : "0.00",
          heuresSup: HS ? Number(HS).toFixed(2) : "0.00",
          charges: CS ? Number(CS).toFixed(2) : "0.00",
          temps: TD ? Number(TD).toFixed(2) : "0.00",
          total: total ? Number(total).toFixed(2) : "0.00",
          _hm: HM,
        }
      })
    } catch (err) {
      console.warn('[PriceMO] failed to fetch rows for lot', lotId, err)
      return []
    }
  }, [daoDocId, personnels])

  // Save rows for a lot to backend (PUT)
  const saveRowsForLot = useCallback(async (lotId, rowsToSave) => {
    if (!daoDocId || !lotId) return
    try {
      // map frontend row shape to backend expected keys to ensure persistence
      const payload = Array.isArray(rowsToSave) ? rowsToSave.map(r => {
        const salaireMensuelNum = r.salaireMensuel ? Number(String(r.salaireMensuel).replace(/,/g, '.')) : 0
        const salaireHoraireNum = r.salaireHoraire ? Number(String(r.salaireHoraire).replace(/,/g, '.')) : 0
        const hm = r._hm ? Number(r._hm) : 0
        const computedSM = (salaireMensuelNum > 0) ? salaireMensuelNum : (salaireHoraireNum && hm ? Number((salaireHoraireNum * hm).toFixed(2)) : 0)
        return {
          personnel_id: r.personnelId ?? null,
          poste: r.poste ?? "",
          salaire_mensuel: computedSM,
          salaire_horaire: salaireHoraireNum,
          horaire_mensuel: hm,
          heures_sup: r.heuresSup ? Number(String(r.heuresSup).replace(/,/g, '.')) : 0,
          charges: r.charges ? Number(String(r.charges).replace(/,/g, '.')) : 0,
          temps: r.temps ? Number(String(r.temps).replace(/,/g, '.')) : 0,
          total: r.total ? Number(String(r.total).replace(/,/g, '.')) : 0,
        }
      }) : []

      await api.put(`/dao/${daoDocId}/lots/${lotId}/workforce`, payload)
      console.log('[PriceMO] saved rows for lot', lotId)
    } catch (err) {
      console.warn('[PriceMO] failed to save rows for lot', lotId, err)
    }
  }, [daoDocId])

  // Export current lot rows as Excel (.xlsx)
  const exportCurrentLotExcel = async () => {
    if (!lot) {
      alert('Aucun lot sélectionné pour l\'export')
      return
    }
    try {
      const XLSX = await import('xlsx')
      const currentRows = rows || []
      const headers = ['Poste', 'Salaire Mensuel', 'Salaire Horaire', 'Heures Supplémentaires', 'Charges Sociales', 'Temps de Déplacement', 'Total Horaire']
      // prepare worksheet data: header title, empty row, then column headers and rows
      const lotObj = (savedLots || []).find(s => String(s.id) === String(lot))
      const lotName = lotObj ? (lotObj.name || `lot-${lot}`) : `lot-${lot}`
      const title = 'Ventilation des prix de base pour la main d\'œuvre (Convertis par Heure)'
      const wsData = [[title], [], headers, ...currentRows.map(r => [r.poste ?? '', r.salaireMensuel ?? '', r.salaireHoraire ?? '', r.heuresSup ?? '', r.charges ?? '', r.temps ?? '', r.total ?? ''])]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      // Optionally freeze header row after title
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'MainOeuvre')
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
      console.error('Excel export failed', err)
      alert('L\'export Excel nécessite la librairie "xlsx". Veuillez installer la dépendance (xlsx) et recharger l\'application.')
    }
  }

  /* ---------- Table actions & calculations ---------- */
  const addRow = (data) => {
    // SH = SM / HM
    const SM = Number(data.salaireMensuel || 0)
    const HM = Number(data.valeurHoraireMensuel || 0)
    const SH = HM > 0 ? Number((SM / HM).toFixed(2)) : 0

    // HS, CS, TD treated as additive hourly values provided by user
    const HS = Number(data.heuresSup || 0)
    const CS = Number(data.charges || 0)
    const TD = Number(data.temps || 0)

    const total = Number((SH + HS + CS + TD).toFixed(2))

    const row = {
      personnelId: data.personnelId || null,
      // show function of selected personnel when available
      poste: (data.personnelId ? (personnels.find(p => String(p.id) === String(data.personnelId))?.fonction) : null) || data.poste || "",
      salaireMensuel: SM ? SM.toFixed(2) : "0.00",
      salaireHoraire: SH.toFixed(2),
      heuresSup: HS.toFixed(2),
      charges: CS.toFixed(2),
      temps: TD.toFixed(2),
      total: total.toFixed(2),
      // keep HM in data but do not display in table
      _hm: HM,
    }

    setRows((prev) => {
      const next = [...prev, row]
      if (lot) {
        setRowsByLot(prevMap => ({ ...prevMap, [lot]: next }))
        saveRowsForLot(lot, next)
      }
      return next
    })
  }

  const updateRow = (idx, data) => {
    const SM = Number(data.salaireMensuel || 0)
    const HM = Number(data.valeurHoraireMensuel || 0)
    const SH = HM > 0 ? Number((SM / HM).toFixed(2)) : 0
    const HS = Number(data.heuresSup || 0)
    const CS = Number(data.charges || 0)
    const TD = Number(data.temps || 0)
    const total = Number((SH + HS + CS + TD).toFixed(2))

    const updated = {
      personnelId: data.personnelId || null,
      poste: (data.personnelId ? (personnels.find(p => String(p.id) === String(data.personnelId))?.fonction) : null) || data.poste || "",
      salaireMensuel: SM ? SM.toFixed(2) : "0.00",
      salaireHoraire: SH.toFixed(2),
      heuresSup: HS.toFixed(2),
      charges: CS.toFixed(2),
      temps: TD.toFixed(2),
      total: total.toFixed(2),
      _hm: HM,
    }
    setRows((prev) => {
      const next = prev.map((r, i) => (i === idx ? updated : r))
      if (lot) {
        setRowsByLot(prevMap => ({ ...prevMap, [lot]: next }))
        saveRowsForLot(lot, next)
      }
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
      setRows((prev) => {
        const next = prev.filter((_, i) => i !== pendingDeleteIdx)
        if (lot) {
          setRowsByLot(prevMap => ({ ...prevMap, [lot]: next }))
          saveRowsForLot(lot, next)
        }
        return next
      })
    }
    setConfirmOpen(false)
    setPendingDeleteIdx(null)
  }

  const cancelDelete = () => {
    setConfirmOpen(false)
    setPendingDeleteIdx(null)
  }

  const editRow = (row, idx) => {
    // prepare initial data for modal
    const initial = {
      personnelId: row.personnelId ?? "",
      poste: row.poste ?? "",
      salaireMensuel: row.salaireMensuel ?? "",
      valeurHoraireMensuel: row._hm ?? "",
      heuresSup: row.heuresSup ?? "",
      charges: row.charges ?? "",
      temps: row.temps ?? "",
    }
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
          <h5 className="text-xl font-bold text-secondary m-0">Ventilation des prix de base pour la main d'œuvre (Convertis par Heure)</h5>
        </header>

        {/* Main card */}
        <div className="bg-muted dark:bg-accent rounded-lg shadow-md p-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          {/* DAO & Lot Selectors */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-3 flex-1 bg-white/60 dark:bg-primary/30 border border-muted-50 rounded-md px-3 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/10 text-secondary"><Description fontSize="small" /></span>
              <label className="text-secondary font-medium whitespace-nowrap">DAO :</label>

              {/* Button-based DAO selector to avoid native <select> z-index issues in prod */}
              <div className="relative ml-auto" ref={daoBtnRef}>
                <button onClick={() => setDaoMenuOpen(o => !o)} className="border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-primary dark:text-muted text-sm rounded px-3 py-2 w-64 text-left flex items-center justify-between">
                  <span>{daos.find(d => String(d.document_id) === String(daoDocId)) ? (daos.find(d => String(d.document_id) === String(daoDocId)).original_name || daos.find(d => String(d.document_id) === String(daoDocId)).original_filename || (daos.find(d => String(d.document_id) === String(daoDocId)).filename ? daos.find(d => String(d.document_id) === String(daoDocId)).filename.split('/').pop() : null) || `DAO ${daos.find(d => String(d.document_id) === String(daoDocId)).document_id}`) : 'Sélectionner un DAO'}</span>
                  <span className="ml-2">▾</span>
                </button>
                {daoMenuOpen && (
                  <ul style={{ zIndex: 9999 }} className="absolute right-0 mt-1 w-64 max-h-52 overflow-auto bg-white border rounded shadow-lg">
                    <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setDaoDocId(null); setDaoId(null); setSavedLots([]); setDaoMenuOpen(false); }}>Sélectionner un DAO</li>
                    {daos.map((d, i) => (
                      <li key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setDaoDocId(Number(d.document_id)); setDaoMenuOpen(false); }}>{d.original_name || d.original_filename || (d.filename ? d.filename.split('/').pop() : null) || `DAO ${d.document_id}`}</li>
                    ))}
                  </ul>
                )}
              </div>

              {daoDocId ? (
                <>
                  <label className="text-secondary font-medium whitespace-nowrap ml-3">Lot :</label>

                  {/* Button-based Lot selector */}
                  <div className="relative" ref={lotBtnRef}>
                    <button onClick={() => setLotMenuOpen(o => !o)} className="border border-gray-300 dark:border-muted-50 text-primary dark:text-muted bg-white dark:bg-primary text-sm rounded px-3 py-2 w-full text-left flex items-center justify-between">
                      <span>{(savedLots || []).find(s => String(s.id) === String(lot)) ? (savedLots || []).find(s => String(s.id) === String(lot)).name : 'Sélectionner un Lot'}</span>
                      <span className="ml-2">▾</span>
                    </button>
                    {lotMenuOpen && (
                      <ul style={{ zIndex: 9999 }} className="absolute right-0 mt-1 w-40 max-h-52 overflow-auto bg-white border rounded shadow-lg">
                        <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setLot(""); setRows([]); setLotMenuOpen(false); }}>Sélectionner un Lot</li>
                        {(savedLots || []).map((s, i) => (<li key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={async () => {
                          // same logic as previous select onChange
                          if (lot) {
                            saveRowsForLot(lot, rows).catch(() => { })
                            setRowsByLot(prev => ({ ...prev, [lot]: rows }))
                          }
                          const lotId = Number(s.id)
                          setLot(lotId)
                          const cached = rowsByLot[lotId]
                          if (Array.isArray(cached) && cached.length > 0) {
                            setRows(cached)
                          } else {
                            const fetched = await fetchRowsForLot(lotId)
                            setRows(Array.isArray(fetched) ? fetched : [])
                            setRowsByLot(prev => ({ ...prev, [lotId]: Array.isArray(fetched) ? fetched : [] }))
                          }
                          setLotMenuOpen(false)
                        }}>{s.name}</li>))}
                      </ul>
                    )}
                  </div>
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
                aria-disabled={!lot}
                className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md ${lot ? 'bg-secondary hover:bg-secondary/90 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'}`}
              >
                <CloudDownload fontSize="small" />Exporter
              </button>
            </div>
          </div>

          {/* Action + Table */}
          {lot ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setOpenModal(true)} className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md"><Add fontSize="small" />Ajouter une main d'œuvre</button>
              </div>

              <WorkforceTable rows={rows} onDelete={requestDeleteRow} onEdit={editRow} />
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500">Sélectionner un Lot.</div>
          )}
        </div>

        {/* Modal - only available when a lot is selected */}
        {lot && (
          <>
            <Modal open={openModal} onClose={() => { setOpenModal(false); setEditingIndex(null); setEditingInitial(null); }} onSave={handleSave} personnels={personnels} initialData={editingInitial} />
            <ConfirmModal open={confirmOpen} message={"Supprimer cette ligne ?"} onConfirm={confirmDelete} onCancel={cancelDelete} />
          </>
        )}

        <button
          className="fixed bottom-6 right-10 bg-primary text-white rounded-full shadow-lg hover:bg-secondary transition-colors duration-200 animate-bounce"
          onClick={() => setHelpOpen(true)}
        >
          <Help style={{ fontSize: '3rem' }} />
        </button>
        <HelpGuideModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      </main>
    </div>
  )
}

export default PriceMO