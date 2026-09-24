'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X, Tag, Sparkles, DollarSign, Edit2, Check, HelpCircle } from 'lucide-react';
import type { VariationOption } from '@/types';
import { parseVariationOption, buildVariationOptionString, formatCurrency } from '@/lib/variations';

interface VariationBuilderProps {
  value: VariationOption[];
  onChange: (variations: VariationOption[]) => void;
  disabled?: boolean;
}

interface NewOptionState {
  label: string;
  priceType: 'none' | 'delta' | 'fixed';
  priceValue: string;
  isBatch: boolean;
}

interface EditingOptionState {
  typeIndex: number;
  optIndex: number;
  label: string;
  priceType: 'none' | 'delta' | 'fixed';
  priceValue: string;
}

const COMMON_PRESETS = [
  { tipo: 'Tamanho', options: ['P', 'M', 'G', 'GG'] },
  { tipo: 'Cor', options: ['Preto', 'Branco', 'Cinza', 'Azul'] },
  { tipo: 'Voltagem', options: ['110V', '220V', 'Bivolt'] },
  { tipo: 'Sabor', options: ['Tradicional', 'Chocolate', 'Morango'] },
];

function parseNumericPrice(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[^\d.,]/g, '').trim();
  if (clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return parseFloat(clean) || 0;
}

