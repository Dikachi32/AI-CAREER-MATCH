import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const CVContext = createContext();

export function CVProvider({ children }) {
  const [cvData, setCvData] = useState(() => {
    const saved = localStorage.getItem('careermatch_cv');
    return saved ? JSON.parse(saved) : null;
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadCV = useCallback(async (file, location = '') => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('cv', file);
      if (location) formData.append('location', location);

      const res = await api.post('/upload_cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      const data = res.data;
      const enriched = {
        ...data,
        uploadedAt: new Date().toISOString(),
        fileName: file.name
      };

      setCvData(enriched);
      localStorage.setItem('careermatch_cv', JSON.stringify(enriched));
      return { success: true, data: enriched };
    } catch (err) {
      const msg = err.response?.data?.error || 'CV upload failed';
      setUploadError(msg);
      return { success: false, error: msg };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const uploadCVText = useCallback(async (text, location = '') => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await api.post('/upload_cv', { cv_text: text, location });
      const data = res.data;
      const enriched = {
        ...data,
        uploadedAt: new Date().toISOString(),
        fileName: 'pasted-text.txt'
      };

      setCvData(enriched);
      localStorage.setItem('careermatch_cv', JSON.stringify(enriched));
      return { success: true, data: enriched };
    } catch (err) {
      const msg = err.response?.data?.error || 'CV processing failed';
      setUploadError(msg);
      return { success: false, error: msg };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearCV = useCallback(() => {
    setCvData(null);
    localStorage.removeItem('careermatch_cv');
  }, []);

  const value = {
    cvData,
    isUploading,
    uploadError,
    uploadProgress,
    hasCV: !!cvData,
    uploadCV,
    uploadCVText,
    clearCV
  };

  return (
    <CVContext.Provider value={value}>
      {children}
    </CVContext.Provider>
  );
}

export function useCV() {
  const context = useContext(CVContext);
  if (!context) {
    throw new Error('useCV must be used within a CVProvider');
  }
  return context;
}