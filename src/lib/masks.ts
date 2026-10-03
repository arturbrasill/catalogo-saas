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

/**
 * Aplica máscara de CPF (11 dígitos: 000.000.000-00) ou CNPJ (14 dígitos: 00.000.000/0000-00)
 */
export function maskCpfCnpj(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);

  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  // CNPJ: 00.000.000/0000-00
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Validação do algoritmo de dígitos verificadores de CPF
 */
export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(digits.charAt(10), 10);
}

/**
 * Validação do algoritmo de dígitos verificadores de CNPJ
 */
export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights1[i]!;
  }
  let rev = sum % 11;
  let digit1 = rev < 2 ? 0 : 11 - rev;
  if (digit1 !== parseInt(digits.charAt(12), 10)) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights2[i]!;
  }
  rev = sum % 11;
  let digit2 = rev < 2 ? 0 : 11 - rev;
  return digit2 === parseInt(digits.charAt(13), 10);
}

/**
 * Valida se é um CPF (11 dígitos) ou CNPJ (14 dígitos) matematicamente válido
 */
export function validateCpfCnpj(value: string): boolean {
  const clean = value.replace(/\D/g, '');
  if (clean.length === 11) return isValidCpf(clean);
  if (clean.length === 14) return isValidCnpj(clean);
  return false;
}
