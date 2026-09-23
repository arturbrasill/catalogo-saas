'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Star, Link as LinkIcon, Plus } from 'lucide-react';
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
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

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

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setErrorMessage('Por favor, informe uma URL válida iniciando com https://');
      return;
    }

    if (value.includes(trimmed)) {
      setErrorMessage('Esta imagem já foi adicionada.');
      return;
    }

    setErrorMessage(null);
    onChange([...value, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (index: number) => {
    const filtered = value.filter((_, i) => i !== index);
    onChange(filtered);
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const target = value[index];
    if (!target) return;
    const remaining = value.filter((_, i) => i !== index);
    onChange([target, ...remaining]);
  };

  const coverImage = value[0];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            Fotos e Galeria do Produto
          </label>
          <span className="text-[11px] text-slate-500">
            A primeira imagem é a capa na vitrine. Você pode adicionar fotos do computador ou colar URLs.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline transition cursor-pointer"
          >
            {showUrlInput ? 'Ocultar URL' : '+ Adicionar por URL'}
          </button>
        </div>
      </div>

      {/* Input de URL direta */}
      {showUrlInput && (
        <div className="flex gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs animate-fade-in">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="url"
              placeholder="Cole a URL direta da imagem (ex: https://dominio.com/foto.jpg)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
          >
            Inserir
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 animate-shake">
          {errorMessage}
        </div>
      )}

      {/* Preview em Tempo Real em Destaque */}
      {coverImage ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Preview em tempo real"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-1.5 left-1.5 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              Capa
            </span>
          </div>

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold text-slate-900 block">
              Pré-visualização da Capa do Produto
            </span>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Esta é a imagem principal que será exibida para os clientes no catálogo digital.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px]">
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                Pronta para exibição
              </span>
              <button
                type="button"
                onClick={() => handleRemove(0)}
                disabled={disabled}
                className="text-rose-600 hover:text-rose-800 font-medium hover:underline cursor-pointer"
              >
                Remover capa
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-1">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Nenhuma foto adicionada ainda</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Faça upload do arquivo abaixo ou cole uma URL para ver o preview em tempo real.
          </p>
        </div>
      )}

      {/* Grid de Miniaturas da Galeria */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
        {value.map((url, idx) => (
          <div
            key={idx}
            className={`group relative aspect-square rounded-xl border overflow-hidden bg-slate-100 shadow-2xs hover:shadow-md transition ${
              idx === 0 ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto ${idx + 1}`}
              className="h-full w-full object-cover"
            />

            {idx === 0 ? (
              <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                Capa
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSetCover(idx)}
                className="absolute bottom-1 left-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                title="Tornar capa"
              >
                Fazer Capa
              </button>
            )}

            <button
              type="button"
              onClick={() => handleRemove(idx)}
              disabled={disabled}
              className="absolute top-1 right-1 rounded-md bg-slate-900/80 p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition cursor-pointer"
              title="Remover foto"
              aria-label={`Remover foto ${idx + 1}`}
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        ))}

        {/* Botão de Upload */}
        <label
          className={`flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-100/50 cursor-pointer transition ${
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
            <div className="flex flex-col items-center gap-1 text-slate-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[10px] font-semibold">Subindo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-500">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold">+ Upload</span>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
