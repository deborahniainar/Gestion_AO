import React from 'react'
import Sidebar from '../components/Sidebar'
import {
  CloudDownload,
  Help,
  Add,
  Description,
  Edit, 
  Delete
} from "@mui/icons-material";

const PriceSDP = () => {
  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
            <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Sous-détail de prix
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
                className="ml-auto border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-64"
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
        </div>
      </main> 
    </div>
  )
}

export default PriceSDP
