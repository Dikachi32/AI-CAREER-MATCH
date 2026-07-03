import { createContext, useContext, useState } from 'react';

const CVContext = createContext();

export function CVProvider({ children }) {
  const [cvData, setCvDataState] = useState(() => {
    const saved = localStorage.getItem('cvData');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [extractedInfo, setExtractedInfoState] = useState(() => {
    const saved = localStorage.getItem('extractedInfo');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [recommendations, setRecommendationsState] = useState(() => {
    const saved = localStorage.getItem('recommendations');
    return saved ? JSON.parse(saved) : null;
  });

  const setCvData = (data) => {
    setCvDataState(data);
    if (data) localStorage.setItem('cvData', JSON.stringify(data));
    else localStorage.removeItem('cvData');
  };

  const setExtractedInfo = (info) => {
    setExtractedInfoState(info);
    if (info) localStorage.setItem('extractedInfo', JSON.stringify(info));
    else localStorage.removeItem('extractedInfo');
  };

  const setRecommendations = (recs) => {
    setRecommendationsState(recs);
    if (recs) localStorage.setItem('recommendations', JSON.stringify(recs));
    else localStorage.removeItem('recommendations');
  };

  const clearCV = () => {
    setCvDataState(null);
    setExtractedInfoState(null);
    setRecommendationsState(null);
    localStorage.removeItem('cvData');
    localStorage.removeItem('extractedInfo');
    localStorage.removeItem('recommendations');
  };

  return (
    <CVContext.Provider value={{ 
      cvData, setCvData, 
      extractedInfo, setExtractedInfo,
      recommendations, setRecommendations,
      clearCV 
    }}>
      {children}
    </CVContext.Provider>
  );
}

export function useCV() {
  return useContext(CVContext);
}