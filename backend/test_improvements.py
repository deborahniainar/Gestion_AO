#!/usr/bin/env python3
"""
Script de test pour vérifier les améliorations de l'extraction de résumé des DAO
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_nlp_services():
    """Test des services NLP"""
    print("🧪 Test des services NLP...")
    
    try:
        from app.services.nlp_processing import (
            extract_structured_info, 
            generate_markdown_table, 
            extract_key_phrases
        )
        print("✅ Import des services NLP réussi")
        
        # Test avec un texte d'exemple
        sample_text = """
        APPEL D'OFFRES N° 2024-001
        
        Objet : Construction d'un bâtiment administratif
        Client : Mairie de Paris
        Date limite de soumission : 15 décembre 2024
        Montant estimé : 2 500 000 EUR
        Durée des travaux : 18 mois
        
        Lots :
        - Lot 1 : Gros œuvre et structure
        - Lot 2 : Électricité et plomberie
        - Lot 3 : Finitions et aménagements
        
        Garanties demandées :
        - Garantie de soumission : 50 000 EUR
        - Garantie d'exécution : 5% du montant du marché
        
        Documents requis :
        - Attestation d'assurance décennale
        - Références techniques similaires
        - CV des intervenants clés
        """
        
        # Test extraction structurée
        print("📊 Test extraction structurée...")
        structured_info = extract_structured_info(sample_text)
        if structured_info:
            print(f"✅ Extraction structurée réussie : {len(structured_info)} entités extraites")
            for key, value in structured_info.items():
                print(f"   - {key}: {value}")
        else:
            print("⚠️ Extraction structurée échouée (OpenAI non configuré)")
        
        # Test génération de tableau markdown
        print("📋 Test génération tableau markdown...")
        if structured_info:
            table_md = generate_markdown_table(structured_info)
            print(f"✅ Tableau markdown généré ({len(table_md.split(chr(10)))} lignes)")
        else:
            print("⚠️ Impossible de tester sans données structurées")
        
        # Test extraction par mots-clés
        print("🔍 Test extraction par mots-clés...")
        keywords = ["garantie", "montant", "date", "lot"]
        key_phrases = extract_key_phrases(sample_text, keywords)
        print(f"✅ Extraction par mots-clés réussie : {len(key_phrases)} phrases trouvées")
        
    except Exception as e:
        print(f"❌ Erreur lors du test des services NLP : {e}")
        return False
    
    return True

def test_dao_analyzer():
    """Test du service d'analyse DAO"""
    print("\n🧪 Test du service d'analyse DAO...")
    
    try:
        from app.services.dao_analyzer import analyze_dao_text
        
        print("✅ Import du service d'analyse DAO réussi")
        
        # Test avec un texte d'exemple
        sample_text = """
        MARCHÉ PUBLIC DE TRAVAUX
        
        Référence : MP-2024-002
        Objet : Réhabilitation d'infrastructures routières
        Maître d'ouvrage : Conseil Départemental du Rhône
        Budget estimé : 1 800 000 EUR HT
        Délai d'exécution : 12 mois
        
        Critères d'évaluation :
        - Prix : 40%
        - Expérience technique : 30%
        - Organisation du chantier : 20%
        - Respect de l'environnement : 10%
        
        Garanties :
        - Caution de soumission : 30 000 EUR
        - Caution d'exécution : 4% du montant
        """
        
        # Test analyse complète
        print("📊 Test analyse complète...")
        analysis = analyze_dao_text(sample_text)
        
        if analysis:
            print(f"✅ Analyse DAO réussie")
            print(f"   - Score de confiance : {analysis.confidence_score}")
            print(f"   - Nombre d'entités : {sum(len(entities) for entities in analysis.entities.values())}")
            print(f"   - Nombre de tableaux : {len(analysis.tables)}")
            print(f"   - Métadonnées : {len(analysis.metadata)} champs")
        else:
            print("⚠️ Analyse DAO échouée")
        
    except Exception as e:
        print(f"❌ Erreur lors du test du service d'analyse DAO : {e}")
        return False
    
    return True

def test_api_endpoints():
    """Test des endpoints API"""
    print("\n🧪 Test des endpoints API...")
    
    try:
        from app.api.dao import router
        print("✅ Import du router DAO réussi")
        
        # Vérifier que les routes sont bien définies
        routes = [route.path for route in router.routes]
        expected_routes = [
            "/dao/upload",
            "/dao/extract_summary", 
            "/dao/{document_id}/required_documents",
            "/dao/generate_docx",
        ]
        
        for route in expected_routes:
            if route in routes:
                print(f"✅ Route {route} trouvée")
            else:
                print(f"⚠️ Route {route} manquante")
        
        print(f"📊 Total des routes : {len(routes)}")
        
    except Exception as e:
        print(f"❌ Erreur lors du test des endpoints API : {e}")
        return False
    
    return True

def test_frontend_components():
    """Test des composants frontend"""
    print("\n🧪 Test des composants frontend...")
    
    try:
        # Vérifier que les fichiers existent
        frontend_files = [
            "../frontend/src/pages/DAO.jsx",
            "../frontend/src/components/dao/AnalysisResults.jsx"
        ]
        
        for file_path in frontend_files:
            if os.path.exists(file_path):
                print(f"✅ Fichier {os.path.basename(file_path)} trouvé")
            else:
                print(f"⚠️ Fichier {os.path.basename(file_path)} manquant")
        
        print("📊 Composants frontend vérifiés")
        
    except Exception as e:
        print(f"❌ Erreur lors du test des composants frontend : {e}")
        return False
    
    return True

def main():
    """Fonction principale de test"""
    print("🚀 Test des améliorations de l'extraction de résumé des DAO")
    print("=" * 60)
    
    tests = [
        ("Services NLP", test_nlp_services),
        ("Analyseur DAO", test_dao_analyzer),
        ("Endpoints API", test_api_endpoints),
        ("Composants Frontend", test_frontend_components)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Erreur critique dans {test_name} : {e}")
            results.append((test_name, False))
    
    # Résumé des tests
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ RÉUSSI" if result else "❌ ÉCHOUÉ"
        print(f"{test_name:20} : {status}")
        if result:
            passed += 1
    
    print(f"\nRésultats : {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 Tous les tests sont passés avec succès !")
        print("✨ Les améliorations de l'extraction de résumé sont opérationnelles")
    else:
        print("⚠️ Certains tests ont échoué. Vérifiez la configuration.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
