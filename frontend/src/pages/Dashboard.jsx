import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import useNotifications from '../hooks/useNotifications'
import {
  CloudDownload,
  Help,
  Description,
  Person,
  Build
} from "@mui/icons-material";
import Card from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import api, { documentsAPI } from '../services/api'

const Dashboard = () => {
  const { showError, showInfo, showLoading, updateLoading } = useNotifications();

  const [stats, setStats] = useState({ documents: 0, personnels: 0, soumissions: 0 })
  const [recentDocuments, setRecentDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [materielsCount, setMaterielsCount] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)

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

          <Card title="Documents" subtitle={`${stats.documents} enregistrés`} className="p-4 border-l-4 border-violet-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-violet-400">{stats.documents}</p>
                <p className="text-sm text-violet-400">Documents</p>
              </div>
              <div className="text-violet-400">
                <Description style={{ fontSize: 48 }} />
              </div>
            </div>
          </Card>

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
            setGuideOpen(true)
          }}
        >
          <Help style={{ fontSize: '3rem' }} />
        </button>

        <UserGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      </main>
    </div>
  )
}

export default Dashboard

// User guide modal component
function UserGuideModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-primary w-full max-w-3xl rounded-lg shadow-lg overflow-y-auto max-h-[80vh] p-6">
        <h2 className="text-xl font-bold mb-4 text-secondary">Guide Utilisateur – Tableau de bord</h2>

        <section className="mb-4">
          <h3 className="font-semibold mb-2">Vue d'ensemble</h3>
          <p>Le tableau de bord donne un aperçu rapide des documents, personnels, soumissions et matériels. Vous pouvez télécharger les récents documents depuis la table ci-dessous.</p>
        </section>

        <section className="mb-4">
          <h3 className="font-semibold mb-2">Téléchargement</h3>
          <p>Cliquez sur l'icône de téléchargement dans la colonne Actions pour récupérer un document. Le téléchargement utilisera l'authentification si nécessaire.</p>
        </section>

        <section className="mb-4">
          <h3 className="font-semibold mb-2">Rapports et exports</h3>
          <p>Utilisez le bouton Exporter le rapport pour générer un résumé. Les erreurs de chargement apparaîtront sous forme de notifications.</p>
        </section>

        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">Fermer</button>
        </div>
      </div>
    </div>
  )
}
