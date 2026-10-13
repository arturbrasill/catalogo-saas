// Configuração das lojas modelo para demonstração (Exatamente 2 slots exclusivos)
export interface DemoStore {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  url: string;
  isAvailable: boolean;
}

/**
 * SLOTS EXCLUSIVOS DE LOJAS MODELO:
 * - Slot 1: 'Essenza' (Perfumaria e Cosméticos) - Totalmente funcional com link oficial.
 * - Slot 2: 'Loja Parceira' - Preparada e estilizada com badge 'Em Breve / Loja Parceira'.
 *   Futuramente, para ativar a Loja 2, basta atualizar os campos deste objeto (nome, link e isAvailable: true)
 *   sem necessidade de alterar a estrutura visual do card.
 */
export const DEMO_STORES: DemoStore[] = [
  {
    id: 'loja-1',
    name: 'Essenza',
    category: 'Perfumaria e Cosméticos',
    badge: 'Modelo Oficial',
    description: 'Catálogo demonstrativo interativo com variações, sacola dinâmica e WhatsApp.',
    url: 'https://numclick-app.vercel.app/essenza',
    isAvailable: true,
  },
  {
    id: 'loja-2',
    name: 'Loja Parceira',
    category: 'Moda & Acessórios',
    badge: 'Em Breve / Loja Parceira',
    description: 'Espaço reservado para vitrine homologada de lojista parceiro.',
    url: '#', // Alterar futuramente para: 'https://numclick-app.vercel.app/[slug-da-loja]'
    isAvailable: false,
  },
];
