"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/LanguageContext";
import { emit, on } from "@/lib/socket";

export default function CodeEditor() {
  const [code, setCode] = useState("// Start writing your code...");
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const debounceRef = useRef(null);
  const remoteCodeRef = useRef(null);

  const handleChange = (value) => {
    const next = value || "";
    setCode(next);

    if (remoteCodeRef.current === next) {
      remoteCodeRef.current = null;
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      emit("code:change", next);
    }, 500);
  };

  useEffect(() => {
    const onUpdate = (next) => {
      if (typeof next !== "string") return;
      remoteCodeRef.current = next;
      setCode(next);
    };

    const unsubscribe = on("code:update", onUpdate);

    return () => {
      clearTimeout(debounceRef.current);
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="min-h-0 flex-1 [&_.monaco-editor]:cursor-default [&_.monaco-editor_.view-lines]:cursor-default [&_.monaco-editor_.view-line]:cursor-default">
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={code}
          onChange={handleChange}
          theme={resolvedTheme === "light" ? "light" : "vs-dark"}
          options={{
            minimap: {
              enabled: false,
            },
            fontSize: 14,
            automaticLayout: true,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}