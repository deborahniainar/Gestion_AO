from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
import logging
import traceback
import json
import requests
import time
import random
import string
import re
import pdfplumber
import pytesseract
import spacy
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
