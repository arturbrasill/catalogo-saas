# PROMPT 07 — TESTES E VALIDATION

Atue como QA Engineer.

Crie uma estratégia de testes automatizados e manuais.

## Testes unitários

Cobrir:

- moeda;
- subtotal;
- total;
- WhatsApp;
- variações;
- slug;
- validações;
- normalização de domínio.

## Testes de integração

Cobrir:

- login;
- produtos;
- categorias;
- configurações;
- soft delete;
- respostas da API.

## Testes E2E

Cobrir:

1. abrir loja;
2. pesquisar;
3. filtrar;
4. abrir produto;
5. escolher variação;
6. adicionar;
7. alterar quantidade;
8. abrir sacola;
9. gerar WhatsApp.

Admin:

1. login;
2. criar produto;
3. editar;
4. desativar;
5. configurar loja;
6. logout.

## Edge cases

Testar:

- produto sem imagem;
- produto sem variação;
- estoque zero;
- preço promocional;
- caracteres especiais;
- acentos;
- emoji;
- carrinho vazio;
- API indisponível;
- domínio desconhecido.

No final gerar `docs/TEST_PLAN.md` e `docs/TEST_REPORT.md`.
