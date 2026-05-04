import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    setError('');
    if (!email) {
      setError('Email is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email format is invalid');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        Alert.alert('Success', 'OTP sent to your email address');
        navigation.navigate('VerifyOTP', { email });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-12 pb-8 items-center">
          <Text className="text-3xl font-bold text-secondary">Forgot Password</Text>
          <Text className="text-gray-500 mt-2 text-center">Enter your email address to receive a password reset OTP</Text>
        </View>

        <View className="px-6 space-y-4">
          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Email Address</Text>
            <TextInput
              className={`bg-gray-100 p-4 rounded-2xl border ${error ? 'border-red-500' : 'border-transparent'}`}
              placeholder="example@mail.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {error ? <Text className="text-red-500 text-xs mt-1 ml-2">{error}</Text> : null}
          </View>

          <TouchableOpacity 
            onPress={handleSendOTP}
            disabled={loading}
            className={`bg-primary p-5 rounded-2xl items-center mt-4 shadow-lg shadow-primary/30 ${loading ? 'opacity-70' : ''}`}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Sending...' : 'Send OTP'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="items-center mt-4"
          >
            <Text className="text-gray-500 font-medium text-sm">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
