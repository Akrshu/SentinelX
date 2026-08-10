import { useRef, useState } from "react";
import { FileUp, LoaderCircle } from "lucide-react";
import { uploadLog } from "@/api/sentinelApi";
import type { UploadLogResponse } from "@/types/investigation";

interface LogUploadProps {
  onUploaded: (response: UploadLogResponse) => void;
}

export function LogUpload({ onUploaded }: LogUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const response = await uploadLog(file);
      onUploaded(response);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to upload log file";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        accept=".log,.txt,.json,.csv"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3.5 py-2.5 text-xs font-bold text-[#06111e] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
      >
        {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
        {isUploading ? "Uploading" : "Upload log"}
      </button>
      {error && <p className="mt-2 max-w-[220px] text-right text-[10px] leading-4 text-rose-300">{error}</p>}
    </>
  );
}
