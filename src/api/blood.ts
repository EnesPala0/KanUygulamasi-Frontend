import apiClient from './client';

// ============================================================
// HERKESE AÇIK (Token gerektirmez)
// ============================================================

// Tüm ilanları çeken fonksiyon
export const getAllBloodRequests = async () => {
  const response = await apiClient.get('/blood-requests');
  return response.data;
};

// Tekil ilan detayını çeken fonksiyon
export const getBloodRequestById = async (id: string | number) => {
  const response = await apiClient.get(`/blood-requests/${id}`);
  return response.data;
};

// ============================================================
// KORUMALI (Token gerektirir — apiClient interceptor otomatik ekler)
// ============================================================

// --- İLAN YÖNETİMİ ---

// Yeni kan ilanı oluşturma
export const createBloodRequest = async (data: {
  required_blood_type: string;
  hospital_name: string;
  city: string;
  district: string;
  required_units: number;
  urgency_level: string;
  medical_note?: string;
}) => {
  const response = await apiClient.post('/blood-requests', data);
  return response.data;
};

// Kendi açtığım ilanları getirme
export const getMyBloodRequests = async () => {
  const response = await apiClient.get('/my-blood-requests');
  return response.data;
};

// Alias — ProfileScreen bu isimle import ediyor
export const getMyCreatedListings = getMyBloodRequests;

// İlan güncelleme
export const updateBloodRequest = async (id: string | number, data: any) => {
  const response = await apiClient.put(`/blood-requests/${id}`, data);
  return response.data;
};

// İlan silme
export const deleteBloodRequest = async (id: string | number) => {
  const response = await apiClient.delete(`/blood-requests/${id}`);
  return response.data;
};

// İlanı tamamlandı olarak işaretleme
export const completeBloodRequest = async (id: string | number) => {
  // 1. Önce özel /complete rotasını dene
  try {
    const response = await apiClient.put(`/blood-requests/${id}/complete`);
    return response.data;
  } catch (e1: any) {
    console.log("/complete rotası başarısız veya yok, PUT /blood-requests/:id deneniyor...");
  }

  // 2. Sadece status göndererek güncellemeyi dene ('completed' veya 'Tamamlandı')
  try {
    const res1 = await apiClient.put(`/blood-requests/${id}`, { status: 'completed' });
    return res1.data;
  } catch (eSimple1) {
    try {
      const res2 = await apiClient.put(`/blood-requests/${id}`, { status: 'Tamamlandı' });
      return res2.data;
    } catch (eSimple2) {
      console.log("Sadece status gönderimi başarısız, tüm alanlarla birlikte gönderiliyor...");
    }
  }

  // 3. Mevcut ilanın tüm bilgilerini çekip eksiksiz gönderelim (Gorm validation için)
  let existing: any = {};
  try {
    const getRes = await apiClient.get(`/blood-requests/${id}`);
    existing = getRes.data || {};
  } catch (eGet) {}

  const cleanPayload: any = {
    patient_name: existing.patient_name || existing.patientName || 'Hasta',
    required_blood_type: existing.required_blood_type || existing.blood_type || 'A+',
    hospital_name: existing.hospital_name || existing.hospital || 'Hastane',
    city: existing.city || 'İstanbul',
    district: existing.district || 'Merkez',
    required_units: Number(existing.required_units || 1),
    urgency_level: existing.urgency_level || existing.urgency || 'Acil',
    medical_note: existing.medical_note || '',
    status: 'completed'
  };

  try {
    const response = await apiClient.put(`/blood-requests/${id}`, cleanPayload);
    return response.data;
  } catch (eFull: any) {
    cleanPayload.status = 'Tamamlandı';
    const response2 = await apiClient.put(`/blood-requests/${id}`, cleanPayload);
    return response2.data;
  }
};

// --- GÖNÜLLÜ YÖNETİMİ ---

// Bir ilana gönüllü başvurusu yapma
export const applyAsVolunteer = async (bloodRequestId: string | number) => {
  const response = await apiClient.post('/volunteers', {
    request_id: Number(bloodRequestId),
  });
  return response.data;
};

// Gönüllü başvurusunu iptal etme / geri çekme
export const cancelVolunteerApplication = async (bloodRequestId: string | number, applicationId?: string | number) => {
  try {
    if (applicationId) {
      const res = await apiClient.delete(`/volunteers/${applicationId}`);
      return res.data;
    }
  } catch (e) {}

  try {
    const res = await apiClient.delete(`/volunteers`, { data: { request_id: Number(bloodRequestId) } });
    return res.data;
  } catch (e) {}

  try {
    const res = await apiClient.delete(`/blood-requests/${bloodRequestId}/apply`);
    return res.data;
  } catch (e) {}

  const res = await apiClient.delete(`/volunteers/request/${bloodRequestId}`);
  return res.data;
};

// Bir ilana başvuran gönüllüleri getirme (ilan sahibi görür)
export const getVolunteers = async (bloodRequestId: string | number) => {
  const response = await apiClient.get(`/blood-requests/${bloodRequestId}/volunteers`);
  return response.data;
};

// Gönüllüyü kabul etme
export const acceptVolunteer = async (volunteerId: string | number) => {
  const response = await apiClient.put(`/volunteers/${volunteerId}/accept`);
  return response.data;
};

// Gönüllüyü reddetme
export const rejectVolunteer = async (volunteerId: string | number) => {
  const response = await apiClient.put(`/volunteers/${volunteerId}/reject`);
  return response.data;
};

// Gönüllü durumunu geri alma (Sıfırlama / Beklemede durumuna alma)
export const resetVolunteer = async (volunteerId: string | number) => {
  const response = await apiClient.put(`/volunteers/${volunteerId}/reset`).catch(async () => {
    return await apiClient.put(`/volunteers/${volunteerId}/pending`);
  });
  return response?.data || {};
};

// Kullanıcının başvurduğu ilanları getirme
export const getMyApplications = async () => {
  const response = await apiClient.get('/my-applications');
  return response.data;
};

// --- KULLANICI PROFİLİ ---

// Kendi profil bilgilerini getirme
export const getUserProfile = async () => {
  const response = await apiClient.get('/me');
  return response.data;
};

// Profil güncelleme
export const updateUserProfile = async (userId: string | number, updateData: any) => {
  const response = await apiClient.put(`/users/${userId}`, updateData);
  return response.data;
};

// --- BİLDİRİMLER ---

// Bildirimleri getirme
export const getNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

// Bildirimi okundu olarak işaretleme
export const markNotificationAsRead = async (notificationId: string | number) => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Kullanıcının konumunu ve token'ını güncelleyen API çağrısı
export const syncLocationAndToken = async (data: { latitude: number, longitude: number, expo_push_token: string }) => {
  try {
    const response = await apiClient.put('/user/location', data); 
    return response.data;
  } catch (error) {
    console.log("Konum güncellenirken sunucu hatası:", error);
    throw error;
  }
};