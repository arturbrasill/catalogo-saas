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
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-emerald-600" />
            Variações do Produto
          </h4>
          <p className="text-xs text-gray-500">
            Adicione características configuráveis como Tamanho, Cor ou Modelo.
          </p>
        </div>
      </div>

      {/* Lista de Variações Existentes */}
      <div className="space-y-3">
        {value.map((variation, typeIndex) => (
          <div
            key={typeIndex}
            className="rounded-md border border-gray-200 bg-white p-3 shadow-sm transition hover:border-gray-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-800">
                {variation.tipo}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveType(typeIndex)}
                disabled={disabled}
                className="text-gray-400 hover:text-red-600 p-1 transition rounded"
                title="Remover variação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Chips de Opções */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {variation.opcoes.length === 0 ? (
                <span className="text-xs text-amber-600 italic">
                  Nenhuma opção cadastrada. Adicione pelo menos uma abaixo.
                </span>
              ) : (
                variation.opcoes.map((opcao, optIndex) => (
                  <span
                    key={optIndex}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200"
                  >
                    {opcao}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(typeIndex, optIndex)}
                      disabled={disabled}
                      className="hover:text-emerald-950 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
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
                className="flex-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddOption(typeIndex)}
                disabled={disabled}
                className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input para Criar Novo Tipo de Variação */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
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
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
        />
        <button
          type="button"
          onClick={handleAddType}
          disabled={disabled || !newTypeName.trim()}
          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova Variação
        </button>
      </div>
    </div>
  );
}
