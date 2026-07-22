export const getErrorMessage = (error: any, fallback: string = 'Bir sorun oluştu. Lütfen tekrar deneyiniz.'): string => {
  if (!error) return fallback;

  const rawMsg = (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.response?.data?.details ||
    error?.message ||
    ''
  ).toString().trim();

  if (!rawMsg) return fallback;

  const lower = rawMsg.toLowerCase();

  // JSON format or missing required fields
  if (lower.includes('invalid json format or missing required fields') || lower.includes('missing required fields')) {
    return 'Lütfen girdiğiniz bilgilerin formatını (örneğin e-posta adresi) kontrol edip zorunlu alanları eksiksiz doldurunuz.';
  }

  // Login failure
  if (lower.includes('invalid email or password') || error?.response?.status === 401) {
    return 'E-posta adresiniz veya şifreniz hatalı. Lütfen kontrol edip tekrar deneyiniz.';
  }

  // User creation failure (duplicate email/phone or db error)
  if (lower.includes('failed to create user') || lower.includes('duplicate') || lower.includes('unique constraint')) {
    return 'Kayıt olunamadı. Bu e-posta adresi veya telefon numarası sistemde zaten kayıtlı olabilir.';
  }

  // Volunteer specific errors
  if (lower.includes('user has already volunteered') || lower.includes('already volunteered')) {
    return 'Bu kan talebine zaten gönüllü başvurusu yapmış durumdasınız.';
  }
  if (lower.includes('user cannot volunteer for their own') || lower.includes('cannot volunteer for their own')) {
    return 'Kendi açtığınız kan talebine gönüllü başvurusu yapamazsınız.';
  }
  if (lower.includes('blood request is not active') || lower.includes('not active')) {
    return 'Bu kan talebi artık aktif değil veya tamamlanmış.';
  }

  // General not found
  if (lower.includes('record not found') || lower.includes('not found') || error?.response?.status === 404) {
    return 'İstenen kayıt veya bilgi bulunamadı.';
  }

  // Network / Connection errors
  if (lower.includes('network error') || lower.includes('failed to fetch') || lower.includes('econnrefused')) {
    return 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
  }

  // If the backend already returned a nice Turkish message (contains Turkish characters or common Turkish words)
  const hasTurkishWords = /[çğıöşüÇĞİÖŞÜ]/.test(rawMsg) || 
    lower.includes('hatalı') || lower.includes('lütfen') || lower.includes('bulunamadı') || lower.includes('geçersiz');
  if (hasTurkishWords) {
    return rawMsg;
  }

  return fallback;
};
