#!/usr/bin/env python3
"""
Script de test pour l'endpoint d'upload DAO
"""

import requests
import io
import os

def test_upload_endpoint():
    """Test de l'endpoint d'upload avec un fichier factice"""
    
    # URL de l'endpoint
    url = "http://localhost:8000/dao/upload"
    
    # Créer un fichier PDF factice en mémoire
    fake_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF"
    
    # Préparer les données du fichier
    files = {
        'file': ('test_dao.pdf', io.BytesIO(fake_pdf_content), 'application/pdf')
    }
    
    try:
        print("🧪 Test de l'endpoint d'upload DAO...")
        print(f"📤 URL: {url}")
        
        # Faire la requête POST
        response = requests.post(url, files=files, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("✅ Upload réussi!")
            print(f"📄 Réponse: {response_data}")
            return True
        else:
            print(f"❌ Échec de l'upload:")
            print(f"📋 Status: {response.status_code}")
            print(f"📄 Réponse: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Erreur: Impossible de se connecter au serveur")
        print("🔧 Assurez-vous que le serveur FastAPI est démarré (uvicorn app.main:app --reload)")
        return False
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return False

def test_upload_wrong_format():
    """Test avec un format non autorisé"""
    
    url = "http://localhost:8000/dao/upload"
    
    # Fichier avec extension non autorisée
    files = {
        'file': ('test.txt', io.BytesIO(b"Test content"), 'text/plain')
    }
    
    try:
        print("\n🧪 Test avec format non autorisé...")
        response = requests.post(url, files=files, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Validation des formats fonctionne correctement")
            print(f"📄 Message d'erreur: {response.json()}")
            return True
        else:
            print("⚠️ La validation des formats ne fonctionne pas comme attendu")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Test des endpoints d'upload DAO")
    print("=" * 50)
    
    # Test 1: Upload valide
    success1 = test_upload_endpoint()
    
    # Test 2: Format invalide
    success2 = test_upload_wrong_format()
    
    print("\n" + "=" * 50)
    print("📊 RÉSULTATS DES TESTS")
    print("=" * 50)
    
    print(f"Upload valide      : {'✅ RÉUSSI' if success1 else '❌ ÉCHOUÉ'}")
    print(f"Validation format  : {'✅ RÉUSSI' if success2 else '❌ ÉCHOUÉ'}")
    
    if success1 and success2:
        print("\n🎉 Tous les tests sont passés!")
        print("✨ L'endpoint d'upload fonctionne correctement")
    else:
        print("\n⚠️ Certains tests ont échoué")
        print("🔧 Vérifiez les logs du serveur pour plus de détails")
