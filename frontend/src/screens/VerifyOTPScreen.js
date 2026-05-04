import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const VerifyOTPScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(120); // 2 minutes

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    setError('');
    if (!otp) {
      setError('OTP is required');
      return;
    } else if (otp.length !== 5) {
      setError('OTP must be 5 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      if (response.data.success) {
        navigation.navigate('ResetPassword', { email, otp });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid OTP';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        Alert.alert('Success', 'A new OTP has been sent to your email');
        setCountdown(120); // Reset timer
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-12 pb-8 items-center">
          <Text className="text-3xl font-bold text-secondary">Verify OTP</Text>
          <Text className="text-gray-500 mt-2 text-center">
            Enter the 5-digit code sent to <Text className="font-bold text-gray-700">{email}</Text>
          </Text>
        </View>

        <View className="px-6 space-y-4">
          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">OTP Code</Text>
            <TextInput
              className={`bg-gray-100 p-4 rounded-2xl border text-center text-2xl tracking-widest ${error ? 'border-red-500' : 'border-transparent'}`}
              placeholder="00000"
              value={otp}
              onChangeText={(t) => { setOtp(t.replace(/[^0-9]/g, '')); setError(''); }}
              keyboardType="number-pad"
              maxLength={5}
            />
            {error ? <Text className="text-red-500 text-xs mt-1 ml-2">{error}</Text> : null}
          </View>

          <TouchableOpacity 
            onPress={handleVerify}
            disabled={loading}
            className={`bg-primary p-5 rounded-2xl items-center mt-4 shadow-lg shadow-primary/30 ${loading ? 'opacity-70' : ''}`}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-gray-600">Didn't receive the code? </Text>
            <TouchableOpacity 
              onPress={handleResendOTP} 
              disabled={countdown > 0 || resendLoading}
            >
              <Text className={`font-bold ${countdown > 0 ? 'text-gray-400' : 'text-primary'}`}>
                {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VerifyOTPScreen;
