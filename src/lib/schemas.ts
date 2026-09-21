import { z } from 'zod';

/**
 * Esquema de validação para variações de produtos
 */
export const VariationOptionSchema = z.object({
  tipo: z.string().trim().min(1, 'O tipo da variação é obrigatório'),
  opcoes: z
    .array(z.string().trim().min(1, 'A opção não pode ser vazia'))
    .min(1, 'Ao menos uma opção de variação deve ser informada'),
});

/**
 * Esquema de validação para categorias
 */
export const CreateCategorySchema = z.object({
  nome: z.string().trim().min(2, 'O nome da categoria deve ter no mínimo 2 caracteres'),
  slug: z
    .string()
    .trim()
    .min(2, 'O slug deve ter no mínimo 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0, 'A ordem deve ser um número inteiro positivo ou zero').default(0),
});

export const UpdateCategorySchema = z.object({
  id: z.string().trim().min(1, 'ID da categoria é obrigatório'),
  nome: z.string().trim().min(2).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().min(0).optional(),
});

/**
 * Esquema de validação para criação de produto
 */
export const CreateProductSchema = z
  .object({
    categoriaId: z.string().trim().min(1, 'A categoria é obrigatória'),
    nome: z.string().trim().min(2, 'O nome do produto deve ter pelo menos 2 caracteres'),
    slug: z
      .string()
      .trim()
      .min(2, 'O slug deve ter pelo menos 2 caracteres')
      .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
      .optional(),
    descricao: z.string().default(''),
    preco: z.number().positive('O preço deve ser maior que zero'),
    precoPromocional: z
      .number()
      .positive('O preço promocional deve ser maior que zero')
      .nullable()
      .optional(),
    imagens: z.array(z.string().url('URL de imagem inválida')).default([]),
    variacoes: z.array(VariationOptionSchema).default([]),
    estoque: z
      .number()
      .int('O estoque deve ser um número inteiro')
      .min(-1, 'Estoque deve ser um número inteiro maior ou igual a -1'),
    ativo: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.precoPromocional !== undefined && data.precoPromocional !== null) {
        return data.precoPromocional < data.preco;
      }
      return true;
    },
    {
      message: 'O preço promocional deve ser menor que o preço original',
      path: ['precoPromocional'],
    }
  );

/**
 * Esquema de validação para atualização de produto
 */
export const UpdateProductSchema = z
  .object({
    id: z.string().trim().min(1, 'ID do produto é obrigatório'),
    categoriaId: z.string().trim().min(1).optional(),
    nome: z.string().trim().min(2).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    descricao: z.string().optional(),
    preco: z.number().positive('Preço deve ser positivo').optional(),
    precoPromocional: z
      .number()
      .positive('Preço promocional deve ser positivo')
      .nullable()
      .optional(),
    imagens: z.array(z.string().url('URL de imagem inválida')).optional(),
    variacoes: z.array(VariationOptionSchema).optional(),
    estoque: z
      .number()
      .int('O estoque deve ser um número inteiro')
      .min(-1, 'Estoque deve ser um número inteiro maior ou igual a -1')
      .optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.preco !== undefined && data.precoPromocional !== undefined && data.precoPromocional !== null) {
        return data.precoPromocional < data.preco;
      }
      return true;
    },
    {
      message: 'O preço promocional deve ser menor que o preço original',
      path: ['precoPromocional'],
    }
  );

/**
 * Esquema de validação para configurações da loja (somente campos permitidos)
 */
export const SaveConfigSchema = z.object({
  store_name: z.string().trim().min(2, 'Nome da loja deve ter ao menos 2 caracteres').optional(),
  logo_url: z.string().url('URL da logo inválida').optional().or(z.literal('')),
  primary_color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Cor primária deve ser hexadecimal válido (ex: #10b981)')
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Cor secundária deve ser hexadecimal válido (ex: #047857)')
    .optional(),
  background_color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Cor de fundo deve ser hexadecimal válido (ex: #ffffff)')
    .optional(),
  text_color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Cor do texto deve ser hexadecimal válido (ex: #111827)')
    .optional(),
  banners: z
    .array(z.string().trim())
    .max(3, 'No máximo 3 banners permitidos')
    .optional(),
  whatsapp: z
    .string()
    .regex(/^\d{10,15}$/, 'Número do WhatsApp deve conter apenas dígitos com DDI e DDD')
    .optional(),
  domain: z.string().trim().min(3).optional(),
  currency: z.string().trim().length(3).optional(),
  timezone: z.string().trim().min(3).optional(),
});

/**
 * Esquema de autenticação (Login)
 */
export const LoginSchema = z.object({
  password: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres'),
});
