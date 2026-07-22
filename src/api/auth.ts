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