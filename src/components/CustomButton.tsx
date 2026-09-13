import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacityProps,
  ViewStyle,
  TextStyle
} from 'react-native';

interface CustomButtonProps extends TouchableOpacityProps {
  text: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export default function CustomButton({
  text,
  isLoading = false,
  variant = 'primary',
  containerStyle,
  textStyle,
  disabled,
  ...props
}: CustomButtonProps) {
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getVariantStyle(),
        (disabled || isLoading) && styles.disabledButton,
        containerStyle
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#E63946' : '#FFF'} />
      ) : (
        <Text style={[styles.baseText, getVariantTextStyle(), textStyle]}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 14,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E63946',
  },
  disabledButton: {
    opacity: 0.6,
  },
  baseText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#FFF',
  },
  secondaryText: {
    color: '#374151',
  },
  outlineText: {
    color: '#E63946',
  },
});
