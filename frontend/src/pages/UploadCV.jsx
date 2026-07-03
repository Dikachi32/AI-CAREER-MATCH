import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, Loader2, MapPin, Type, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { uploadCV } from '../services/api';
import { useCV } from '../context/CVContext';

const steps = [
  { label: 'Uploading CV', icon: Upload },
  { label: 'Extracting Information', icon: FileText },
  { label: 'Analyzing Skills', icon: Loader2 },
  { label: 'Matching Careers', icon: CheckCircle },
  { label: 'Searching Jobs', icon: Loader2 },
  { label: 'Generating Insights', icon: CheckCircle },
  { label: 'Completed', icon: CheckCircle },
];

export default function UploadCV() {
  const [file, setFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [location, setLocation] = useState('');
  const [uploadMode, setUploadMode] = useState('file');
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const { setCvData, setExtractedInfo } = useCV();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxSize: 16 * 1024 * 1024,
    multiple: false,
  });

  const simulateProgress = () => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCurrentStep(step);
      setProgress(Math.min((step / (steps.length - 1)) * 100, 100));
      if (step >= steps.length - 1) clearInterval(interval);
    }, 800);
    return interval;
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && !file) {
      alert('Please select a file first');
      return;
    }
    if (uploadMode === 'text' && !cvText.trim()) {
      alert('Please paste your CV text first');
      return;
    }

    setUploading(true);
    const progressInterval = simulateProgress();

    try {
      let res;
      if (uploadMode === 'file') {
        const formData = new FormData();
        formData.append('cv', file);
        if (location) formData.append('location', location);
        res = await uploadCV(formData);
      } else {
        res = await uploadCV({ cv_text: cvText });
      }

      clearInterval(progressInterval);
      setCurrentStep(steps.length - 1);
      setProgress(100);
      
      // FIX: Persist full response to localStorage so Recommendations page can access it
      const fullData = res.data;
      localStorage.setItem('cvData', JSON.stringify(fullData));
      
      setCvData(fullData);
      setExtractedInfo({
        ...fullData.extracted_info,
        technical_skills: fullData.extracted_skills?.technical,
        soft_skills: fullData.extracted_skills?.soft,
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      clearInterval(progressInterval);
      setUploading(false);
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.message 
        || err.message 
        || 'Upload failed. Please try again.';
      alert(`Upload failed: ${errorMsg}`);
    }
  };

  return (
    <div className="section-padding py-8 lg:py-12 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-3">
          Upload Your <span className="gradient-text">CV</span>
        </h1>
        <p className="text-secondary max-w-md mx-auto">
          Our AI will analyze your resume and extract key information to power your career recommendations.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl shadow-card border border-border p-6 lg:p-8"
      >
        {!uploading ? (
          <>
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
              <button
                onClick={() => setUploadMode('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  uploadMode === 'file' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <Upload size={16} />
                Upload File
              </button>
              <button
                onClick={() => setUploadMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  uploadMode === 'text' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <Type size={16} />
                Paste Text
              </button>
            </div>

            <AnimatePresence mode="wait">
              {uploadMode === 'file' ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center cursor-pointer transition-all duration-300
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted'}`}
                  >
                    <input {...getInputProps({ id: 'cv-file', name: 'cv' })} />
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-primary" size={28} />
                    </div>
                    <p className="font-display font-semibold text-dark mb-2">
                      {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here'}
                    </p>
                    <p className="text-secondary text-sm mb-4">or click to browse files</p>
                    <p className="text-xs text-secondary">Supports PDF and DOCX up to 16MB</p>
                  </div>

                  {file && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6"
                    >
                      <div className="flex items-center gap-3 bg-muted rounded-xl p-4">
                        <FileText className="text-primary" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark truncate">{file.name}</p>
                          <p className="text-xs text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button 
                          onClick={() => setFile(null)}
                          className="text-secondary hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-muted rounded-2xl p-6">
                    <label htmlFor="cv-text" className="block text-sm font-medium text-dark mb-3 flex items-center gap-2">
                      <Type size={16} className="text-secondary" />
                      Paste Your CV Text
                    </label>
                    <textarea
                      id="cv-text"
                      name="cv_text"
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="w-full h-64 px-4 py-3 rounded-xl border border-border bg-white text-dark placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                      placeholder="Paste your CV content here... Include your skills, experience, education, and any other relevant information."
                    />
                    <p className="text-xs text-secondary mt-2">
                      Tip: Copy and paste the full text from your CV for best results.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-dark mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-secondary" />
                  Preferred Location (Optional)
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Lagos, Nigeria or Remote"
                  autoComplete="off"
                />
              </div>

              <button
                onClick={handleUpload}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                {uploadMode === 'file' ? 'Analyze My CV' : 'Analyze Text'}
              </button>
            </div>
          </>
        ) : (
          <div className="py-8">
            <div className="relative mb-8">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-center mt-3 font-display font-bold text-2xl text-dark">{Math.round(progress)}%</p>
            </div>

            <div className="space-y-4">
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === currentStep;
                const isComplete = i < currentStep;
                
                return (
                  <motion.div
                    key={step.label}
                    initial={false}
                    animate={{ 
                      opacity: isActive ? 1 : isComplete ? 0.6 : 0.3,
                      x: isActive ? 0 : isComplete ? 0 : -10
                    }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300
                      ${isComplete ? 'bg-success/10 text-success' : isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-secondary'}`}>
                      {isComplete ? <CheckCircle size={20} /> : <StepIcon size={20} className={isActive ? 'animate-spin' : ''} />}
                    </div>
                    <span className={`font-medium ${isActive ? 'text-dark' : 'text-secondary'}`}>
                      {step.label}
                    </span>
                    {isComplete && <CheckCircle size={16} className="text-success ml-auto" />}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}