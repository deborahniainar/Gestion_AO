# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

# Inclure tout le dossier app
datas = collect_data_files('app', include_py_files=True)

# Inclure FastAPI et ses dépendances
hiddenimports = []
hiddenimports += collect_submodules('fastapi')
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('starlette')
hiddenimports += collect_submodules('pydantic')
hiddenimports += collect_submodules('pydantic_settings')
hiddenimports += collect_submodules('sqlalchemy')
hiddenimports += collect_submodules('jose')
hiddenimports += collect_submodules('databases')
hiddenimports += collect_submodules('psycopg2')
hiddenimports += collect_submodules('python_multipart')
hiddenimports += collect_submodules('fitz')        # PyMuPDF
hiddenimports += collect_submodules('pytesseract')
hiddenimports += collect_submodules('spacy')
hiddenimports += collect_submodules('transformers')
hiddenimports += collect_submodules('docx')        # python-docx
hiddenimports += collect_submodules('reportlab')
hiddenimports += collect_submodules('celery')
hiddenimports += collect_submodules('redis')
hiddenimports += collect_submodules('email_validator')
hiddenimports += collect_submodules('passlib')
hiddenimports += collect_submodules('requests')
hiddenimports += collect_submodules('PIL')         # Pillow
hiddenimports += collect_submodules('openai')
hiddenimports += collect_submodules('dotenv')      # python-dotenv
hiddenimports += collect_submodules('nltk')
hiddenimports += collect_submodules('dateutil')
hiddenimports += collect_submodules('langdetect')
hiddenimports += collect_submodules('textblob')
hiddenimports += collect_submodules('regex')
hiddenimports += collect_submodules('html2docx')  # include html2docx so the frozen app contains the html2docx module used by app/api/dao.py
hiddenimports += collect_submodules('bs4')  # ensure beautifulsoup4 (bs4) is bundled for HTML fallback


a = Analysis(
    ['run_backend.py'],
    pathex=[os.path.abspath('.')],
    binaries=[],
    datas=[('app', 'app')],
    hiddenimports=hiddenimports,
    hookspath=[os.path.abspath('hooks')],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='run_backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
