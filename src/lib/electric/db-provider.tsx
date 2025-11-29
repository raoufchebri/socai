'use client';

// TODO: Electric sync feature - requires @tanstack/react-db package
// This is a stub implementation until dependencies are installed

import { createContext, useContext, ReactNode } from 'react';

// Stub types
interface DBCollections {
  surveys: unknown;
  categories: unknown;
  questions: unknown;
  surveyQuestions: unknown;
  sessions: unknown;
  responses: unknown;
}

interface DBType {
  collections: DBCollections;
}

const DBContext = createContext<DBType | null>(null);

export function DBProvider({ children }: { children: ReactNode }) {
  // Stub - returns null database
  return (
    <DBContext.Provider value={null}>
      {children}
    </DBContext.Provider>
  );
}

export function useDB(): DBType {
  const context = useContext(DBContext);
  if (!context) {
    throw new Error('useDB must be used within a DBProvider. Note: Electric sync is not yet implemented.');
  }
  return context;
}

// Stub db export
export const db: DBType = {
  collections: {
    surveys: null,
    categories: null,
    questions: null,
    surveyQuestions: null,
    sessions: null,
    responses: null,
  },
};
