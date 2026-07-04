import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, CheckCircle, Loader2, MapPin, Type, X,
  AlertCircle, Sparkles, ArrowRight
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCV } from '../context/CVContext';
import api from '../services/api';

const steps = [
  { label: 'Uploading CV', icon: Upload },
  { label: 'Extracting Information', icon: FileText },
  { label: 'AI Analyzing Skills', icon: Sparkles },
  { label: 'Generating Profile', icon: Loader2 },
  { label: 'Matching Careers', icon: CheckCircle },
  { label: 'Searching Jobs', icon: Loader2 },
  { label: 'AI Generating Insights', icon: Sparkles },
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
  const [error, setError] = useState(null);
  const { uploadCV, uploadCVText } = useCV();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 16 * 1024 * 1024,
    multiple: false,
  });

  // File rejection errors
  const fileErrors = fileRejections.map(({ file, errors }) => (
    <div key={file.path} className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-2">
      <AlertCircle className="w-4 h-4 inline mr-1" />
      {file.path}: {errors.map(e => e.message).join(', ')}
    </div>
  ));

  const simulateProgress = () => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCurrentStep(step);
      setProgress(Math.min((step / (steps.length - 1)) * 100, 100));
      if (step >= steps.length - 1) clearInterval(interval);
    }, 700);
    return interval;
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && !file) {
      setError('Please select a file first');
      return;
    }
    if (uploadMode === 'text' && !cvText.trim()) {
      setError('Please paste your CV text first');
      return;
    }

    setUploading(true);
    setError(null);
    const progressInterval = simulateProgress();

    try {
      let result;
      if (uploadMode === 'file') {
        result = await uploadCV(file, location);
      } else {
        result = await uploadCVText(cvText, location);
      }

      clearInterval(progressInterval);

      if (result.success) {
        setCurrentStep(steps.length - 1);
        setProgress(100);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        clearInterval(progressInterval);
        setUploading(false);
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setUploading(false);
      const errorMsg = err.response?.data?.error || err.message || 'Upload failed. Please try again.';
      setError(errorMsg);
    }
  };

  return (
    <div className="section-padding py-8 lg:py-12 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-[#0F172A] mb-3">
          Upload Your <span className="gradient-text">CV</span>
        </h1>
        <p className="text-[#64748B] max-w-md mx-auto">
          Our AI will analyze your resume and extract key information to power your career recommendations.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8"
      >
        {!uploading ? (
          <>
            {/* Upload Mode Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-[#F1F5F9] rounded-xl">
              <button
                onClick={() => { setUploadMode('file'); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  uploadMode === 'file'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Upload size={16} />
                Upload File
              </button>
              <button
                onClick={() => { setUploadMode('text'); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  uploadMode === 'text'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
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
                      ${isDragActive ? 'border-[#2563EB] bg-[#2563EB]/5' : 'border-[#E2E8F0] hover:border-[#2563EB]/50 hover:bg-[#F8FAFC]'}`}
                  >
                    <input {...getInputProps({ id: 'cv-file', name: 'cv' })} />
                    <div className="w-16 h-16 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-[#2563EB]" size={28} />
                    </div>
                    <p className="font-semibold text-[#0F172A] mb-2">
                      {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here'}
                    </p>
                    <p className="text-[#64748B] text-sm mb-4">or click to browse files</p>
                    <p className="text-xs text-[#94A3B8]">Supports PDF and DOCX up to 16MB</p>
                  </div>

                  {fileErrors}

                  {file && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6"
                    >
                      <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                        <FileText className="text-[#2563EB]" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{file.name}</p>
                          <p className="text-xs text-[#94A3B8]">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => setFile(null)}
                          className="text-[#94A3B8] hover:text-red-500 transition-colors p-1"
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
                  <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0]">
                    <label htmlFor="cv-text" className="block text-sm font-medium text-[#0F172A] mb-3 flex items-center gap-2">
                      <Type size={16} className="text-[#64748B]" />
                      Paste Your CV Text
                    </label>
                    <textarea
                      id="cv-text"
                      name="cv_text"
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="w-full h-64 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-200 resize-none"
                      placeholder="Paste your CV content here... Include your skills, experience, education, and any other relevant information."
                    />
                    <p className="text-xs text-[#94A3B8] mt-2">
                      Tip: Copy and paste the full text from your CV for best AI analysis results.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location Input */}
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-[#0F172A] mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-[#64748B]" />
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
                />
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-4"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyze My CV
              </button>
            </div>
          </>
        ) : (
          /* Uploading State */
          <div className="py-8 text-center">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="url(#progress-gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.64} 264`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#2563EB]">{Math.round(progress)}%</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
              {steps[currentStep]?.label || 'Processing...'}
            </h3>
            <p className="text-sm text-[#94A3B8] mb-8">
              Our AI is analyzing your CV. This may take a moment.
            </p>

            <div className="space-y-3 max-w-sm mx-auto">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      isActive ? 'bg-[#2563EB]/10 border border-[#2563EB]/20' :
                      isDone ? 'bg-emerald-50 border border-emerald-100' :
                      'bg-[#F8FAFC] border border-transparent opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-[#2563EB] text-white' :
                      isDone ? 'bg-emerald-500 text-white' :
                      'bg-[#E2E8F0] text-[#94A3B8]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-[#2563EB]' :
                      isDone ? 'text-emerald-700' :
                      'text-[#94A3B8]'
                    }`}>
                      {step.label}
                    </span>
                    {isDone && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                    {isActive && <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}