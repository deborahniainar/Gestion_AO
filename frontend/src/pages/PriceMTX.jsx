import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { CloudDownload, Add, Description, Edit, Delete } from "@mui/icons-material"

/* ----------------------------- Modal Component ----------------------------- */
const Modal = ({ open, onClose, onSave }) => {
  const initialForm = {
    description: "",
    origine: "",
    pu: "",
    transport: "",
    taxes: "",
    ppercent: "",
    pvaleur: ""
  }
  const [form, setForm] = useState(initialForm)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    onSave(form)
    setForm(initialForm)
    onClose()
  }

  if (!open) return null

  const inputs = [
    { label: "Description", name: "description", placeholder: "Nom du matériel" },
    { label: "Origine", name: "origine", placeholder: "Origine du matériel" },
    { label: "Prix Unitaire", name: "pu", type: "number", placeholder: "Prix d'origine" },
    { label: "Transport", name: "transport", type: "number", placeholder: "Transport vers le Chantier" },
    { label: "Droits et Taxes", name: "taxes", type: "number", placeholder: "Taxes, droits et autres charges" },
    { label: "Pourcentage Perte (%)", name: "ppercent", type: "number", placeholder: "Pourcentage Perte" },
    { label: "Valeur Perte", name: "pvaleur", type: "number", placeholder: "Valeur Perte" },
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[500px]">
        <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter un matériel</h2>

        <div className="space-y-3">
          {inputs.map((input, i) => (
            <div key={i}>
              <label className="block text-sm font-medium mb-1">{input.label}</label>
              <input
                {...input}
                value={form[input.name]}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          ))}
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-secondary border-collapse">
        <thead className="bg-gray-100 dark:bg-primary/40">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-primary dark:text-muted border border-secondary px-3 py-2 text-left"
              >
                {col.label}
              </th>
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
                <td
                  key={col.key}
                  className="text-primary dark:text-muted border border-secondary px-3 py-2"
                >
                  {row[col.key] ?? "-"}
                </td>
              ))}
              <td className="text-center border border-secondary px-3 py-2">
                <button
                  onClick={() => onEdit(idx)}
                  className="text-green-600 hover:text-green-800 mr-2"
                >
                  <Edit fontSize="small" />
                </button>
                <button
                  onClick={() => onDelete(idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Delete fontSize="small" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ----------------------------- Main Component ----------------------------- */
const PriceMTX = () => {
  const [openModal, setOpenModal] = useState(false)
  const [rows, setRows] = useState([])

  const addRow = (data) => {
    // Calculer le total : PU + Transport + Taxes + Valeur Perte
    const total =
      (parseFloat(data.pu || 0) +
       parseFloat(data.transport || 0) +
       parseFloat(data.taxes || 0) +
       parseFloat(data.pvaleur || 0)
      ).toFixed(2)

    setRows([...rows, { ...data, total }])
  }

  const deleteRow = (idx) => setRows(rows.filter((_, i) => i !== idx))
  const editRow = (idx) => console.log("Edit row:", idx)

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
              <select className="ml-auto border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-64">
                <option value="Nom Appel d’Offre actuel">Nom Appel d’Offre actuel</option>
              </select>
              <label className="text-secondary font-medium whitespace-nowrap ml-3">Lot :</label>
              <input
                type="text"
                className="border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-40"
                placeholder="Saisir le lot"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
                <Delete fontSize="small" />
                Supprimer le lot
              </button>
              <button className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white text-sm px-3 py-2 rounded-md">
                <CloudDownload fontSize="small" />
                Exporter
              </button>
            </div>
          </div>

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

          {/* Tableau */}
          <MaterialTable rows={rows} onEdit={editRow} onDelete={deleteRow} />
        </div>

        {/* Modal */}
        <Modal open={openModal} onClose={() => setOpenModal(false)} onSave={addRow} />
      </main>
    </div>
  )
}

export default PriceMTX
