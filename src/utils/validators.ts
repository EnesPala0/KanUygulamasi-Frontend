// src/utils/validators.ts

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidName = (name: string): boolean => {
  // Sadece harfler ve boşluklar (Türkçe karakterler dahil)
  const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};

export const isValidUnits = (units: string): boolean => {
  const parsed = parseInt(units, 10);
  return !isNaN(parsed) && parsed > 0 && parsed <= 50; // Makul bir üst sınır
};
