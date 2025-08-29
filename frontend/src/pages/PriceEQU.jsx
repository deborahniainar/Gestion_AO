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

const PriceEQU = () => {
  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
            <h5 className="text-xl font-bold text-secondary m-0">
            Ventilation des prix de base pour les équipements
          </h5>
        </header>
      </main> 
    </div>
  )
}

export default PriceEQU
