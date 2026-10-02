"use client";

import { createContext, useContext, useState } from "react";

export const languages = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "TypeScript", value: "typescript" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Java", value: "java" },
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
  { label: "C#", value: "csharp" },
  { label: "SQL", value: "sql" },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("javascript");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
