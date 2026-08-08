import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const navigationMock = {
      navigate: jest.fn(),
      reset: jest.fn(),
    };
    
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={navigationMock} />
    );

    expect(getByText('Hoş Geldiniz')).toBeTruthy();
    expect(getByText('Her bağış bir hayat kurtarır.')).toBeTruthy();
    expect(getByPlaceholderText('ornek@email.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Giriş Yap')).toBeTruthy();
  });
});
