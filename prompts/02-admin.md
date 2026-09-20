# PROMPT 02 — PAINEL ADMINISTRATIVO

Construa `/admin` como SPA administrativa moderna.

## Stack

Next.js, React, TypeScript, Tailwind, React Hook Form, Zod, Zustand/Context e Lucide.

## Páginas

- `/admin/login`
- `/admin`
- `/admin/produtos`
- `/admin/categorias`
- `/admin/configuracoes`

## Login

- senha;
- persistência de sessão;
- logout;
- loading;
- erro;
- proteção de rotas.

Não guardar senha.

## Dashboard

Mostrar:

- produtos;
- produtos ativos;
- categorias;
- produtos inativos.

## Produtos

Busca, filtro por categoria, status, ordenação, criar, editar, duplicar, desativar.

Campos:

- nome;
- categoria;
- descrição;
- preço;
- preço promocional;
- estoque;
- imagens;
- variações;
- ativo.

## Variações

Criar `VariationBuilder`.

Formato:

```json
[
  {"tipo":"Tamanho","opcoes":["P","M","G"]},
  {"tipo":"Cor","opcoes":["Preto","Branco"]}
]
```

## Imagens

Criar camada `imageUploadService`.

Fluxo:

arquivo → preview → upload → URL → formulário.

Não armazenar binários na planilha.

## Configurações

- nome;
- logo;
- cores;
- WhatsApp;
- domínio.

## API

Criar `lib/api.ts`. Componentes não devem executar fetch diretamente.

## UX

Loading, skeleton, empty state, toast, confirmação, erro de rede, responsividade e acessibilidade.

## Entrega

Código real, testes e integração com o contrato do backend.
