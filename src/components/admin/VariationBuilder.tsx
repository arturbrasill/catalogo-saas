'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X, Tag } from 'lucide-react';
import type { VariationOption } from '@/types';

interface VariationBuilderProps {
  value: VariationOption[];
  onChange: (variations: VariationOption[]) => void;
  disabled?: boolean;
}

export function VariationBuilder({
  value = [],
  onChange,
  disabled = false,
}: VariationBuilderProps) {
  const [newTypeName, setNewTypeName] = useState('');
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    // Evita tipos duplicados
    if (value.some((v) => v.tipo.toLowerCase() === trimmed.toLowerCase())) {
      alert('Já existe uma variação com este nome.');
      return;
    }

    onChange([...value, { tipo: trimmed, opcoes: [] }]);
    setNewTypeName('');
  };

  const handleRemoveType = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddOption = (typeIndex: number) => {
    const optionText = (optionInputs[typeIndex] || '').trim();
    if (!optionText) return;

    const currentType = value[typeIndex];
    if (!currentType) return;

    if (currentType.opcoes.includes(optionText)) {
      alert('Esta opção já foi adicionada.');
      return;
    }

    const updated = [...value];
    updated[typeIndex] = {
      ...currentType,
      opcoes: [...currentType.opcoes, optionText],
    };

    onChange(updated);
    setOptionInputs((prev) => ({ ...prev, [typeIndex]: '' }));
  };

  const handleRemoveOption = (typeIndex: number, optionIndex: number) => {
    const currentType = value[typeIndex];
    if (!currentType) return;

    const updated = [...value];
    updated[typeIndex] = {
      ...currentType,
      opcoes: currentType.opcoes.filter((_, i) => i !== optionIndex),
    };

    onChange(updated);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            Variações do Produto (Tamanho, Cor, Modelo)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Crie atributos que o cliente precisará escolher antes de enviar o pedido.
          </p>
        </div>
      </div>

      {/* Lista de Variações Existentes */}
      <div className="space-y-3">
        {value.map((variation, typeIndex) => (
          <div
            key={typeIndex}
            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900">
                {variation.tipo}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveType(typeIndex)}
                disabled={disabled}
                className="text-slate-400 hover:text-rose-600 p-1 transition rounded-lg"
                title="Remover variação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Chips de Opções */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {variation.opcoes.length === 0 ? (
                <span className="text-[11px] text-amber-700 italic">
                  Nenhuma opção cadastrada. Digite abaixo para adicionar.
                </span>
              ) : (
                variation.opcoes.map((opcao, optIndex) => (
                  <span
                    key={optIndex}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs"
                  >
                    {opcao}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(typeIndex, optIndex)}
                      disabled={disabled}
                      className="hover:text-rose-600 focus:outline-none ml-0.5"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Input para Nova Opção */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Nova opção para ${variation.tipo} (ex: P, Preto)...`}
                value={optionInputs[typeIndex] || ''}
                onChange={(e) =>
                  setOptionInputs((prev) => ({
                    ...prev,
                    [typeIndex]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption(typeIndex);
                  }
                }}
                disabled={disabled}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddOption(typeIndex)}
                disabled={disabled}
                className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input para Criar Novo Tipo de Variação */}
      <div className="flex gap-2 pt-2 border-t border-slate-200">
        <input
          type="text"
          placeholder="Nome da variação (ex: Tamanho, Cor, Voltagem)..."
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddType();
            }
          }}
          disabled={disabled}
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
        />
        <button
          type="button"
          onClick={handleAddType}
          disabled={disabled || !newTypeName.trim()}
          className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova Variação
        </button>
      </div>
    </div>
  );
}
