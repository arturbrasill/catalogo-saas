'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
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
      e.target.value = ''; // reseta input para permitir reenvio
    }
  };

  const handleRemove = (index: number) => {
    const filtered = value.filter((_, i) => i !== index);
    onChange(filtered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Imagens do Produto
        </label>
        <span className="text-xs text-gray-500">
          A primeira imagem será usada como capa.
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Grid de Imagens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {value.map((url, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto ${idx + 1}`}
              className="h-full w-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                Capa
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              disabled={disabled}
              className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
              title="Remover imagem"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Botão de Upload */}
        <label
          className={`flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition ${
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
              <span className="text-xs font-medium">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-gray-500">
              <Upload className="w-6 h-6" />
              <span className="text-xs font-medium">Adicionar Foto</span>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