export function VariationBuilder({
  value = [],
  onChange,
  disabled = false,
}: VariationBuilderProps) {
  const [newTypeName, setNewTypeName] = useState('');
  const [typeError, setTypeError] = useState<string | null>(null);

  // Estado para formulário de nova opção em cada tipo de variação
  const [newOptionForms, setNewOptionForms] = useState<Record<number, NewOptionState>>({});

  // Estado de edição de opção existente
  const [editingOption, setEditingOption] = useState<EditingOptionState | null>(null);

  const getFormState = (typeIndex: number): NewOptionState => {
    return (
      newOptionForms[typeIndex] || {
        label: '',
        priceType: 'none',
        priceValue: '',
        isBatch: false,
      }
    );
  };

  const updateFormState = (typeIndex: number, updates: Partial<NewOptionState>) => {
    setNewOptionForms((prev) => ({
      ...prev,
      [typeIndex]: { ...getFormState(typeIndex), ...updates },
    }));
  };

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
    if (editingOption?.typeIndex === index) {
      setEditingOption(null);
    }
  };

  /**
   * Adiciona opção ou lote de opções na variação
   */
  const handleAddOption = (typeIndex: number) => {
    const form = getFormState(typeIndex);
    const currentType = value[typeIndex];
    if (!currentType) return;

    if (form.isBatch) {
      // Modo em lote (separado por vírgula)
      const tokens = form.label
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (tokens.length === 0) return;

      const newOpcoes = [...currentType.opcoes];
      for (const token of tokens) {
        if (!newOpcoes.includes(token)) {
          newOpcoes.push(token);
        }
      }

      const updated = [...value];
      updated[typeIndex] = { ...currentType, opcoes: newOpcoes };
      onChange(updated);
      updateFormState(typeIndex, { label: '' });
      return;
    }

    // Modo individual com suporte a preço
    const cleanLabel = form.label.trim();
    if (!cleanLabel) return;

    const amount = parseNumericPrice(form.priceValue);
    const formattedOptionString = buildVariationOptionString(
      cleanLabel,
      form.priceType,
      amount
    );

    // Evita duplicata exata
    if (currentType.opcoes.includes(formattedOptionString)) {
      updateFormState(typeIndex, { label: '', priceValue: '' });
      return;
    }

    const updated = [...value];
    updated[typeIndex] = {
      ...currentType,
      opcoes: [...currentType.opcoes, formattedOptionString],
    };

    onChange(updated);
    updateFormState(typeIndex, { label: '', priceValue: '' });
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
    if (
      editingOption &&
      editingOption.typeIndex === typeIndex &&
      editingOption.optIndex === optionIndex
    ) {
      setEditingOption(null);
    }
  };

  /**
   * Inicia edição de uma opção existente
   */
  const handleStartEdit = (typeIndex: number, optIndex: number, rawOption: string) => {
    const parsed = parseVariationOption(rawOption);
    let priceType: 'none' | 'delta' | 'fixed' = 'none';
    let priceValue = '';

    if (parsed.priceDelta > 0) {
      priceType = 'delta';
      priceValue = parsed.priceDelta.toFixed(2).replace('.', ',');
    } else if (typeof parsed.fixedPrice === 'number' && parsed.fixedPrice > 0) {
      priceType = 'fixed';
      priceValue = parsed.fixedPrice.toFixed(2).replace('.', ',');
    }

    setEditingOption({
      typeIndex,
      optIndex,
      label: parsed.cleanLabel,
      priceType,
      priceValue,
    });
  };

  /**
   * Salva a edição da opção
   */
  const handleSaveEdit = () => {
    if (!editingOption) return;
    const { typeIndex, optIndex, label, priceType, priceValue } = editingOption;
    const currentType = value[typeIndex];
    if (!currentType) return;

    const cleanLabel = label.trim();
    if (!cleanLabel) return;

    const amount = parseNumericPrice(priceValue);
    const formatted = buildVariationOptionString(cleanLabel, priceType, amount);

    const newOpcoes = [...currentType.opcoes];
    newOpcoes[optIndex] = formatted;

    const updated = [...value];
    updated[typeIndex] = { ...currentType, opcoes: newOpcoes };

    onChange(updated);
    setEditingOption(null);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            Variações e Preços por Opção (Tamanho, Cor, Modelo, etc.)
          </h4>
          <p className="text-[11px] text-slate-500">
            Configure opções de escolha para o cliente. Você pode definir preços diferentes para cada tamanho ou variação!
          </p>
        </div>
      </div>

      {/* Dica Educativa sobre Preço Dinâmico */}
      <div className="flex items-start gap-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-900">
        <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold block">Como funciona o preço por variação?</span>
          <span>
            Ao adicionar um tamanho ou opção com <strong>acréscimo (+ R$)</strong> (ex: Tamanho G com + R$ 10,00), o preço da vitrine se atualizará automaticamente em tempo real para o cliente quando ele selecionar essa opção!
          </span>
        </div>
      </div>

      {/* Lista de Variações Existentes */}
      {value.length > 0 && (
        <div className="space-y-4">
          {value.map((variation, typeIndex) => {
            const form = getFormState(typeIndex);

            return (
              <div
                key={typeIndex}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
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

                {/* Lista de Opções Existentes como Pílulas Inteligentes */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {variation.opcoes.length === 0 ? (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-xl block w-full">
                      Nenhuma opção adicionada. Crie opções abaixo (ex: P, M, G).
                    </span>
                  ) : (
                    variation.opcoes.map((opcao, optIndex) => {
                      const parsed = parseVariationOption(opcao);
                      const isEditing =
                        editingOption?.typeIndex === typeIndex &&
                        editingOption?.optIndex === optIndex;

                      if (isEditing) {
                        return (
                          <div
                            key={optIndex}
                            className="w-full sm:w-auto p-3 bg-emerald-50/60 border border-emerald-300 rounded-xl flex flex-wrap items-center gap-2 animate-fade-in"
                          >
                            <input
                              type="text"
                              value={editingOption.label}
                              onChange={(e) =>
                                setEditingOption({ ...editingOption, label: e.target.value })
                              }
                              placeholder="Nome (ex: G)"
                              className="w-24 sm:w-28 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                            />
                            <select
                              value={editingOption.priceType}
                              onChange={(e) =>
                                setEditingOption({
                                  ...editingOption,
                                  priceType: e.target.value as any,
                                })
                              }
                              className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none"
                            >
                              <option value="none">Preço Padrão (R$ 0,00)</option>
                              <option value="delta">+ Acréscimo (+ R$)</option>
                              <option value="fixed">Preço Fixo (R$)</option>
                            </select>
                            {editingOption.priceType !== 'none' && (
                              <input
                                type="text"
                                value={editingOption.priceValue}
                                onChange={(e) =>
                                  setEditingOption({
                                    ...editingOption,
                                    priceValue: e.target.value,
                                  })
                                }
                                placeholder="10,00"
                                className="w-20 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                              />
                            )}
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                              title="Salvar alteração"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingOption(null)}
                              className="p-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={optIndex}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 text-slate-800 border border-slate-200/90 px-3 py-1.5 text-xs font-semibold shadow-2xs transition group"
                        >
                          <span className="font-bold text-slate-900">{parsed.cleanLabel}</span>

                          {parsed.priceDelta > 0 && (
                            <span className="inline-flex items-center text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                              {parsed.displayBadge}
                            </span>
                          )}

                          {typeof parsed.fixedPrice === 'number' && parsed.fixedPrice > 0 && (
                            <span className="inline-flex items-center text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded-md">
                              {parsed.displayBadge}
                            </span>
                          )}

                          {parsed.priceDelta === 0 && !parsed.fixedPrice && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              (Padrão)
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(typeIndex, optIndex, opcao)}
                            disabled={disabled}
                            className="text-slate-400 hover:text-emerald-700 p-0.5 focus:outline-none transition"
                            title={`Editar preço de ${parsed.cleanLabel}`}
                            aria-label={`Editar ${parsed.cleanLabel}`}
                          >
                            <Edit2 className="w-3 h-3 stroke-[2]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveOption(typeIndex, optIndex)}
                            disabled={disabled}
                            className="text-slate-400 hover:text-rose-600 p-0.5 focus:outline-none transition"
                            title={`Remover ${parsed.cleanLabel}`}
                            aria-label={`Remover opção ${parsed.cleanLabel}`}
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Formulário para Adicionar Opção na Variação */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Plus className="w-3 h-3 text-emerald-600" />
                      Adicionar Opção para {variation.tipo}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateFormState(typeIndex, { isBatch: !form.isBatch })}
                      className="text-[11px] text-brand-primary hover:underline font-semibold cursor-pointer"
                    >
                      {form.isBatch
                        ? 'Alternar para opção individual com preço'
                        : 'Ou adicionar várias de uma vez (ex: P, M, G, GG)'}
                    </button>
                  </div>

                  {form.isBatch ? (
                    // Adição em lote simples
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite opções separadas por vírgula (ex: P, M, G, GG)..."
                        value={form.label}
                        onChange={(e) => updateFormState(typeIndex, { label: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOption(typeIndex);
                          }
                        }}
                        disabled={disabled}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOption(typeIndex)}
                        disabled={disabled || !form.label.trim()}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Adicionar Lote</span>
                      </button>
                    </div>
                  ) : (
                    // Adição individual com seletor de preço diferenciado
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          placeholder={`Nome (ex: ${variation.tipo.toLowerCase().includes('tamanho') ? 'G' : 'Opção'})...`}
                          value={form.label}
                          onChange={(e) => updateFormState(typeIndex, { label: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOption(typeIndex);
                            }
                          }}
                          disabled={disabled}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none placeholder-slate-400 font-medium"
                        />
                      </div>

                      <div className="sm:w-48">
                        <select
                          value={form.priceType}
                          onChange={(e) =>
                            updateFormState(typeIndex, { priceType: e.target.value as any })
                          }
                          disabled={disabled}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 font-medium focus:border-slate-800 focus:outline-none"
                        >
                          <option value="none">Preço Padrão (sem acréscimo)</option>
                          <option value="delta">+ Acréscimo no Preço (+ R$)</option>
                          <option value="fixed">Preço Fixo Específico (R$)</option>
                        </select>
                      </div>

                      {form.priceType !== 'none' && (
                        <div className="w-full sm:w-28 relative">
                          <input
                            type="text"
                            placeholder="Valor R$"
                            value={form.priceValue}
                            onChange={(e) =>
                              updateFormState(typeIndex, { priceValue: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddOption(typeIndex);
                              }
                            }}
                            disabled={disabled}
                            className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddOption(typeIndex)}
                        disabled={disabled || !form.label.trim()}
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
            placeholder="Nome da nova variação (ex: Tamanho, Cor, Sabor, Modelo)..."
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
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-medium transition cursor-pointer"
            >
              + {preset.tipo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
