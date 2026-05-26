"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import clsx from "clsx";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateAndSetFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      setSelectedFile(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const handleSubmit = useCallback(() => {
    if (selectedFile) onFileSelect(selectedFile);
  }, [selectedFile, onFileSelect]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={clsx(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/30"
            : selectedFile
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20"
            : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <FileText className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={disabled}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-1.5 text-xs font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                Analyze Contract
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
              <Upload className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <span className="text-indigo-600 dark:text-indigo-400">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                PDF only, up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
