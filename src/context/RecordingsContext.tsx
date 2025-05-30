import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AcousticFeatures } from '../AcousticFeatures';

export interface RecordingItem {
  path: string;
  length: number;
  date: string;
  time: string;
}

interface RecordingsContextType {
  recordings: RecordingItem[];
  addRecording: (item: RecordingItem) => void;
}

const RecordingsContext = createContext<RecordingsContextType | undefined>(undefined);

export const RecordingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);

  const addRecording = (item: RecordingItem) => {
    setRecordings(prev => [...prev, item]);
  };

  return (
    <RecordingsContext.Provider value={{ recordings, addRecording }}>
      {children}
    </RecordingsContext.Provider>
  );
};

export const useRecordings = () => {
  const context = useContext(RecordingsContext);
  if (!context) throw new Error('useRecordings must be used within RecordingsProvider');
  return context;
};

// --- Acoustic Features Context ---

interface FeaturesContextType {
  features: AcousticFeatures[];
  addFeatures: (features: AcousticFeatures) => void;
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export const FeaturesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<AcousticFeatures[]>([]);

  const addFeatures = (feature: AcousticFeatures) => {
    setFeatures(prev => [...prev, feature]);
  };

  return (
    <FeaturesContext.Provider value={{ features, addFeatures }}>
      {children}
    </FeaturesContext.Provider>
  );
};

export const useFeatures = () => {
  const context = useContext(FeaturesContext);
  if (!context) throw new Error('useFeatures must be used within FeaturesProvider');
  return context;
}; 