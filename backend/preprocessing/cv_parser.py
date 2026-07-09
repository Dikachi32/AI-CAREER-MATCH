"""
CV Text Extraction Module.
Responsibility: Extract raw text from PDF and DOCX files ONLY.
All intelligent parsing is handled by the Gemini service.
"""

import pdfplumber
from docx import Document


def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF file."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"[cv_parser] PDF extraction error: {e}")
    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    """Extract raw text from a DOCX file."""
    try:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    except Exception as e:
        print(f"[cv_parser] DOCX extraction error: {e}")
        return ""


def parse_cv(file_path: str, file_type: str) -> dict:
    """
    Parse a CV file and return raw text only.
    Args:
        file_path: Path to the uploaded file
        file_type: 'pdf' or 'docx'
    Returns:
        dict with 'raw_text' key containing the full document text
    """
    if file_type == 'pdf':
        raw = extract_text_from_pdf(file_path)
    elif file_type == 'docx':
        raw = extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

    return {
        'raw_text': raw
    }