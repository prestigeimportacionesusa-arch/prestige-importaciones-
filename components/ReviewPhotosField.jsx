"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/lib/actions";

const MAX_PHOTOS = 3;

export default function ReviewPhotosField() {
  const [photos, setPhotos] = useState([]); // array de URLs ya subidas
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
    e.target.value = ""; // permite volver a elegir el mismo archivo si se quita y se agrega de nuevo
    if (result.error) {
      setError(result.error);
      return;
    }
    setPhotos((prev) => [...prev, result.url].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="pi-review-photos-field">
      {photos.map((url, i) => (
        <input key={url} type="hidden" name={`foto_${i}`} value={url} />
      ))}
      <label className="pi-image-upload-label">Fotos del producto que recibiste (opcional, hasta {MAX_PHOTOS})</label>
      <div className="pi-review-photos-row">
        {photos.map((url, i) => (
          <div key={url} className="pi-review-photo-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${i + 1}`} />
            <button type="button" className="pi-review-photo-remove" onClick={() => removePhoto(i)} aria-label="Quitar foto">×</button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Subiendo..." : "+ Subir foto"}
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
      {error ? <div className="pi-error" style={{ fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}
