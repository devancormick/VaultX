"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/utils";

const ACCEPTED = {
  "model/gltf-binary": [".glb"],
  "model/gltf+json": [".gltf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/octet-stream": [".glb", ".hdr"],
};

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function AssetUploader() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setStatus("idle");
      setErrorMessage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
  });

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      await new Promise<void>((resolve, reject) => {
        xhr.open("POST", "/api/assets/upload");
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(xhr.responseText));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      setStatus("success");
      toast({ title: "Asset uploaded", description: file.name, variant: "success" });

      setTimeout(() => {
        setOpen(false);
        setFile(null);
        setStatus("idle");
        window.location.reload();
      }, 1500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4" /> Upload Asset
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Upload Asset"
        description="Supported: GLB, GLTF, PNG, JPG, HDR"
      >
        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">
                {isDragActive ? "Drop the file here..." : "Drag & drop a file, or click to browse"}
              </p>
              <p className="text-xs text-muted/60 mt-1">GLB, GLTF, PNG, JPG, HDR — max 500MB</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">{file.name}</p>
                <p className="text-xs text-muted mt-0.5">{formatBytes(file.size)}</p>
              </div>
              {status === "idle" && (
                <button onClick={() => setFile(null)} className="text-muted hover:text-danger transition-colors">
                  <X className="w-4 h-4" aria-label="Remove file" />
                </button>
              )}
              {status === "success" && <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />}
              {status === "error" && <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />}
            </div>
          )}

          {status === "uploading" && (
            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={status === "uploading"}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || status === "uploading" || status === "success"}
              loading={status === "uploading"}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
