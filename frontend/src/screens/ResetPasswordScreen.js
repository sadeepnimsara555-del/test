import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import api from '../services/api';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email, otp } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%])[A-Za-z\d!@#$%]{8,}$/;

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(password)) {
      newErrors.password = 'Must be 8+ chars, include A-Z, a-z, 0-9 and !@#$%';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword: password });
      if (response.data.success) {
        Alert.alert('Success', 'Password updated successfully. You can now login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-12 pb-8 items-center">
          <Text className="text-3xl font-bold text-secondary">Reset Password</Text>
          <Text className="text-gray-500 mt-2 text-center">Create a new secure password for your account</Text>
        </View>

        <View className="px-6 space-y-4">
          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">New Password</Text>
            <View className={`bg-gray-100 flex-row items-center rounded-2xl border ${errors.password ? 'border-red-500' : 'border-transparent'}`}>
              <TextInput
                className="flex-1 p-4"
                placeholder="••••••••"
                value={password}
                onChangeText={(t) => { setPassword(t); if(errors.password) setErrors({...errors, password: null}); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-4">
                {showPassword ? <EyeOff size={20} color="gray" /> : <Eye size={20} color="gray" />}
              </TouchableOpacity>
            </View>
            {errors.password && <Text className="text-red-500 text-xs mt-1 ml-2 leading-tight">{errors.password}</Text>}
          </View>

          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Confirm New Password</Text>
            <View className={`bg-gray-100 flex-row items-center rounded-2xl border ${errors.confirmPassword ? 'border-red-500' : 'border-transparent'}`}>
              <TextInput
                className="flex-1 p-4"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); if(errors.confirmPassword) setErrors({...errors, confirmPassword: null}); }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="pr-4">
                {showConfirmPassword ? <EyeOff size={20} color="gray" /> : <Eye size={20} color="gray" />}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text className="text-red-500 text-xs mt-1 ml-2 leading-tight">{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity 
            onPress={handleResetPassword}
            disabled={loading}
            className={`bg-primary p-5 rounded-2xl items-center mt-4 shadow-lg shadow-primary/30 ${loading ? 'opacity-70' : ''}`}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Updating...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
