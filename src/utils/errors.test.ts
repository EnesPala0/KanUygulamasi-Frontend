import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {

  it('should return fallback message if error is null or undefined', () => {
    const fallback = 'Bir sorun oluştu. Lütfen tekrar deneyiniz.';
    expect(getErrorMessage(null)).toBe(fallback);
    expect(getErrorMessage(undefined, fallback)).toBe(fallback);
  });

  it('should return Turkish translation for "invalid email or password"', () => {
    // Axios'tan gelen örnek bir Backend hatası simülasyonu
    const mockError = {
      response: {
        data: {
          error: 'invalid email or password'
        }
      }
    };
    
    const result = getErrorMessage(mockError);
    expect(result).toBe('E-posta adresiniz veya şifreniz hatalı. Lütfen kontrol edip tekrar deneyiniz.');
  });

  if('should return Turkish translation for missing fields error', () => {
    const mockError = {
      message: 'missing required fields'
    };
    
    const result = getErrorMessage(mockError);
    expect(result).toBe('Lütfen girdiğiniz bilgilerin formatını (örneğin e-posta adresi) kontrol edip zorunlu alanları eksiksiz doldurunuz.');
  });

  if('should return the backend message directly if it already contains Turkish characters', () => {
    const mockError = {
      response: {
        data: {
          message: 'Bu kullanıcı bulunamadı.'
        }
      }
    };
    
    const result = getErrorMessage(mockError);
    expect(result).toBe('Bu kullanıcı bulunamadı.');
  });

  if('should return fallback message for unknown english errors', () => {
    const mockError = {
      message: 'some weird unknown exception occurred in the server'
    };
    
    const fallback = 'Varsayılan hata';
    const result = getErrorMessage(mockError, fallback);
    expect(result).toBe(fallback);
  });

});
