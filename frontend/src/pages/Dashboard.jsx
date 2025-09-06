import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import useNotifications from '../hooks/useNotifications'
import {
  CloudDownload,
  Help,
  Add,
  Description,
  Edit,
  Delete,
  Person,
  Build
} from "@mui/icons-material";
import Card from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import api, { documentsAPI } from '../services/api'

const Dashboard = () => {
  const { showSuccess, showError, showInfo, showWarning, showLoading, updateLoading } = useNotifications();

  const [stats, setStats] = useState({ documents: 0, personnels: 0, soumissions: 0 })
  const [recentDocuments, setRecentDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [materielsCount, setMaterielsCount] = useState(0)

  const handleDownload = async (doc) => {
    if (!doc?.id) {
      showError('Document non disponible')
      return
    }

    const loadingToast = showLoading('Téléchargement en cours...')
    try {
      const response = await documentsAPI.download(doc.id)
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.original_name || doc.original_filename || `document_${doc.id}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      updateLoading(loadingToast, 'Téléchargement réussi', 'success')
    } catch (err) {
      console.error(err)
      updateLoading(loadingToast, 'Erreur lors du téléchargement', 'error')
      showError(err.response?.data?.detail || 'Erreur lors du téléchargement')
    }
  }

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      try {
        // Documents
        const docsResp = await documentsAPI.getAll()
        const docs = docsResp.data || []

        // Personnels
        let personnelsCount = 0
        try {
          const persResp = await api.get('/personnels/')
          personnelsCount = Array.isArray(persResp.data) ? persResp.data.length : 0
        } catch (e) {
          // ignore, keep 0 and show a light warning
          console.warn('Impossible de charger les personnels pour le dashboard', e)
        }

        // Soumissions (si disponible)
        let soumCount = 0
        try {
          const soumResp = await api.get('/soumissions/')
          soumCount = Array.isArray(soumResp.data) ? soumResp.data.length : 0
        } catch (e) {
          // endpoint peut ne pas exister dans certaines API, c'est ok
          console.warn('Endpoint /soumissions/ non disponible', e)
        }

        setStats({
          documents: Array.isArray(docs) ? docs.length : 0,
          personnels: personnelsCount,
          soumissions: soumCount
        })

        // Définir les derniers documents (les plus récents en tête)
        const recent = (docs || []).slice(0, 10).map(d => ({
          id: d.id,
          name: d.original_name || d.original_filename || 'Document sans nom',
          filename: d.original_filename || d.filename || '-',
          expiry: d.expire_at ? new Date(d.expire_at).toLocaleDateString('fr-FR') : '-',
          raw: d
        }))
        setRecentDocuments(recent)
        // charger nombre de matériels
        try {
          const matResp = await api.get('/materiels/')
          const mats = Array.isArray(matResp.data) ? matResp.data : []
          setMaterielsCount(mats.length)
        } catch (e) {
          console.warn('Impossible de charger le nombre de matériels', e)
        }
      } catch (err) {
        console.error('Erreur lors du chargement du dashboard', err)
        showError('Impossible de charger les données du tableau de bord')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'filename', label: 'Fichier' },
    { key: 'expiry', label: "Date d'expiration" },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleDownload(row.raw) }} className="text-gray-600 hover:text-primary" title="Télécharger">
            <CloudDownload />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16'>

        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Tableau de bord et historique
          </h5>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showInfo('Génération du rapport en cours...')}
              className="px-3 py-2 bg-primary text-white rounded-md hover:opacity-90"
            >
              Exporter le rapport
            </button>
          </div>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 m-6">
          <Card title="Documents" subtitle={`${stats.documents} enregistrés`} className="p-4 border-l-4 border-violet-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-violet-400">{stats.documents}</p>
                <p className="text-sm text-violet-400">Documents administratifs</p>
              </div>
              <div className="text-violet-400">
                <Description style={{ fontSize: 48 }} />
              </div>
            </div>
          </Card>

          <Card title="Personnels" subtitle={`${stats.personnels} enregistrés`} className="p-4 border-l-4 border-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-400">{stats.personnels}</p>
                <p className="text-sm text-orange-400">Membres du personnel</p>
              </div>
              <div className="text-orange-400">
                <Person style={{ fontSize: 48 }} />
              </div>
            </div>
          </Card>

          <Card title="Listes des matériaux" subtitle={`${materielsCount} enregistrés`} className="p-4 border-l-4 border-emerald-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{materielsCount}</p>
                <p className="text-sm text-emerald-500">Nombre de matériels</p>
              </div>
              <div className="text-emerald-500">
                <Build style={{ fontSize: 48 }} />
              </div>
            </div>
          </Card>

          {/* <Card title="Soumissions" subtitle={`${stats.soumissions} lots`} className="p-4 border-l-4 border-amber-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.soumissions}</p>
                <p className="text-sm text-gray-500">Soumissions / Workspaces</p>
              </div>
              <div className="text-primary">
                <Add style={{ fontSize: 48 }} />
              </div>
            </div>
          </Card> */}
        </div>

        {/* Recent documents table */}
        <div className="m-6">
          <Card title="Derniers documents" subtitle="Récents téléchargements / uploads" className="p-4">
            <div>
              <DataTable
                data={recentDocuments}
                columns={columns}
                pageSize={5}
                emptyMessage={loading ? 'Chargement...' : 'Aucun document récent'}
              />
            </div>
          </Card>
        </div>

        {/* Bouton Aide flottant */}
        <button
          className="fixed bottom-6 right-10 bg-primary text-white rounded-full shadow-lg hover:bg-secondary transition-colors duration-200 animate-bounce"
          onClick={() => {
            showInfo('Aide / Guide utilisateur en cours de développement !')
          }}
        >
          <Help style={{ fontSize: '3rem' }} />
        </button>
      </main>
    </div>
  )
}

export default Dashboard
