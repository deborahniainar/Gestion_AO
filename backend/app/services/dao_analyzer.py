"""
Service d'analyse avancée des DAO (Dossiers d'Appel d'Offres)
Fournit des fonctionnalités d'extraction intelligente et d'analyse sémantique
"""

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
from dataclasses import dataclass
import unicodedata

@dataclass
class ExtractedEntity:
    """Entité extraite du DAO"""
    value: str
    confidence: float
    source_text: str
    entity_type: str

@dataclass
class DAOAnalysis:
    """Résultat de l'analyse d'un DAO"""
    summary: str
    entities: Dict[str, List[ExtractedEntity]]
    tables: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    confidence_score: float

class DAOAnalyzer:
    """Analyseur intelligent de DAO"""
    
    def __init__(self):
        # Patterns pour la reconnaissance d'entités
        self.patterns = {
            'dates': [
                r'\b(\d{1,2}[\/.\- ](?:\d{1,2}|[A-Za-z]{3,})[\/.\- ]\d{2,4})\b',
                r'\b(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\b',
                r'\b(?:jan|fév|mar|avr|mai|juin|juil|août|sept|oct|nov|déc)\s+\d{4}\b'
            ],
            'montants': [
                r'\b(\d{1,3}(?:[ .]\d{3})*(?:,\d+)?)\s*(?:MAD|DH|DHS|EUR|FCFA|DA|€|$)\b',
                r'\b(\d{1,3}(?:[ .]\d{3})*(?:,\d+)?)\s*(?:millions?|millions?|mille|k|K)\b',
                r'\b(?:budget|montant|prix|coût|cout)\s*:?\s*(\d{1,3}(?:[ .]\d{3})*(?:,\d+)?)\b'
            ],
            'pourcentages': [
                r'\b(\d+(?:[.,]\d+)?)\s*%\b',
                r'\b(?:pourcentage|taux)\s*:?\s*(\d+(?:[.,]\d+)?)\s*%\b'
            ],
            'durees': [
                r'\b(\d+)\s*(?:mois|semaines?|jours?|années?)\b',
                r'\b(?:durée|période)\s*:?\s*(\d+)\s*(?:mois|semaines?|jours?|années?)\b'
            ],
            'lots': [
                r'\b(?:lot|LOT)\s*(\d+)\s*[:\-–]\s*(.+?)(?=\n|\.|$)',
                r'\b(?:section|SECTION)\s*(\d+)\s*[:\-–]\s*(.+?)(?=\n|\.|$)'
            ]
        }
        
        # Mots-clés par catégorie
        self.keywords = {
            'garanties': [
                'garantie', 'garanties', 'caution', 'sûreté', 'surete', 'bid bond', 
                'sécurité', 'securite', 'assurance', 'dépôt', 'depot'
            ],
            'exigences_techniques': [
                'exigence', 'exigences', 'technique', 'techniques', 'spécification',
                'specification', 'norme', 'normes', 'standard', 'standards', 'qualité',
                'qualite', 'performance', 'capacité', 'capacite'
            ],
            'documents_requis': [
                'document', 'documents', 'pièce', 'pieces', 'attestation', 'certificat',
                'justificatif', 'justificatifs', 'référence', 'references', 'cv',
                'expérience', 'experience', 'qualification'
            ],
            'criteres_evaluation': [
                'critère', 'criteres', 'évaluation', 'evaluation', 'notation', 'score',
                'pondération', 'ponderation', 'coefficient', 'barème', 'bareme'
            ],
            'conditions_particulieres': [
                'condition', 'conditions', 'particulière', 'particuliere', 'spéciale',
                'speciale', 'exception', 'exceptions', 'contrainte', 'contraintes'
            ]
        }
    
    def analyze_dao(self, text: str, keywords: Optional[List[str]] = None) -> DAOAnalysis:
        """Analyse complète d'un DAO"""
        text = self._preprocess_text(text)
        
        # Extraction des entités
        entities = self._extract_entities(text)
        
        # Analyse sémantique
        semantic_analysis = self._semantic_analysis(text, keywords)
        
        # Génération des tableaux
        tables = self._generate_tables(entities, semantic_analysis)
        
        # Résumé intelligent
        summary = self._generate_summary(entities, semantic_analysis)
        
        # Métadonnées
        metadata = self._extract_metadata(text, entities)
        
        # Score de confiance
        confidence_score = self._calculate_confidence(entities, text)
        
        return DAOAnalysis(
            summary=summary,
            entities=entities,
            tables=tables,
            metadata=metadata,
            confidence_score=confidence_score
        )
    
    def _preprocess_text(self, text: str) -> str:
        """Préparation du texte pour l'analyse"""
        # Normalisation Unicode
        text = unicodedata.normalize('NFD', text)
        
        # Suppression des caractères spéciaux gênants
        text = re.sub(r'[^\w\s\-.,;:!?()[\]{}"\']', ' ', text)
        
        # Nettoyage des espaces multiples
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _extract_entities(self, text: str) -> Dict[str, List[ExtractedEntity]]:
        """Extraction des entités nommées"""
        entities = {}
        
        for entity_type, patterns in self.patterns.items():
            entities[entity_type] = []
            
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    value = match.group(1) if match.groups() else match.group(0)
                    source_text = match.group(0)
                    
                    # Calcul de la confiance basé sur la qualité du match
                    confidence = self._calculate_match_confidence(match, text)
                    
                    entity = ExtractedEntity(
                        value=value.strip(),
                        confidence=confidence,
                        source_text=source_text,
                        entity_type=entity_type
                    )
                    
                    # Éviter les doublons
                    if not any(e.value == entity.value for e in entities[entity_type]):
                        entities[entity_type].append(entity)
        
        return entities
    
    def _semantic_analysis(self, text: str, keywords: Optional[List[str]] = None) -> Dict[str, Any]:
        """Analyse sémantique du texte"""
        analysis = {}
        
        # Analyse par catégorie
        for category, category_keywords in self.keywords.items():
            analysis[category] = self._extract_category_content(text, category_keywords)
        
        # Analyse des mots-clés personnalisés
        if keywords:
            analysis['custom_keywords'] = self._extract_category_content(text, keywords)
        
        # Analyse de la structure du document
        analysis['structure'] = self._analyze_document_structure(text)
        
        return analysis
    
    def _extract_category_content(self, text: str, keywords: List[str]) -> List[Dict[str, Any]]:
        """Extraction du contenu par catégorie"""
        content = []
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Vérifier si la phrase contient des mots-clés de la catégorie
            matched_keywords = [kw for kw in keywords if kw.lower() in sentence.lower()]
            
            if matched_keywords:
                # Calculer la pertinence de la phrase
                relevance = len(matched_keywords) / len(keywords)
                
                content.append({
                    'text': sentence,
                    'keywords_found': matched_keywords,
                    'relevance': relevance,
                    'length': len(sentence)
                })
        
        # Trier par pertinence et limiter le nombre de résultats
        content.sort(key=lambda x: x['relevance'], reverse=True)
        return content[:10]
    
    def _analyze_document_structure(self, text: str) -> Dict[str, Any]:
        """Analyse de la structure du document"""
        lines = text.split('\n')
        
        # Détection des sections
        sections = []
        current_section = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Détection des titres de section
            if re.match(r'^[A-Z][A-Z\s]+$', line) or re.match(r'^\d+\.\s+[A-Z]', line):
                if current_section:
                    sections.append(current_section)
                
                current_section = {
                    'title': line,
                    'start_line': i,
                    'content': [],
                    'level': len(re.match(r'^(\d+\.)*', line).group(0).split('.')) - 1 if re.match(r'^\d+\.', line) else 1
                }
            elif current_section:
                current_section['content'].append(line)
        
        if current_section:
            sections.append(current_section)
        
        return {
            'sections': sections,
            'total_lines': len(lines),
            'estimated_pages': len(lines) // 50  # Estimation basée sur 50 lignes par page
        }
    
    def _generate_tables(self, entities: Dict[str, List[ExtractedEntity]], semantic_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Génération de tableaux structurés"""
        tables = []
        
        # Tableau des entités extraites
        if entities:
            entity_table = {
                'title': 'Entités extraites',
                'headers': ['Type', 'Valeur', 'Confiance', 'Source'],
                'rows': []
            }
            
            for entity_type, entity_list in entities.items():
                for entity in entity_list:
                    entity_table['rows'].append([
                        entity.entity_type,
                        entity.value,
                        f"{entity.confidence:.2f}",
                        entity.source_text[:50] + "..." if len(entity.source_text) > 50 else entity.source_text
                    ])
            
            tables.append(entity_table)
        
        # Tableau des catégories sémantiques
        if semantic_analysis:
            for category, content in semantic_analysis.items():
                if isinstance(content, list) and content:
                    category_table = {
                        'title': f'Analyse - {category.replace("_", " ").title()}',
                        'headers': ['Contenu', 'Mots-clés trouvés', 'Pertinence'],
                        'rows': []
                    }
                    
                    for item in content[:5]:  # Limiter à 5 éléments
                        category_table['rows'].append([
                            item['text'][:100] + "..." if len(item['text']) > 100 else item['text'],
                            ', '.join(item['keywords_found']),
                            f"{item['relevance']:.2f}"
                        ])
                    
                    tables.append(category_table)
        
        return tables
    
    def _generate_summary(self, entities: Dict[str, List[ExtractedEntity]], semantic_analysis: Dict[str, Any]) -> str:
        """Génération d'un résumé intelligent"""
        summary_parts = []
        
        # Informations clés extraites
        if entities.get('dates'):
            summary_parts.append(f"**Dates importantes :** {', '.join([e.value for e in entities['dates'][:3]])}")
        
        if entities.get('montants'):
            summary_parts.append(f"**Montants mentionnés :** {', '.join([e.value for e in entities['montants'][:3]])}")
        
        if entities.get('lots'):
            summary_parts.append(f"**Lots identifiés :** {len(entities['lots'])} lots détectés")
        
        # Résumé par catégorie
        for category, content in semantic_analysis.items():
            if isinstance(content, list) and content:
                if category == 'custom_keywords':
                    summary_parts.append(f"**Mots-clés personnalisés :** {len(content)} éléments trouvés")
                elif len(content) > 0:
                    summary_parts.append(f"**{category.replace('_', ' ').title()} :** {len(content)} éléments identifiés")
        
        # Structure du document
        if semantic_analysis.get('structure'):
            structure = semantic_analysis['structure']
            summary_parts.append(f"**Structure :** {len(structure['sections'])} sections, {structure['estimated_pages']} pages estimées")
        
        return '\n\n'.join(summary_parts) if summary_parts else "Aucune information clé extraite"
    
    def _extract_metadata(self, text: str, entities: Dict[str, List[ExtractedEntity]]) -> Dict[str, Any]:
        """Extraction des métadonnées du document"""
        metadata = {
            'text_length': len(text),
            'word_count': len(text.split()),
            'entity_counts': {k: len(v) for k, v in entities.items()},
            'extraction_timestamp': datetime.now().isoformat()
        }
        
        # Détection de la langue (approximative)
        french_words = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'pour', 'avec']
        french_count = sum(1 for word in text.lower().split() if word in french_words)
        metadata['language_guess'] = 'français' if french_count > len(text.split()) * 0.1 else 'autre'
        
        return metadata
    
    def _calculate_confidence(self, entities: Dict[str, List[ExtractedEntity]], text: str) -> float:
        """Calcul du score de confiance global"""
        if not entities:
            return 0.0
        
        # Score basé sur le nombre d'entités trouvées
        total_entities = sum(len(entity_list) for entity_list in entities.values())
        entity_score = min(total_entities / 20, 1.0)  # Normaliser sur 20 entités
        
        # Score basé sur la qualité des entités
        if total_entities > 0:
            avg_confidence = sum(
                entity.confidence 
                for entity_list in entities.values() 
                for entity in entity_list
            ) / total_entities
        else:
            avg_confidence = 0.0
        
        # Score basé sur la longueur du texte (plus de texte = plus de confiance)
        length_score = min(len(text) / 10000, 1.0)  # Normaliser sur 10k caractères
        
        # Score final pondéré
        final_score = (entity_score * 0.4 + avg_confidence * 0.4 + length_score * 0.2)
        
        return round(final_score, 2)
    
    def _calculate_match_confidence(self, match: re.Match, text: str) -> float:
        """Calcul de la confiance d'un match regex"""
        confidence = 0.5  # Confiance de base
        
        # Augmenter la confiance si le match est dans un contexte approprié
        start, end = match.span()
        context_start = max(0, start - 50)
        context_end = min(len(text), end + 50)
        context = text[context_start:context_end]
        
        # Vérifier la présence de mots-clés contextuels
        context_keywords = ['date', 'montant', 'prix', 'lot', 'garantie', 'exigence']
        context_score = sum(1 for kw in context_keywords if kw.lower() in context.lower()) / len(context_keywords)
        
        confidence += context_score * 0.3
        
        # Augmenter la confiance si le match est bien formaté
        if re.match(r'^\d+', match.group(0)):
            confidence += 0.2
        
        return min(confidence, 1.0)

# Instance globale de l'analyseur
dao_analyzer = DAOAnalyzer()

def analyze_dao_text(text: str, keywords: Optional[List[str]] = None) -> DAOAnalysis:
    """Fonction utilitaire pour analyser un texte DAO"""
    return dao_analyzer.analyze_dao(text, keywords)
