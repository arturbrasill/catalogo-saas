/**
 * Utilitários de Máscaras para Formulários do Painel Administrativo
 */

/**
 * Aplica máscara monetária brasileira em tempo real (R$ 0,00).
 * Extrai dígitos e considera os dois últimos dígitos como centavos.
 */
export function maskCurrency(value: string | number): string {
  if (value === '' || value === undefined || value === null) {
    return '';
  }

  // Se já for número
  if (typeof value === 'number') {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Se for string com digitação progressiva
  const cleanDigits = value.replace(/\D/g, '');
  if (!cleanDigits) return '';

  const cents = parseInt(cleanDigits, 10);
  if (isNaN(cents)) return '';

  const amount = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Remove a máscara de moeda e converte para número float.
 * Ex: "R$ 1.250,50" -> 1250.5
 */
export function unmaskCurrency(maskedValue: string): number {
  if (!maskedValue) return 0;
  const cleanDigits = maskedValue.replace(/\D/g, '');
  if (!cleanDigits) return 0;
  return parseInt(cleanDigits, 10) / 100;
}

/**
 * Aplica máscara de WhatsApp brasileiro em tempo real: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX.
 * Remove prefixo 55 se o usuário colar o número internacional completo.
 */
export function maskWhatsApp(value: string): string {
  if (!value) return '';

  let digits = value.replace(/\D/g, '');

  // Se começar com 55 e tiver 12 ou 13 dígitos (ex: 5511999998888 ou 551188888888)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  // Limita a 11 dígitos (DDD + 9 dígitos)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Formato de 8 dígitos: (11) 4444-5555
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Formato de 9 dígitos: (11) 98888-5555
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Converte o número digitado para o formato internacional salvo no backend (55XXXXXXXXXXX).
 */
export function normalizeWhatsAppToApi(value: string): string {
  let digits = value.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';

  // Se já tem prefixo 55
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tem 10 ou 11 dígitos (DDD + número)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}
