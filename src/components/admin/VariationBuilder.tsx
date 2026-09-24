'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X, Tag, Sparkles } from 'lucide-react';
import type { VariationOption } from '@/types';

interface VariationBuilderProps {
  value: VariationOption[];
  onChange: (variations: VariationOption[]) => void;
  disabled?: boolean;
}

const COMMON_PRESETS = [
  { tipo: 'Tamanho', options: ['P', 'M', 'G', 'GG'] },
  { tipo: 'Cor', options: ['Preto', 'Branco', 'Cinza', 'Azul'] },
  { tipo: 'Voltagem', options: ['110V', '220V', 'Bivolt'] },
  { tipo: 'Sabor', options: ['Tradicional', 'Chocolate', 'Morango'] },
];

export function VariationBuilder({
  value = [],
  onChange,
  disabled = false,
}: VariationBuilderProps) {
  const [newTypeName, setNewTypeName] = useState('');
  const [typeError, setTypeError] = useState<string | null>(null);
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  const handleAddType = (nameToAdd?: string) => {
    setTypeError(null);
    const rawName = nameToAdd || newTypeName;
    const trimmed = rawName.trim();
    if (!trimmed) return;

    // Evita tipos duplicados
    if (value.some((v) => v.tipo.toLowerCase() === trimmed.toLowerCase())) {
      setTypeError(`A variação "${trimmed}" já existe neste produto.`);
      return;
    }

    // Se veio de preset pré-definido
    const preset = COMMON_PRESETS.find(
      (p) => p.tipo.toLowerCase() === trimmed.toLowerCase()
    );

    onChange([
      ...value,
      {
        tipo: trimmed,
        opcoes: preset ? [...preset.options] : [],
      },
    ]);
    setNewTypeName('');
  };

  const handleRemoveType = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  /**
   * Adiciona opções. Suporta digitação com vírgulas (ex: "P, M, G, GG" adiciona todas de uma vez!).
   */
  const handleAddOption = (typeIndex: number) => {
    const rawInput = (optionInputs[typeIndex] || '').trim();
    if (!rawInput) return;

    const currentType = value[typeIndex];
    if (!currentType) return;

    // Divide por vírgula se houver mais de uma
    const tokens = rawInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newOpcoes = [...currentType.opcoes];
    for (const token of tokens) {
      if (!newOpcoes.includes(token)) {
        newOpcoes.push(token);
      }
    }

    const updated = [...value];
    updated[typeIndex] = {
      ...currentType,
      opcoes: newOpcoes,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            Variações do Produto (Tamanho, Cor, Modelo, etc.)
          </h4>
          <p className="text-[11px] text-slate-500">
            Adicione opções de escolha obrigatórias para o cliente selecionar no catálogo.
          </p>
        </div>
      </div>

      {/* Lista de Variações Existentes */}
      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((variation, typeIndex) => (
            <div
              key={typeIndex}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition"
            >
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {variation.tipo}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                    {variation.opcoes.length} {variation.opcoes.length === 1 ? 'opção' : 'opções'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveType(typeIndex)}
                  disabled={disabled}
                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 transition rounded-lg cursor-pointer"
                  title={`Remover variação "${variation.tipo}"`}
                  aria-label={`Remover variação ${variation.tipo}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Pílulas de Opções */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {variation.opcoes.length === 0 ? (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                    Nenhuma opção inserida ainda. Digite abaixo (ex: P, M, G) e tecle Enter.
                  </span>
                ) : (
                  variation.opcoes.map((opcao, optIndex) => (
                    <span
                      key={optIndex}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 px-3 py-1 text-xs font-semibold shadow-2xs transition group"
                    >
                      <span>{opcao}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(typeIndex, optIndex)}
                        disabled={disabled}
                        className="text-slate-400 hover:text-rose-600 p-0.5 focus:outline-none transition"
                        title={`Remover ${opcao}`}
                        aria-label={`Remover opção ${opcao}`}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Input para Nova Opção */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Digite opções para ${variation.tipo} separadas por vírgula (ex: P, M, G, GG)...`}
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
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption(typeIndex)}
                  disabled={disabled || !(optionInputs[typeIndex] || '').trim()}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input para Criar Novo Tipo de Variação + Sugestões Rápidas */}
      <div className="space-y-2 pt-2 border-t border-slate-200/80">
        {typeError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between animate-fade-in">
            <span>{typeError}</span>
            <button
              type="button"
              onClick={() => setTypeError(null)}
              className="text-rose-400 hover:text-rose-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome da nova variação (ex: Tamanho, Cor, Sabor)..."
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddType();
              }
            }}
            disabled={disabled}
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white placeholder-slate-400"
          />
          <button
            type="button"
            onClick={() => handleAddType()}
            disabled={disabled || !newTypeName.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Criar Variação</span>
          </button>
        </div>

        {/* Sugestões Rápidas de Variação */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Sugestões Rápidas:
          </span>
          {COMMON_PRESETS.map((preset) => (
            <button
              key={preset.tipo}
              type="button"
              onClick={() => handleAddType(preset.tipo)}
              disabled={disabled || value.some((v) => v.tipo.toLowerCase() === preset.tipo.toLowerCase())}
              className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-medium transition cursor-pointer"
            >
              + {preset.tipo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
