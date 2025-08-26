#!/usr/bin/env python3
"""
Script de diagnostic pour identifier les problèmes du serveur
"""

import sys
import traceback

def test_imports():
    """Test des imports principaux"""
    print("🧪 Test des imports...")
    
    try:
        print("  - fastapi...", end=" ")
        from fastapi import FastAPI
        print("✅")
        
        print("  - app.main...", end=" ")
        from app.main import app
        print("✅")
        
        print("  - app.api.dao...", end=" ")
        from app.api.dao import router
        print("✅")
        
        print("  - app.services.nlp_processing...", end=" ")
        from app.services.nlp_processing import extract_structured_info
        print("✅")
        
        print("  - app.services.dao_analyzer...", end=" ")
        from app.services.dao_analyzer import analyze_dao_text
        print("✅")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        traceback.print_exc()
        return False

def test_database():
    """Test de la connexion à la base de données"""
    print("\n🗄️ Test de la base de données...")
    
    try:
        from app.db.session import get_db
        from app.db.models import Admin
        
        db = next(get_db())
        admins = db.query(Admin).count()
        print(f"  - Connexion DB: ✅ ({admins} admins)")
        db.close()
        return True
        
    except Exception as e:
        print(f"  - Connexion DB: ❌ {e}")
        return False

def test_app_creation():
    """Test de la création de l'application FastAPI"""
    print("\n🚀 Test de la création de l'application...")
    
    try:
        from app.main import app
        print(f"  - App créée: ✅ (routes: {len(app.routes)})")
        
        # Afficher les routes
        for route in app.routes:
            if hasattr(route, 'path'):
                print(f"    • {route.path}")
        
        return True
        
    except Exception as e:
        print(f"  - App création: ❌ {e}")
        traceback.print_exc()
        return False

def test_server_start():
    """Test du démarrage du serveur"""
    print("\n🌐 Test du démarrage du serveur...")
    
    try:
        import uvicorn
        from app.main import app
        
        print("  - uvicorn disponible: ✅")
        print("  - app disponible: ✅")
        
        # Ne pas démarrer réellement, juste vérifier la config
        config = uvicorn.Config(app, host="0.0.0.0", port=8000)
        print("  - config uvicorn: ✅")
        
        return True
        
    except Exception as e:
        print(f"  - Erreur serveur: ❌ {e}")
        traceback.print_exc()
        return False

def main():
    """Fonction principale de diagnostic"""
    print("🔍 DIAGNOSTIC DU SERVEUR FASTAPI")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("Base de données", test_database),
        ("Application FastAPI", test_app_creation),
        ("Configuration serveur", test_server_start)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Erreur critique dans {test_name}: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 RÉSUMÉ DU DIAGNOSTIC")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ RÉUSSI" if result else "❌ ÉCHOUÉ"
        print(f"{test_name:20} : {status}")
        if result:
            passed += 1
    
    print(f"\nRésultats : {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 Tous les tests sont passés!")
        print("✨ Le serveur devrait pouvoir démarrer")
        
        # Essayer de démarrer le serveur
        print("\n🚀 Tentative de démarrage du serveur...")
        try:
            import uvicorn
            from app.main import app
            print("Démarrage sur http://localhost:8000")
            uvicorn.run(app, host="0.0.0.0", port=8000)
        except KeyboardInterrupt:
            print("\n👋 Serveur arrêté par l'utilisateur")
        except Exception as e:
            print(f"❌ Erreur au démarrage: {e}")
    else:
        print("⚠️ Des problèmes ont été détectés")
        print("🔧 Corrigez les erreurs avant de redémarrer le serveur")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
