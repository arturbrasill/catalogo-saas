import { z } from 'zod';

/**
 * Esquema de validação para variações de produtos
 */
export const VariationOptionSchema = z.object({
  tipo: z.string().min(1, 'O tipo da variação é obrigatório'),
  opcoes: z.array(z.string().min(1)).min(1, 'Ao menos uma opção de variação deve ser informada'),
});

/**
 * Esquema de validação para criação de produto
 */
export const CreateProductSchema = z.object({
  categoriaId: z.string().min(1, 'A categoria é obrigatória'),
  nome: z.string().min(2, 'O nome do produto deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'O slug deve ter pelo menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  descricao: z.string().default(''),
  preco: z.number().positive('O preço deve ser maior que zero'),
  precoPromocional: z.number().positive('O preço promocional deve ser maior que zero').nullable().optional(),
  imagens: z.array(z.string().url('URL de imagem inválida')).default([]),
  variacoes: z.array(VariationOptionSchema).default([]),
  estoque: z.number().int().min(-1, 'Estoque deve ser um número inteiro maior ou igual a -1'),
  ativo: z.boolean().default(true),
});

/**
 * Esquema de validação para atualização de produto
 */
export const UpdateProductSchema = z.object({
  id: z.string().min(1, 'ID do produto é obrigatório'),
  categoriaId: z.string().min(1).optional(),
  nome: z.string().min(2).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  descricao: z.string().optional(),
  preco: z.number().positive().optional(),
  precoPromocional: z.number().positive().nullable().optional(),
  imagens: z.array(z.string().url()).optional(),
  variacoes: z.array(VariationOptionSchema).optional(),
  estoque: z.number().int().min(-1).optional(),
  ativo: z.boolean().optional(),
});

/**
 * Esquema de validação para configurações da loja (somente campos permitidos)
 */
export const SaveConfigSchema = z.object({
  store_name: z.string().min(2, 'Nome da loja deve ter ao menos 2 caracteres').optional(),
  logo_url: z.string().url('URL da logo inválida').optional().or(z.literal('')),
  primary_color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Cor primária deve ser hexadecimal válido').optional(),
  secondary_color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Cor secundária deve ser hexadecimal válido').optional(),
  whatsapp: z.string().regex(/^\d{10,15}$/, 'Número do WhatsApp deve conter apenas dígitos com DDI e DDD').optional(),
  domain: z.string().min(3).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().min(3).optional(),
});

/**
 * Esquema de autenticação (Login)
 */
export const LoginSchema = z.object({
  password: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres'),
});
