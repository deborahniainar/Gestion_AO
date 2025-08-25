def extract_text_from_pdf(path: str) -> str:
    """Extract text from PDF file using PyMuPDF with OCR fallback."""
    try:
        import fitz  # PyMuPDF
        
        with fitz.open(path) as pdf:
            text = ""
            # Extract text from all pages
            for i in range(pdf.page_count):
                page = pdf.load_page(i)
                page_text = page.get_text()
                text += page_text + "\n"
            
            # If little text extracted, try OCR (if available)
            if len(text.strip()) < 500:
                try:
                    import pytesseract
                    from PIL import Image
                    
                    ocr_text = []
                    with fitz.open(path) as pdf:
                        for i in range(pdf.page_count):
                            page = pdf.load_page(i)
                            pix = page.get_pixmap(dpi=300)  # High resolution for OCR
                            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                            ocr_text.append(pytesseract.image_to_string(img, lang="fra+eng"))
                    
                    text = "\n".join(ocr_text)
                except ImportError:
                    # OCR not available, return what we have
                    pass
                except Exception:
                    # OCR failed, return what we have
                    pass
                    
            return text.strip()
            
    except ImportError:
        print("PyMuPDF not available for PDF processing")
        return ""
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

