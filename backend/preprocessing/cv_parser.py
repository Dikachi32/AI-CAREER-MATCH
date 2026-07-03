import pdfplumber
from docx import Document
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import string

nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text

def extract_text_from_docx(file_path):
    try:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""

def extract_name(text):
    lines = text.split('\n')[:10]
    for line in lines:
        line = line.strip()
        if len(line) > 3 and len(line) < 50 and re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$', line):
            return line
    return None

def extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

def extract_phone(text):
    patterns = [
        r'(\+\d{1,3}[-.\s]??\d{1,4}[-.\s]??\d{1,4}[-.\s]??\d{1,4})',
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None

def extract_location(text):
    location_patterns = [
        r'(?:Location|Address|Based in|City)[:\s]+([A-Za-z\s,]+(?:\d{5})?)',
        r'([A-Za-z\s]+,\s*(?:Nigeria|USA|UK|Canada|India|Germany|France|Remote))'
    ]
    for pattern in location_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None

def extract_years_experience(text):
    patterns = [
        r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
        r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience',
        r'experience[:\s]+(\d+)\+?\s*years?'
    ]
    years = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        years.extend([int(m) for m in matches])
    return max(years) if years else None

def extract_education(text):
    degrees = []
    edu_patterns = [
        r'(B\.?Sc|B\.?A|M\.?Sc|M\.?A|Ph\.?D|MBA|Bachelor|Master|Doctorate)[\s\w]*(?:in|of)?[\s\w]*',
        r'(Bachelor|Master|Doctorate|Diploma|Certificate)[\s\w]*(?:of|in)?[\s\w]*(?:Science|Arts|Engineering|Technology|Computer|Business)?'
    ]
    for pattern in edu_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        degrees.extend(matches)
    return ', '.join(list(set(degrees))) if degrees else None

def extract_job_title(text):
    title_patterns = [
        r'(?:Current\s*(?:Role|Position)|Job\s*Title)[:\s]+([A-Za-z\s]+)',
        r'([A-Za-z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Scientist|Architect|Consultant|Director|Lead|Head|Specialist|Coordinator))'
    ]
    for pattern in title_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None

def extract_current_company(text):
    company_patterns = [
        r'(?:at|with|@)\s+([A-Z][A-Za-z0-9\s&]+)',
        r'(?:Company|Employer|Organization)[:\s]+([A-Za-z\s]+)'
    ]
    for pattern in company_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    return None

def extract_certifications(text):
    cert_patterns = [
        r'(AWS\s*Certified|Azure\s*Certified|Google\s*Cloud\s*Certified|CCNA|CCNP|PMP|CISSP|CEH|CompTIA\s*\w+|Scrum\s*Master|ITIL|TOEFL|IELTS|GMAT|GRE|Oracle\s*Certified|Microsoft\s*Certified)[\s\w]*'
    ]
    certs = []
    for pattern in cert_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        certs.extend(matches)
    return list(set(certs)) if certs else []

def clean_text(text):
    text = text.lower()
    text = re.sub(r'\d+', ' ', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = word_tokenize(text)
    stop_words = set(stopwords.words('english'))
    tokens = [w for w in tokens if w not in stop_words and len(w) > 2]
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(w) for w in tokens]
    return ' '.join(tokens)

def parse_cv(file_path, file_type):
    if file_type == 'pdf':
        raw = extract_text_from_pdf(file_path)
    elif file_type == 'docx':
        raw = extract_text_from_docx(file_path)
    else:
        raise ValueError("Unsupported file type")
    
    cleaned = clean_text(raw)
    
    extracted_info = {
        'full_name': extract_name(raw),
        'email': extract_email(raw),
        'phone': extract_phone(raw),
        'location': extract_location(raw),
        'years_experience': extract_years_experience(raw),
        'education': extract_education(raw),
        'latest_job_title': extract_job_title(raw),
        'current_company': extract_current_company(raw),
        'certifications': extract_certifications(raw)
    }
    
    return {
        'raw_text': raw,
        'cleaned_text': cleaned,
        'extracted_info': extracted_info
    }