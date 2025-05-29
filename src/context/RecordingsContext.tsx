import React, { createContext, useContext, useState, ReactNode } from 'react';

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