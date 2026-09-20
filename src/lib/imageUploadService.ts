/**
 * Serviço desacoplado de Upload de Imagens
 * Não armazena arquivos binários no Google Sheets; apenas URLs públicas.
 */

export interface ImageUploadResult {
  url: string;
  filename: string;
}

export interface ImageUploadService {
  upload(file: File): Promise<string>;
  validate(file: File): { valid: boolean; error?: string };
}

class DefaultImageUploadService implements ImageUploadService {
  private maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  private allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  public validate(file: File): { valid: boolean; error?: string } {
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato não suportado. Utilize imagens JPG, PNG, WEBP ou GIF.',
      };
    }

    if (file.size > this.maxSizeBytes) {
      return {
        valid: false,
        error: 'A imagem deve ter no máximo 5 MB.',
      };
    }

    return { valid: true };
  }

  public async upload(file: File): Promise<string> {
    const validation = this.validate(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Imagem inválida.');
    }

    const provider = process.env['NEXT_PUBLIC_IMAGE_UPLOAD_PROVIDER'];
    const cloudName = process.env['NEXT_PUBLIC_IMAGE_UPLOAD_CLOUD_NAME'];
    const preset = process.env['NEXT_PUBLIC_IMAGE_UPLOAD_PRESET'];

    // 1. Provedor Cloudinary com Unsigned Preset (quando configurado no .env)
    if (provider === 'cloudinary' && cloudName && preset) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Falha ao enviar imagem para o Cloudinary.');
      }

      const json = await res.json();
      return json.secure_url;
    }

    // 2. Provedor Mock / Local para desenvolvimento e testes sem credenciais
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Erro ao converter arquivo de imagem para URL.'));
        }
      };
      reader.onerror = () => reject(new Error('Falha na leitura local da imagem.'));
      reader.readAsDataURL(file);
    });
  }
}

export const imageUploadService = new DefaultImageUploadService();
