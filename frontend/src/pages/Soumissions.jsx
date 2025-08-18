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

const Soumissions = () => {
  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
            <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Soumissions
          </h5>
          <div className="flex gap-3">
            <button className="p-2 text-primary hover:text-accent transition-colors duration-200">
              <CloudDownload className="h-10 w-10" />
            </button>
            <button className="p-2 text-primary hover:text-accent transition-colors duration-200">
              <Help className="h-8 w-8" />
            </button>
          </div>
        </header>
      </main> 
    </div>
  )
}

export default Soumissions
