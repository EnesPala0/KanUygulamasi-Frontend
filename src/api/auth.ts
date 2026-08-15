import apiClient from './client';

// Go tarafındaki /login endpointine e-posta ve şifreyi gönderen fonksiyon
export const loginUser = async (email: string, password: string) => {
  // apiClient zaten ana adresi bildiği için sadece '/login' rotasını yazmamız yetiyor
  const response = await apiClient.post('/login', {
    email,
    password,
  });
  
  // Go'dan dönen JSON verisini arayüze aktarmak üzere dışarı fırlatıyoruz
  return response.data; 
};

// Go'daki User struct'ına birebir uyumlu Kayıt (Signup) fonksiyonu
export const registerUser = async (
  firstName: string, 
  lastName: string, 
  email: string, 
  password: string, 
  phone: string, 
  bloodType: string, 
  city: string, 
  district: string
) => {
  const response = await apiClient.post('/users', {
    first_name: firstName,
    last_name: lastName,
    email: email,
    password: password,
    phone: phone,
    blood_type: bloodType,
    city: city,
    district: district
  });
  
  return response.data;
};

// Şifremi unuttum / sıfırlama talebi gönderen fonksiyon
export const forgotPassword = async (email: string) => {
  const response = await apiClient.post('/forgot-password', { email });
  return response.data;
};

// Profil bilgilerini güncelleme fonksiyonu
export const updateUserProfile = async (userId: string | number, data: any) => {
  const response = await apiClient.put(`/users/${userId}`, data);
  return response.data;
};

// Şifre değiştirme fonksiyonu
export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await apiClient.put('/users/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return response.data;
};

// Hesabı silme (Soft Delete) fonksiyonu
export const deleteAccount = async () => {
  const response = await apiClient.delete('/me');
  return response.data;
};

// Başka bir kullanıcının herkese açık (public) profil bilgilerini getiren fonksiyon
export const getPublicProfile = async (userId: string | number) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

// Yeni kayıt olan kullanıcının e-posta doğrulama fonksiyonu
export const verifyUserOTP = async (email: string, code: string) => {
  const response = await apiClient.post('/users/verify', {
    email: email,
    code: code
  });
  return response.data;
};

// Şifre sıfırlama (kod ile yeni şifre belirleme) fonksiyonu
export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const response = await apiClient.post('/users/reset-password', {
    email: email,
    code: code,
    new_password: newPassword
  });
  return response.data;
};