'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Star } from 'lucide-react';
import { imageUploadService } from '@/lib/imageUploadService';

interface ImageUploaderProps {
  value: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

export function ImageUploader({
  value = [],
  onChange,
  disabled = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const validation = imageUploadService.validate(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        const url = await imageUploadService.upload(file);
        uploadedUrls.push(url);
      }

      onChange([...value, ...uploadedUrls]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar imagem.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const filtered = value.filter((_, i) => i !== index);
    onChange(filtered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Galeria de Fotos do Produto
        </label>
        <span className="text-[11px] text-slate-400">
          A 1ª imagem será a capa do card.
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
          {errorMessage}
        </div>
      )}

      {/* Grid de Imagens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {value.map((url, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs hover:shadow-md transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto ${idx + 1}`}
              className="h-full w-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Capa
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              disabled={disabled}
              className="absolute top-2 right-2 rounded-full bg-slate-950/70 backdrop-blur-xs p-1.5 text-white opacity-0 group-hover:opacity-100 transition hover:bg-rose-600 cursor-pointer"
              title="Remover imagem"
              aria-label="Remover foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Botão de Upload */}
        <label
          className={`flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition ${
            disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="sr-only"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5 text-emerald-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-bold">Adicionar Foto</span>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
