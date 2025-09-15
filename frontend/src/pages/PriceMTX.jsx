import React, { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import {
  CloudDownload,
  Add,
  Help,
  Description,
  Edit,
  Delete
} from "@mui/icons-material"
import { useDao } from '../contexts/DaoContext'
import api from '../services/api'

/* ----------------------------- Modal Component ----------------------------- */
const Modal = ({ open, onClose, onSave, initialData = null }) => {
  const initialForm = {
    description: "",
    unite: "",
    origine: "",
    pu: "",
    transport: "",
    taxes: "",
    ppercent: "",
    pvaleur: "",
  }
  const [form, setForm] = useState(initialForm)
  // initialize form from initialData when editing, otherwise reset
  useEffect(() => {
    if (open && initialData) {
      setForm({
        description: initialData.description ?? "",
        unite: initialData.unite ?? "",
        origine: initialData.origine ?? "",
        pu: initialData.pu ?? "",
        transport: initialData.transport ?? "",
        taxes: initialData.taxes ?? "",
        ppercent: initialData.ppercent ?? "",
        pvaleur: initialData.pvaleur ?? "",
      })
      return
    }
    setForm(initialForm)
  }, [open, initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = () => {
    // calculate pvaleur and total before saving
    const pu = parseFloat(form.pu || 0)
    const transport = parseFloat(form.transport || 0)
    const taxes = parseFloat(form.taxes || 0)
    const ppercent = parseFloat(form.ppercent || 0)
    const pvaleur = Number(((pu * ppercent) / 100).toFixed(2))
    const total = Number((pu + transport + taxes + pvaleur).toFixed(2))

    const payload = {
      ...form,
      pu: pu ? pu.toFixed(2) : "0.00",
      transport: transport ? transport.toFixed(2) : "0.00",
      taxes: taxes ? taxes.toFixed(2) : "0.00",
      ppercent: ppercent ? ppercent.toFixed(2) : "0.00",
      pvaleur: pvaleur.toFixed(2),
      total: total.toFixed(2),
    }

    onSave(payload)
    setForm(initialForm)
    onClose()
  }

  if (!open) return null

  const inputs = [
    { label: "Description", name: "description", placeholder: "Nom du matériel" },
    { label: "Unité", name: "unite", placeholder: "Unité (ex: m, kg, unité)" },
    { label: "Origine", name: "origine", placeholder: "Origine du matériel" },
    { label: "Prix Unitaire", name: "pu", type: "number", placeholder: "Prix d'origine" },
    { label: "Transport", name: "transport", type: "number", placeholder: "Transport vers le Chantier" },
    { label: "Droits et Taxes", name: "taxes", type: "number", placeholder: "Taxes, droits et autres charges" },
    { label: "Perte (%)", name: "ppercent", type: "number", placeholder: "Pourcentage Perte" },
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[520px]">
        <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter un matériel</h2>

        <div className="space-y-3">
          {inputs.map((input, i) => (
            <div key={i}>
              <label className="block text-sm font-medium mb-1">{input.label}</label>
              <input
                {...input}
                name={input.name}
                value={form[input.name]}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          ))}

          {/* computed preview for Valeur Perte and Total */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Valeur Perte (V)</label>
              <input disabled value={(() => {
                const pu = parseFloat(form.pu || 0)
                const ppercent = parseFloat(form.ppercent || 0)
                const v = ((pu * ppercent) / 100)
                return isNaN(v) ? '' : v.toFixed(2)
              })()} className="w-full border rounded px-2 py-1 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total</label>
              <input disabled value={(() => {
                const pu = parseFloat(form.pu || 0)
                const transport = parseFloat(form.transport || 0)
                const taxes = parseFloat(form.taxes || 0)
                const ppercent = parseFloat(form.ppercent || 0)
                const v = ((pu * ppercent) / 100)
                const t = pu + transport + taxes + v
                return isNaN(t) ? '' : t.toFixed(2)
              })()} className="w-full border rounded px-2 py-1 bg-gray-50" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
          >
            Enregistrer
          </button>
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
        <h2 className="text-2xl font-bold mb-4">Guide Utilisateur – Matériaux et Consommables</h2>

        <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">

          <section>
            <h3 className="text-lg font-semibold mb-2">1. Introduction</h3>
            <p>Cette page permet de gérer les matériaux et consommables par DAO et Lot, de calculer automatiquement la perte et le total, et d’exporter les données en Excel.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. Sélection du DAO et du Lot</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sélectionnez un DAO dans la liste déroulante.</li>
              <li>Sélectionnez ensuite le Lot correspondant.</li>
              <li>Les matériaux existants pour le lot sélectionné s’affichent automatiquement.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. Ajouter un matériel</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cliquez sur <strong>Ajouter un matériel</strong>.</li>
              <li>Remplissez le formulaire avec : description, unité, origine, PU, transport, taxes, perte (%)</li>
              <li>La <strong>Valeur Perte</strong> et le <strong>Total</strong> sont calculés automatiquement.</li>
              <li>Cliquez sur <strong>Enregistrer</strong> pour ajouter le matériel au tableau.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">4. Modifier un matériel</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cliquez sur l’icône <Edit fontSize="small" /> dans la colonne Action.</li>
              <li>Modifiez les valeurs et cliquez sur <strong>Enregistrer</strong>.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">5. Supprimer un matériel</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cliquez sur l’icône <Delete fontSize="small" /> dans la colonne Action.</li>
              <li>Confirmez la suppression dans la fenêtre modale.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">6. Export Excel</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sélectionnez le Lot souhaité.</li>
              <li>Cliquez sur <CloudDownload fontSize="small" /> pour exporter les matériaux en fichier Excel.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">7. Bonnes pratiques</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Assurez-vous de toujours sélectionner DAO et Lot avant de modifier ou ajouter des lignes.</li>
              <li>Vérifiez les valeurs numériques avant d’enregistrer.</li>
              <li>Les modifications sont automatiquement sauvegardées par lot.</li>
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


// format numbers with thousand separators (French locale)
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(String(value).replace(/,/g, '.'))
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/* ----------------------------- Table Component ----------------------------- */
const MaterialTable = ({ rows, onEdit, onDelete }) => {
  const columns = [
    { key: "description", label: "Description" },
    { key: "unite", label: "Unité" },
    { key: "origine", label: "Origine" },
    { key: "pu", label: "PU" },
    { key: "transport", label: "Transport" },
    { key: "taxes", label: "Droits et Taxes" },
    { key: "ppercent", label: "Perte (%)" },
    { key: "pvaleur", label: "Valeur Perte" },
    { key: "total", label: "Total" }
  ]
  const numericKeys = ['pu', 'transport', 'taxes', 'ppercent', 'pvaleur', 'total']

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-secondary border-collapse">
        <thead className="bg-gray-100 dark:bg-primary/40">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="text-primary dark:text-muted border border-secondary px-3 py-2 text-left">{col.label}</th>
            ))}
            <th className="text-primary dark:text-muted border border-secondary px-3 py-2 text-center">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key} className="text-accent dark:text-muted border border-secondary px-3 py-2">{
                  numericKeys.includes(col.key) ? (row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== '' ? formatNumber(row[col.key], 2) : '-') : (row[col.key] ?? '-')
                }</td>
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
const PriceMTX = () => {
  const [openModal, setOpenModal] = useState(false)
  const [rows, setRows] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingInitial, setEditingInitial] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)

  // Dropdown refs & state (match PriceMO behavior)
  const daoBtnRef = useRef(null)
  const lotBtnRef = useRef(null)
  const [daoMenuOpen, setDaoMenuOpen] = useState(false)
  const [lotMenuOpen, setLotMenuOpen] = useState(false)

  // Confirmation modal state (new)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmIndex, setConfirmIndex] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState('Confirmer ?')

  // DAO / Lot state (mirror PriceMO)
  const [daos, setDaos] = useState([])
  const { savedLots, daoDocId, setSavedLots, setDaoId, setDaoDocId } = useDao()
  const [lot, setLot] = useState("")
  const [rowsByLot, setRowsByLot] = useState({})

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

  // derive selected DAO and Lot objects once to avoid repeating finds in JSX
  const selectedDao = daos.find(d => String(d.document_id) === String(daoDocId))
  const selectedLotObj = (savedLots || []).find(s => String(s.id) === String(lot))

  // fetch DAOs and lots
  useEffect(() => {
    const fetchDaos = async () => {
      try {
        const res = await api.get('/dao/')
        setDaos(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error('[PriceMTX] failed to load DAOs', err)
      }
    }
    fetchDaos()
  }, [])

  useEffect(() => {
    const fetchDaoLots = async () => {
      if (!daoDocId) return
      try {
        const res = await api.get(`/dao/${daoDocId}`)
        const lots = Array.isArray(res.data?.lots) ? res.data.lots.map((l) => ({ id: l.id, name: l.lot_name })) : []
        setSavedLots(lots)
        if (res.data?.dao_id) setDaoId(res.data.dao_id)
      } catch (err) {
        console.error('[PriceMTX] failed to fetch lots', err)
        setSavedLots([])
        setDaoId(null)
      }
    }
    fetchDaoLots()
  }, [daoDocId, setDaoId, setSavedLots])

  // fetch/save per-lot materials
  const fetchRowsForLot = useCallback(async (lotId) => {
    if (!daoDocId || !lotId) return []
    try {
      const res = await api.get(`/dao/${daoDocId}/lots/${lotId}/materials`)
      const data = Array.isArray(res.data) ? res.data : []
      return data.map(m => ({
        // prefer backend keys: designation -> description
        description: m.description ?? m.name ?? m.designation ?? '',
        unite: m.unite ?? m.unit ?? '',
        origine: m.origine ?? m.origin ?? '',
        // accept backend key `prix_unitaire` as well as pu/price_unit
        pu: (() => {
          const raw = m.prix_unitaire ?? m.pu ?? m.price_unit ?? m.prixUnitaire ?? 0
          const num = Number(raw || 0)
          return isNaN(num) ? '0.00' : num.toFixed(2)
        })(),
        transport: (m.transport ?? 0) ? Number(m.transport ?? 0).toFixed(2) : '0.00',
        taxes: (m.taxes ?? 0) ? Number(m.taxes ?? 0).toFixed(2) : '0.00',
        ppercent: (m.perte_percent ?? m.ppercent ?? 0) ? Number(m.perte_percent ?? m.ppercent).toFixed(2) : '0.00',
        pvaleur: (m.perte_valeur ?? m.pvaleur ?? 0) ? Number(m.perte_valeur ?? m.pvaleur).toFixed(2) : '0.00',
        total: (m.total ?? 0) ? Number(m.total).toFixed(2) : '0.00'
      }))
    } catch (err) {
      console.warn('[PriceMTX] failed to fetch rows for lot', lotId, err)
      return []
    }
  }, [daoDocId])

  const saveRowsForLot = async (lotId, rowsToSave) => {
    if (!daoDocId || !lotId) return
    try {
      const payload = Array.isArray(rowsToSave) ? rowsToSave.map(r => ({
        description: r.description ?? '',
        unite: r.unite ?? '',
        origine: r.origine ?? '',
        // send both `pu` and `prix_unitaire` so backend recognizes the value
        pu: r.pu ? Number(String(r.pu).replace(/,/g, '.')) : 0,
        prix_unitaire: r.pu ? Number(String(r.pu).replace(/,/g, '.')) : 0,
        transport: r.transport ? Number(String(r.transport).replace(/,/g, '.')) : 0,
        taxes: r.taxes ? Number(String(r.taxes).replace(/,/g, '.')) : 0,
        perte_percent: r.ppercent ? Number(String(r.ppercent).replace(/,/g, '.')) : 0,
        perte_valeur: r.pvaleur ? Number(String(r.pvaleur).replace(/,/g, '.')) : 0,
        total: r.total ? Number(String(r.total).replace(/,/g, '.')) : 0,
      })) : []
      await api.put(`/dao/${daoDocId}/lots/${lotId}/materials`, payload)
      console.log('[PriceMTX] saved rows for lot', lotId)
    } catch (err) {
      console.warn('[PriceMTX] failed to save rows for lot', lotId, err)
    }
  }

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

  // keep actual deletion logic in a small function
  const deleteRow = (idx) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (lot) { setRowsByLot(prevMap => ({ ...prevMap, [lot]: next })); saveRowsForLot(lot, next) }
      return next
    })
  }

  // instead of deleting immediately, request confirmation (new)
  const requestDeleteRow = (idx) => {
    setConfirmIndex(idx)
    setConfirmMessage('Supprimer ce matériel ?')
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (confirmIndex !== null && confirmIndex !== undefined) {
      deleteRow(confirmIndex)
    }
    setConfirmOpen(false)
    setConfirmIndex(null)
  }

  const cancelDelete = () => {
    setConfirmOpen(false)
    setConfirmIndex(null)
  }

  const editRow = (row, idx) => {
    setEditingIndex(idx)
    setEditingInitial(row)
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

  // Export current lot rows as Excel (client-side, matching PriceMO style)
  const exportCurrentLotExcel = async () => {
    if (!lot) {
      alert('Aucun lot sélectionné pour l\'export')
      return
    }
    try {
      const XLSX = await import('xlsx')
      const currentRows = rows || []
      const headers = ['Description', 'Unité', 'Origine', 'PU', 'Transport', 'Droits et Taxes', 'Perte (%)', 'Valeur Perte', 'Total']
      const lotObj = (savedLots || []).find(s => String(s.id) === String(lot))
      const lotName = lotObj ? (lotObj.name || `lot-${lot}`) : `lot-${lot}`
      const title = 'Ventilation des prix de base de fourniture des matériaux et consommables (Convertis par Unité)'
      const wsData = [[title], [], headers, ...currentRows.map(r => [r.description ?? '', r.unite ?? '', r.origine ?? '', r.pu ?? '', r.transport ?? '', r.taxes ?? '', r.ppercent ?? '', r.pvaleur ?? '', r.total ?? ''])]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Matériaux')
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
      console.error('[PriceMTX] Excel export failed', err)
      alert('L\'export Excel nécessite la librairie "xlsx". Veuillez installer la dépendance (xlsx) et recharger l\'application.')
    }
  }

  useEffect(() => {
    // when daoDocId or lot changes, try to fetch latest persisted rows from backend
    const refresh = async () => {
      if (!daoDocId || !lot) return
      try {
        const fetched = await fetchRowsForLot(lot)
        if (Array.isArray(fetched)) {
          setRows(fetched)
          setRowsByLot(prev => ({ ...prev, [lot]: fetched }))
        }
      } catch (err) {
        console.warn('[PriceMTX] auto-refresh failed', err)
      }
    }
    refresh()
  }, [daoDocId, lot, fetchRowsForLot])

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16'>

        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Ventilation des prix de base de fourniture des matériaux et consommables (Convertis par Unité)
          </h5>
        </header>

        {/* Carte principale */}
        <div className="bg-muted dark:bg-accent rounded-lg shadow-md p-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">

          {/* DAO / Lot */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-3 flex-1 bg-white/60 dark:bg-primary/30 border border-muted-50 rounded-md px-3 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                <Description fontSize="small" />
              </span>
              <label className="text-secondary font-medium whitespace-nowrap">Appel d’Offre :</label>

              {/* Button-based DAO selector */}
              <div className="relative ml-auto" ref={daoBtnRef}>
                <button onClick={() => setDaoMenuOpen(o => !o)} className="border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-primary dark:text-muted text-sm rounded px-3 py-2 w-64 text-left flex items-center justify-between">
                  <span>{selectedDao ? (selectedDao.original_name || selectedDao.original_filename || (selectedDao.filename ? selectedDao.filename.split('/').pop() : null) || `DAO ${selectedDao.document_id}`) : 'Sélectionner un DAO'}</span>
                  <span className="ml-2">▾</span>
                </button>
                {daoMenuOpen && (
                  <ul style={{ zIndex: 9999 }} className="absolute right-0 mt-1 w-64 max-h-52 overflow-auto bg-white border rounded shadow-lg">
                    <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setDaoDocId(null); setDaoId(null); setSavedLots([]); setDaoMenuOpen(false); }}>Sélectionner un DAO</li>
                    {daos.map((d) => (
                      <li key={d.document_id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setDaoDocId(Number(d.document_id)); setDaoMenuOpen(false); }}>{d.original_name || d.original_filename || (d.filename ? d.filename.split('/').pop() : null) || `DAO ${d.document_id}`}</li>
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
                      <span>{selectedLotObj ? selectedLotObj.name : 'Sélectionner un Lot'}</span>
                      <span className="ml-2">▾</span>
                    </button>
                    {lotMenuOpen && (
                      <ul style={{ zIndex: 9999 }} className="absolute right-0 mt-1 w-40 max-h-52 overflow-auto bg-white border rounded shadow-lg">
                        <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setLot(""); setRows([]); setLotMenuOpen(false); }}>Sélectionner un Lot</li>
                        {(savedLots || []).map((s) => (<li key={s.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={async () => {
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

          {/* Tableau */}
          {lot ? (
            <>
              {/* Ajouter Matériel */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setOpenModal(true)}
                  className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md"
                >
                  <Add fontSize="small" />
                  Ajouter un matériel
                </button>
              </div>

              <MaterialTable rows={rows} onEdit={editRow} onDelete={requestDeleteRow} />
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500">Sélectionner un Lot.</div>
          )}
        </div>

        {/* Modal - only when lot selected */}
        {lot && (
          <>
            <Modal open={openModal} onClose={() => { setOpenModal(false); setEditingIndex(null); setEditingInitial(null); }} onSave={handleSave} initialData={editingInitial} />
            <ConfirmModal open={confirmOpen} message={confirmMessage} onConfirm={confirmDelete} onCancel={cancelDelete} />
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

export default PriceMTX
