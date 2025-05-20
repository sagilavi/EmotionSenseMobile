import React, { createContext, useContext, useState, ReactNode } from 'react';

type AppContextType = {
  analyzing: boolean;
  setAnalyzing: (val: boolean) => void;
  frequency: number;
  setFrequency: (val: number) => void;
  duration: number;
  setDuration: (val: number) => void;
  emotionData: any[];
  setEmotionData: (val: any[]) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [frequency, setFrequency] = useState(5);
  const [duration, setDuration] = useState(20);
  const [emotionData, setEmotionData] = useState<any[]>([]);

  return (
    <AppContext.Provider value={{ analyzing, setAnalyzing, frequency, setFrequency, duration, setDuration, emotionData, setEmotionData }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
} 