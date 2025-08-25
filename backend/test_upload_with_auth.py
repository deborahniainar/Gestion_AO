#!/usr/bin/env python3
"""
Script de test pour l'endpoint d'upload DAO avec authentification
"""

import requests
import io
import sys

def get_auth_token():
    """Obtenir un token d'authentification"""
    
    # Essayer d'abord avec les credentials par défaut
    login_url = "http://localhost:8000/auth/login"
    
    # Données de connexion
    credentials = [
        {"username": "admin@STC", "password": "password"},
        {"username": "admin@STC", "password": "admin"},
        {"username": "admin", "password": "password"},
        {"username": "admin", "password": "admin"},
    ]
    
    for creds in credentials:
        try:
            print(f"🔐 Tentative de connexion avec: {creds['username']}")
            
            response = requests.post(
                login_url,
                data=creds,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print(f"✅ Connexion réussie!")
                    return data.get("access_token")
                else:
                    print(f"❌ Échec de connexion: {data.get('message')}")
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"❌ Erreur lors de la connexion: {e}")
    
    return None

def test_upload_with_auth():
    """Test de l'endpoint d'upload avec authentification"""
    
    # Obtenir un token
    print("🔑 Obtention du token d'authentification...")
    token = get_auth_token()
    
    if not token:
        print("❌ Impossible d'obtenir un token d'authentification")
        print("🔧 Vérifiez les credentials ou créez un admin de test")
        return False
    
    print(f"✅ Token obtenu: {token[:20]}...")
    
    # URL de l'endpoint
    url = "http://localhost:8000/dao/upload"
    
    # Headers avec authentification
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Créer un fichier PDF factice en mémoire
    fake_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF"
    
    # Préparer les données du fichier
    files = {
        'file': ('test_dao.pdf', io.BytesIO(fake_pdf_content), 'application/pdf')
    }
    
    try:
        print("\n🧪 Test de l'endpoint d'upload DAO avec authentification...")
        print(f"📤 URL: {url}")
        
        # Faire la requête POST avec authentification
        response = requests.post(url, files=files, headers=headers, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("✅ Upload réussi!")
            print(f"📄 Réponse: {response_data}")
            
            # Vérifier que le fichier a été créé
            document_id = response_data.get("document_id")
            if document_id:
                print(f"🆔 Document ID: {document_id}")
            
            return True
        else:
            print(f"❌ Échec de l'upload:")
            print(f"📋 Status: {response.status_code}")
            print(f"📄 Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def test_extract_summary_with_auth():
    """Test de l'endpoint d'extraction de résumé"""
    
    # D'abord, upload un document
    print("\n📤 Upload d'un document pour tester l'extraction...")
    
    # Obtenir un token
    token = get_auth_token()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Upload un document
    fake_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF"
    files = {'file': ('test_dao.pdf', io.BytesIO(fake_pdf_content), 'application/pdf')}
    
    upload_response = requests.post(
        "http://localhost:8000/dao/upload", 
        files=files, 
        headers=headers, 
        timeout=10
    )
    
    if upload_response.status_code != 200:
        print("❌ Échec de l'upload préalable")
        return False
    
    document_id = upload_response.json().get("document_id")
    print(f"✅ Document uploadé avec ID: {document_id}")
    
    # Tester l'extraction de résumé
    extract_url = "http://localhost:8000/dao/extract_summary"
    extract_data = {
        "document_id": document_id,
        "keywords": "test, extraction",
        "extraction_mode": "smart"
    }
    
    try:
        print("🧪 Test de l'extraction de résumé...")
        extract_response = requests.post(
            extract_url,
            json=extract_data,
            headers={**headers, "Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 Status Code: {extract_response.status_code}")
        
        if extract_response.status_code == 200:
            result = extract_response.json()
            print("✅ Extraction réussie!")
            print(f"📄 Résultat: {result}")
            return True
        else:
            print(f"❌ Échec de l'extraction:")
            print(f"📄 Réponse: {extract_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de l'extraction: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Test complet des endpoints DAO avec authentification")
    print("=" * 60)
    
    # Test 1: Upload
    success1 = test_upload_with_auth()
    
    # Test 2: Extraction
    success2 = test_extract_summary_with_auth()
    
    print("\n" + "=" * 60)
    print("📊 RÉSULTATS DES TESTS")
    print("=" * 60)
    
    print(f"Upload avec auth   : {'✅ RÉUSSI' if success1 else '❌ ÉCHOUÉ'}")
    print(f"Extraction résumé  : {'✅ RÉUSSI' if success2 else '❌ ÉCHOUÉ'}")
    
    if success1 and success2:
        print("\n🎉 Tous les tests sont passés!")
        print("✨ Les endpoints DAO fonctionnent correctement")
    else:
        print("\n⚠️ Certains tests ont échoué")
        print("🔧 Vérifiez la configuration et les logs du serveur")
    
    sys.exit(0 if (success1 and success2) else 1)
