# PyInstaller hook pour inclure FastAPI et ses dépendances

from PyInstaller.utils.hooks import collect_submodules, collect_data_files

hiddenimports = collect_submodules('fastapi')
hiddenimports += collect_submodules('starlette')
hiddenimports += collect_submodules('pydantic')

datas = collect_data_files('fastapi')
datas += collect_data_files('starlette')
datas += collect_data_files('pydantic')
datas += collect_data_files('uvicorn')
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('sqlalchemy')