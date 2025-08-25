import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Box,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  Assessment,
  TableChart,
  Info,
  Download,
  Share
} from '@mui/icons-material';

const AnalysisResults = ({ analysisData, onExport }) => {
  const [expandedSection, setExpandedSection] = useState('entities');

  if (!analysisData) {
    return (
      <Box className="text-center p-8">
        <Typography variant="h6" color="textSecondary">
          Aucune donnée d'analyse disponible
        </Typography>
      </Box>
    );
  }

  const handleSectionChange = (section) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? section : false);
  };

  const renderEntityTable = () => {
    if (!analysisData.entities || Object.keys(analysisData.entities).length === 0) {
      return (
        <Typography variant="body2" color="textSecondary" className="text-center p-4">
          Aucune entité extraite
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper} className="max-h-96 overflow-auto">
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell className="font-semibold">Type</TableCell>
              <TableCell className="font-semibold">Valeur</TableCell>
              <TableCell className="font-semibold">Confiance</TableCell>
              <TableCell className="font-semibold">Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(analysisData.entities).map(([entityType, entities]) =>
              entities.map((entity, index) => (
                <TableRow key={`${entityType}-${index}`} hover>
                  <TableCell>
                    <Chip 
                      label={entity.entity_type} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{entity.value}</TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <LinearProgress 
                        variant="determinate" 
                        value={entity.confidence * 100} 
                        className="w-16"
                        color={entity.confidence > 0.7 ? "success" : entity.confidence > 0.4 ? "warning" : "error"}
                      />
                      <Typography variant="caption">
                        {Math.round(entity.confidence * 100)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <Tooltip title={entity.source_text}>
                      <Typography variant="body2" className="truncate">
                        {entity.source_text.length > 50 
                          ? `${entity.source_text.substring(0, 50)}...` 
                          : entity.source_text
                        }
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSemanticAnalysis = () => {
    if (!analysisData.semantic_analysis) {
      return (
        <Typography variant="body2" color="textSecondary" className="text-center p-4">
          Aucune analyse sémantique disponible
        </Typography>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(analysisData.semantic_analysis).map(([category, content]) => {
          if (!Array.isArray(content) || content.length === 0) return null;
          
          return (
            <Accordion key={category} className="border rounded-lg">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box className="flex items-center gap-2">
                  <Assessment className="text-primary" />
                  <Typography variant="h6" className="capitalize">
                    {category.replace(/_/g, ' ')}
                  </Typography>
                  <Chip 
                    label={content.length} 
                    size="small" 
                    color="secondary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <div className="space-y-3">
                  {content.slice(0, 5).map((item, index) => (
                    <Box key={index} className="p-3 bg-gray-50 rounded-lg">
                      <Typography variant="body2" className="mb-2">
                        {item.text}
                      </Typography>
                      <Box className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          Mots-clés: {item.keywords_found?.join(', ') || 'Aucun'}
                        </span>
                        <Chip 
                          label={`${Math.round((item.relevance || 0) * 100)}%`}
                          size="small"
                          color={item.relevance > 0.7 ? "success" : "default"}
                        />
                      </Box>
                    </Box>
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!analysisData.metadata) return null;

    const metadata = analysisData.metadata;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Box className="p-4 bg-blue-50 rounded-lg">
          <Typography variant="h6" color="primary" className="mb-2">
            Statistiques du document
          </Typography>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Caractères:</span>
              <span className="font-medium">{metadata.text_length?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Mots:</span>
              <span className="font-medium">{metadata.word_count?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Pages estimées:</span>
              <span className="font-medium">{metadata.estimated_pages || 'N/A'}</span>
            </div>
          </div>
        </Box>

        <Box className="p-4 bg-green-50 rounded-lg">
          <Typography variant="h6" color="success" className="mb-2">
            Entités extraites
          </Typography>
          <div className="space-y-2">
            {metadata.entity_counts && Object.entries(metadata.entity_counts).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="capitalize">{type.replace(/_/g, ' ')}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Box>

        <Box className="p-4 bg-purple-50 rounded-lg">
          <Typography variant="h6" color="secondary" className="mb-2">
            Qualité de l'extraction
          </Typography>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Score de confiance:</span>
              <span className="font-medium">
                {Math.round((analysisData.confidence_score || 0) * 100)}%
              </span>
            </div>
            <LinearProgress 
              variant="determinate" 
              value={(analysisData.confidence_score || 0) * 100} 
              className="w-full"
              color={analysisData.confidence_score > 0.7 ? "success" : "warning"}
            />
            <Typography variant="caption" color="textSecondary">
              {analysisData.confidence_score > 0.7 ? "Excellente qualité" : 
               analysisData.confidence_score > 0.4 ? "Qualité moyenne" : "Qualité faible"}
            </Typography>
          </div>
        </Box>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <Box className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <Box className="flex items-center gap-3">
          <TrendingUp className="text-primary text-2xl" />
          <div>
            <Typography variant="h5" className="font-bold text-primary">
              Résultats de l'analyse
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Analyse intelligente du document DAO
            </Typography>
          </div>
        </Box>
        
        <Box className="flex gap-2">
          <Tooltip title="Exporter les résultats">
            <IconButton onClick={() => onExport && onExport(analysisData)} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Partager l'analyse">
            <IconButton color="primary">
              <Share />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Sections d'analyse */}
      <Accordion 
        expanded={expandedSection === 'entities'} 
        onChange={handleSectionChange('entities')}
        className="border rounded-lg"
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box className="flex items-center gap-2">
            <TableChart className="text-primary" />
            <Typography variant="h6">Entités extraites</Typography>
            <Chip 
              label={Object.values(analysisData.entities || {}).flat().length} 
              size="small" 
              color="primary"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {renderEntityTable()}
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedSection === 'semantic'} 
        onChange={handleSectionChange('semantic')}
        className="border rounded-lg"
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box className="flex items-center gap-2">
            <Assessment className="text-primary" />
            <Typography variant="h6">Analyse sémantique</Typography>
            <Chip 
              label="Détail" 
              size="small" 
              color="secondary"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {renderSemanticAnalysis()}
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedSection === 'metadata'} 
        onChange={handleSectionChange('metadata')}
        className="border rounded-lg"
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box className="flex items-center gap-2">
            <Info className="text-primary" />
            <Typography variant="h6">Métadonnées et statistiques</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {renderMetadata()}
        </AccordionDetails>
      </Accordion>

      {/* Résumé intelligent */}
      {analysisData.summary && (
        <Box className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <Typography variant="h6" color="success" className="mb-3 flex items-center gap-2">
            <TrendingUp />
            Résumé intelligent
          </Typography>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: analysisData.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>
        </Box>
      )}
    </div>
  );
};

export default AnalysisResults;
