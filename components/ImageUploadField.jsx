"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/lib/actions";

export default function ImageUploadField({ name, label, defaultValue }) {
  const [url, setUrl] = useState(defaultValue || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadImage(fd);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setUrl(result.url);
  }

  return (
    <div className="pi-image-upload-field">
      {label ? <label className="pi-image-upload-label">{label}</label> : null}
      <input type="hidden" name={name} value={url} />
      <div className="pi-image-upload-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Pega una URL, o sube un archivo →"
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Subiendo..." : "Subir foto"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
      {error ? <div className="pi-error" style={{ fontSize: 12, marginTop: 4 }}>{error}</div> : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Vista previa" className="pi-image-upload-preview" />
      ) : null}
    </div>
  );
}
