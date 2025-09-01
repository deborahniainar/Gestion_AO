import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import {
  CloudDownload,
  Add,
  Description,
  Edit, 
  Delete
} from "@mui/icons-material";

const Modal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({
    designation: "",
    origine: "",
    pu: "",
    transport: "",
    taxes: "",
    ppercent: "",
    pvaleur: ""
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    onSave(form)
    setForm({ designation: "", origine: "", pu: "", transport: "", taxes: "", ppercent: "", pvaleur: "" })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-primary p-6 rounded-lg shadow-lg w-[500px]">
        <h2 className="text-lg font-bold mb-4 text-secondary">Ajouter un matériel</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Designation</label>
            <input
              name="designation"
              value={form.designation}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              placeholder="Nom du matériel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Origine</label>
            <input
              name="origine"
              value={form.origine}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              placeholder="Origine du matériel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prix Unitaire</label>
            <input
              type="number"
              name="pu"
              value={form.pu}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              placeholder="Prix d'origine"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transport</label>
            <input
              type="number"
              name="transport"
              value={form.transport}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              placeholder="Transport vers le Chantier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Droits et Taxes</label>
            <input
              type="number"
              name="taxes"
              value={form.taxes}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              placeholder="Taxes, droits et autres charges"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pourcentage</label>
            <input
              type="number"
              name="ppercent"
              value={form.ppercent}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              placeholder="Pourcentage Perte"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valeur</label>
            <input
              type="number"
              name="pvaleur"
              value={form.pvaleur}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              placeholder="Valeur Perte"
            />
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

const PriceMTX = () => {
    const [openModal, setOpenModal] = useState(false)
    const [rows, setRows] = useState([])
    const addRow = (data) => {
        const salaireHoraire = (data.horaireMensuel / 160).toFixed(2) // exemple
        const total = (
        parseFloat(data.horaireMensuel || 0) +
        (parseFloat(data.charges || 0) / 100) * parseFloat(data.horaireMensuel || 0)
    ).toFixed(2)

    setRows([...rows, { ...data, salaireHoraire, total }])
  }

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
            <h5 className="text-xl font-bold text-secondary m-0">
              Ventilation des prix de base de fourniture des matériaux et consommables (Convertis en Heures)
            </h5>
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
              >
                <option value="Nom Appel d’Offre actuel">Nom Appel d’Offre actuel</option>
              </select>
              <label className="text-secondary font-medium whitespace-nowrap ml-3">Lot :</label>
              <input
                type="text"
                className="border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-40"
                placeholder="Saisir le lot"
                list="lots-datalist"
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
          
          {/* Action ajouter */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md">
              <Add fontSize="small" />
              Ajouter un matériel
            </button>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full border border-secondary border-collapse">
              <thead className="bg-gray-100 dark:bg-primary/40">
                <tr>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">Description</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">Unité</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">Origine</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">PU</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">Transport</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">Droits et Taxes</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left" colSpan={2}>Perte</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">Total</th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-2 border text-left">Action</th>
                </tr>
                <tr>
                  <th></th><th></th><th></th><th></th><th></th><th></th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-1 border text-left">% </th>
                  <th className="text-primary dark:text-muted border border-secondary px-3 py-1 border text-left">Valeur</th>
                  <th></th><th></th>
                </tr>
              </thead>
              <tbody>
                    <tr className='border border-secondary'>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2"></td>
                      <td className="text-primary dark:text-muted border border-secondary px-3 py-2 text-center">
                        <button className="text-green-600 hover:text-green-800 mr-2">
                          <Edit fontSize="small" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Delete fontSize="small" />
                        </button>
                      </td>
                    </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* Modal */}
        <Modal open={openModal} onClose={() => setOpenModal(false)} onSave={addRow} />
      </main> 
    </div>
  )
}

export default PriceMTX
