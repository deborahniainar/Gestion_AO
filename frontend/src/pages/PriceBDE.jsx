import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import {
  CloudDownload,
  Description,
  Help,
} from "@mui/icons-material";
import { useDao } from '../contexts/DaoContext'
import api from '../services/api'

const PriceBDE = () => {
  const [daos, setDaos] = useState([])
  const { savedLots, daoDocId, setSavedLots, setDaoId, setDaoDocId } = useDao()
  const [lot, setLot] = useState("")

  const fetchDaos = useCallback(async () => {
    try {
      const res = await api.get('/dao/')
      setDaos(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('[PriceBDE] failed to load DAOs', err)
    }
  }, [])

  const fetchDaoLots = useCallback(async () => {
    if (!daoDocId) return
    try {
      const res = await api.get(`/dao/${daoDocId}`)
      const lots = Array.isArray(res.data?.lots) ? res.data.lots.map((l) => ({ id: l.id, name: l.lot_name })) : []
      setSavedLots(lots)
      if (res.data?.dao_id) setDaoId(res.data.dao_id)
    } catch (err) {
      console.error('[PriceBDE] failed to fetch lots', err)
      setSavedLots([])
      setDaoId(null)
    }
  }, [daoDocId, setDaoId, setSavedLots])

  useEffect(() => { fetchDaos() }, [fetchDaos])
  useEffect(() => { fetchDaoLots() }, [fetchDaoLots])

  // Build BDE rows automatically from DAO lot data when lot changes
  const [bdeRows, setBdeRows] = useState([])

  const buildBDEFromLot = useCallback(async () => {
    if (!daoDocId || !lot) { setBdeRows([]); return }
    try {
      const res = await api.get(`/dao/${daoDocId}`)
      const lots = Array.isArray(res.data?.lots) ? res.data.lots : []
      const lotObj = lots.find(l => Number(l.id) === Number(lot) || Number(l.lot_id) === Number(lot))
      if (!lotObj) { setBdeRows([]); return }

      const rows = []

        // From priceMO (workforce) - map poste rows
        ; (lotObj.priceMO || []).forEach(m => {
          rows.push({
            source: 'MO',
            poste: m.poste || null,
            numero_poste: m.poste || null,
            numero_article: null,
            designation: m.poste || 'Main d\'oeuvre',
            quantite: m.temps ?? m.horaire_mensuel ?? null,
            unite: 'h',
            prix_unitaire: m.salaire_horaire ?? m.total ?? null,
            total: m.total ?? null,
          })
        })

        // From priceMTX
        ; (lotObj.priceMTX || []).forEach(m => {
          rows.push({
            source: 'MTX',
            poste: null,
            numero_poste: null,
            numero_article: m.id ?? null,
            designation: m.designation || '',
            quantite: m.quantite ?? null,
            unite: m.unite ?? m.unite ?? null,
            prix_unitaire: m.prix_unitaire ?? null,
            total: m.total ?? null,
          })
        })

        // From priceEQU
        ; (lotObj.priceEQU || []).forEach(e => {
          rows.push({
            source: 'EQU',
            poste: null,
            numero_poste: null,
            numero_article: e.id ?? null,
            designation: e.designation || '',
            quantite: e.quantite ?? null,
            unite: e.unite ?? null,
            prix_unitaire: e.prix_unitaire ?? null,
            total: e.total ?? null,
          })
        })

        // From priceSDP (posts -> articles)
        ; (lotObj.priceSDP || []).forEach(sdp => {
          ; (sdp.posts || []).forEach(p => {
            ; (p.articles || []).forEach(a => {
              // take the article's stored cost net (no computation here)
              const articleCostRaw = (
                a?.costPerUnit ??
                a?.cost_per_unit ??
                a?.costNetPerUnit ??
                a?.cost_net_per_unit ??
                a?.costNet ??
                a?.priceNetPerUnit ??
                a?.price_net_per_unit ??
                a?.prix_unitaire ??
                a?.pu ??
                a?.price ??
                // nested possibilities
                a?.costs?.costPerUnit ??
                a?.costs?.cost_per_unit ??
                a?.costs?.costNetPerUnit ??
                a?.costs?.cost_net_per_unit ??
                a?.costs?.net?.per_unit ??
                a?.prix?.costNetPerUnit ??
                null
              )

              // Helper to coerce various input shapes (string with comma, numeric) to a nullable number
              const toNumber = (v) => {
                if (v === null || v === undefined || v === '') return null
                // if it's already a number and finite, return it
                if (typeof v === 'number' && Number.isFinite(v)) return v
                // try to stringify and replace comma decimal separators
                const n = Number(String(v).replace(/,/g, '.'))
                return Number.isFinite(n) ? n : null
              }

              // If no direct unit cost, try to find a unit cost on a child element (no summation)
              let elementUnitFallback = null
              if ((articleCostRaw === null || articleCostRaw === undefined || articleCostRaw === '') && Array.isArray(a?.elements) && a.elements.length > 0) {
                for (const el of a.elements) {
                  const candidateRaw = el?.costPerUnit ?? el?.cost_per_unit ?? el?.costNetPerUnit ?? el?.cost_net_per_unit ?? el?.pu ?? el?.prix_unitaire ?? el?.price ?? null
                  const candidate = toNumber(candidateRaw)
                  if (candidate !== null) { elementUnitFallback = candidate; break }
                }
                if (elementUnitFallback !== null) {
                  console.log('[PriceBDE] using element unit fallback for article', { articleId: a?.id, elementUnitFallback })
                }
              }

              // If still no direct unit, optionally compute from elements total (existing behavior)
              let computedFromElements = null
              if ((articleCostRaw === null || articleCostRaw === undefined || articleCostRaw === '') && elementUnitFallback === null && Array.isArray(a?.elements) && a.elements.length > 0) {
                const safeNum = (v) => {
                  if (v === null || v === undefined || v === '') return NaN
                  const n = Number(String(v).replace(/,/g, '.'))
                  return Number.isFinite(n) ? n : NaN
                }

                const elementTotal = a.elements.reduce((s, el) => {
                  const elUnit = el?.costPerUnit ?? el?.cost_net_per_unit ?? el?.costNetPerUnit ?? el?.pu ?? el?.prix_unitaire ?? el?.price ?? null
                  const elQty = el?.quantite ?? el?.quantity ?? el?.qte ?? 1
                  const unitN = safeNum(elUnit)
                  const qtyN = safeNum(elQty)
                  if (Number.isFinite(unitN) && Number.isFinite(qtyN)) return s + (unitN * qtyN)
                  const elTotal = safeNum(el?.total ?? el?.montant ?? el?.amount)
                  if (Number.isFinite(elTotal)) return s + elTotal
                  return s
                }, 0)

                if (elementTotal > 0) {
                  const articleQty = safeNum(a?.quantite ?? a?.qte ?? 1)
                  computedFromElements = Number.isFinite(articleQty) && articleQty > 0 ? elementTotal / articleQty : elementTotal
                  console.log('[PriceBDE] computed article cost from elements', { articleId: a?.id, articleQty: a?.quantite, elementTotal, computedFromElements })
                }
              }

              const finalRaw = (articleCostRaw === null || articleCostRaw === undefined || articleCostRaw === '')
                ? (elementUnitFallback ?? computedFromElements)
                : articleCostRaw

              const articleCost = toNumber(finalRaw)

              // Debug: inspect raw article object and extracted cost values
              console.log('[PriceBDE] article raw', a, 'articleCostRaw', articleCostRaw, 'elementUnitFallback', elementUnitFallback, 'computedFromElements', computedFromElements, 'articleCost', articleCost)

              rows.push({
                source: 'SDP',
                poste: p.titre || p.numero || null,
                numero_poste: p.numero ?? null,
                numero_article: a.numero ?? a.id ?? null,
                designation: a.designation || a.description || '',
                quantite: a.quantite ?? null,
                unite: a.unite ?? null,
                prix_unitaire: articleCost,
                total: a.total ?? null,
              })
            })
          })
        })

      // Debug: show server SDP payload and resulting rows
      console.debug('[PriceBDE] lotObj.priceSDP', lotObj.priceSDP)
      console.debug('[PriceBDE] built rows (sample)', rows.slice(0, 20))
      setBdeRows(rows)
    } catch (err) {
      console.error('[PriceBDE] failed to build BDE from lot', err)
      setBdeRows([])
    }
  }, [daoDocId, lot])

  useEffect(() => { buildBDEFromLot() }, [buildBDEFromLot])

  // Export BDE as XLSX (per-poste tables with subtotals and grand total)
  const exportBDEExcel = async () => {
    if (!lot) { alert('Aucun lot sélectionné pour l\'export'); return }
    try {
      const XLSX = await import('xlsx')
      const sdpRows = (bdeRows || []).filter(r => r.source === 'SDP')
      if (sdpRows.length === 0) { alert('Aucun poste SDP pour ce lot'); return }

      const groups = {}
      const order = []
      sdpRows.forEach(r => {
        const key = (r.numero_poste ?? r.poste) || 'Sans poste'
        if (!groups[key]) { groups[key] = []; order.push(key) }
        groups[key].push(r)
      })

      const parseNum = (v) => {
        if (v === null || v === undefined || v === '') return null
        const n = Number(String(v).replace(/,/g, '.'))
        return Number.isFinite(n) ? n : null
      }

      const wsData = []
      const title = `Bordereau de Prix - DAO ${daoDocId || ''} - Lot ${lot || ''}`
      wsData.push([title])
      wsData.push([])

      let grandTotal = 0

      order.forEach((key) => {
        const items = groups[key] || []
        const displayName = (items && items[0] && (items[0].poste ?? items[0].titre ?? items[0].numero_poste ?? '')) || ''
        wsData.push([`Poste ${key}${displayName ? ` : ${displayName}` : ''}`])
        wsData.push(['N° Prix', 'Désignation', 'Unité', 'Quantité', 'Prix unitaire', 'Montant'])
        let subtotal = 0
        items.forEach(r => {
          const pu = parseNum(r.prix_unitaire)
          const qty = parseNum(r.quantite ?? r.qte)
          const montant = (pu !== null && qty !== null) ? (pu * qty) : (parseNum(r.total) ?? 0)
          subtotal += montant || 0
          wsData.push([r.numero_article ?? '', r.designation ?? '', r.unite ?? '', r.quantite ?? '', pu !== null ? (Number(pu).toFixed(2)) : '', montant !== null ? (Number(montant).toFixed(2)) : ''])
        })
        wsData.push([])
        wsData.push([`Sous-total N° ${key}`, '', '', '', '', subtotal.toFixed(2)])
        wsData.push([])
        grandTotal += subtotal
      })

      wsData.push([])
      wsData.push(['Total général', '', '', '', '', grandTotal.toFixed(2)])

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'BDE')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const filename = `bde-dao-${daoDocId || 'unknown'}_lot-${lot || 'unknown'}.xlsx`
      a.href = url
      a.setAttribute('download', filename)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[PriceBDE] Excel export failed', err)
      alert('Échec de l\'export Excel. Vérifiez la console pour plus de détails.')
    }
  }

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16'>

        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
          <h5 className="text-xl font-bold text-secondary m-0">
            Bordereaux de Prix
          </h5>
        </header>
        {/* Carte principale */}
        <div className="bg-muted dark:bg-accent rounded-lg shadow-md p-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          {/* Ligne Appel d'Offre + actions (same layout as other price pages) */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-3 flex-1 bg-white/60 dark:bg-primary/30 border border-muted-50 rounded-md px-3 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                <Description fontSize="small" />
              </span>

              <label className="text-secondary font-medium whitespace-nowrap">DAO :</label>
              <select className="text-primary dark:text-muted ml-auto border border-gray-300 dark:border-muted-50 bg-white dark:bg-primary text-sm rounded px-3 py-2 w-64" value={daoDocId || ""} onChange={(e) => {
                const val = e.target.value
                if (!val) { setDaoDocId(null); setDaoId(null); setSavedLots([]); return }
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
                  <select className="border border-gray-300 dark:border-muted-50 text-primary dark:text-muted bg-white dark:bg-primary text-sm rounded px-3 py-2 w-40" value={lot} onChange={(e) => {
                    const val = e.target.value
                    if (!val) { setLot(""); return }
                    setLot(Number(val))
                  }}>
                    <option value="">Sélectionner un Lot</option>
                    {(savedLots || []).map((s, i) => (<option key={i} value={s.id}>{s.name}</option>))}
                  </select>
                </>
              ) : (
                <div className="ml-3 text-sm text-gray-500">Aucun DAO sélectionné.</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm ${lot ? 'bg-secondary hover:bg-secondary/90 text-white' : 'bg-secondary/60 disabled:opacity-50 text-white cursor-not-allowed'}`} disabled={!lot} onClick={exportBDEExcel}>
                <CloudDownload fontSize="small" />Exporter
              </button>
            </div>
          </div>

          {lot ? (
            <div className="mt-4">
              {/* group rows by poste */}
              {(() => {
                // show only user-added postes (source === 'SDP')
                const sdpRows = (bdeRows || []).filter(r => r.source === 'SDP')
                if (sdpRows.length === 0) {
                  return (<div className="p-4 text-sm text-gray-500">Aucun poste SDP ajouté pour ce lot.</div>)
                }

                // group rows while preserving the order of first appearance
                const groups = {}
                const order = []
                sdpRows.forEach(r => {
                  const key = (r.numero_poste ?? r.poste) || 'Sans poste'
                  if (!groups[key]) { groups[key] = []; order.push(key) }
                  groups[key].push(r)
                })

                // build subtotals and render each poste (respecting original order), then show a grand total
                return (() => {
                  const posteKeys = order
                  // helper to parse numbers consistently
                  const parseNum = (v) => {
                    if (v === null || v === undefined || v === '') return null
                    const n = Number(String(v).replace(/,/g, '.'))
                    return Number.isFinite(n) ? n : null
                  }

                  // format numbers with thousand separators (French locale) and fixed decimals
                  const formatNumber = (value, decimals = 2) => {
                    if (value === null || value === undefined || value === '') return ''
                    const n = Number(String(value).replace(/,/g, '.'))
                    if (!Number.isFinite(n)) return ''
                    return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
                  }

                  // compute subtotals per poste
                  const subtotals = {}
                  posteKeys.forEach((k) => {
                    const items = groups[k] || []
                    const subtotal = items.reduce((acc, r) => {
                      const pu = parseNum(r.prix_unitaire)
                      const qty = parseNum(r.quantite ?? r.qte)
                      const montant = (pu !== null && qty !== null) ? (pu * qty) : (parseNum(r.total) ?? null)
                      return acc + (montant !== null ? montant : 0)
                    }, 0)
                    subtotals[k] = subtotal
                  })

                  // render poste tables
                  const rendered = posteKeys.map((posteKey, gi) => {
                    const items = groups[posteKey] || []
                    const displayPosteName = (items && items[0] && (items[0].poste ?? items[0].titre ?? items[0].numero_poste ?? '')) || ''
                    const subtotal = subtotals[posteKey] || 0

                    return (
                      <div key={gi} className="mb-6 overflow-x-auto">
                        <div className="mb-2 font-semibold">Poste {posteKey}{displayPosteName ? ` : ${displayPosteName}` : ' : '}</div>
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border p-2">N° Prix</th>
                              <th className="border p-2">Désignation</th>
                              <th className="border p-2">Unité</th>
                              <th className="border p-2 text-right">Quantité</th>
                              <th className="border p-2 text-right">Prix unitaire</th>
                              <th className="border p-2 text-right">Montant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((r, idx) => {
                              const pu = parseNum(r.prix_unitaire)
                              const qty = parseNum(r.quantite ?? r.qte)
                              const montant = (pu !== null && qty !== null) ? (pu * qty) : (parseNum(r.total) ?? null)

                              return (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="border p-2 text-center">{r.numero_article ?? ''}</td>
                                  <td className="border p-2">{r.designation}</td>
                                  <td className="border p-2 text-center">{r.unite ?? ''}</td>
                                  <td className="border p-2 text-right">{qty !== null ? (Number.isInteger(qty) ? formatNumber(qty, 0) : formatNumber(qty, 2)) : ''}</td>
                                  <td className="border p-2 text-right">{pu !== null ? formatNumber(pu, 2) : ''}</td>
                                  <td className="border p-2 text-right">{montant !== null ? formatNumber(montant, 2) : ''}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100">
                              <td colSpan={5} className="border p-2 font-semibold">Sous-total Poste {posteKey}</td>
                              <td className="border p-2 text-right font-semibold">{Number.isFinite(subtotal) ? formatNumber(subtotal, 2) : '0.00'}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )
                  })

                  const grandTotal = Object.values(subtotals).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)

                  return (
                    <>
                      {rendered}
                      <div className="mt-4 p-4 bg-white dark:bg-primary rounded-md border border-gray-200">
                        <div className="flex justify-between items-center gap-4">
                          <div className="text-xl font-bold text-primary dark:text-main">Total général :</div>
                          <div className="text-lg font-bold text-secondary">{Number.isFinite(grandTotal) ? formatNumber(grandTotal, 2) : '0.00'}</div>
                        </div>
                      </div>
                    </>
                  )
                })()
              })()}
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-500">Sélectionner un lot.</div>
          )}
        </div>
      </main>
    </div>
  )
}

export default PriceBDE
