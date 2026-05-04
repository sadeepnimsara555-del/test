import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);

  const validate = () => {
    let newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email format is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    
    if (!result.success) {
      // Handle the specific error message from backend
      Alert.alert('Login Error', result.message);
      if (result.message.toLowerCase().includes('password')) {
        setErrors({ password: 'Wrong password' });
      } else if (result.message.toLowerCase().includes('user')) {
        setErrors({ email: 'Email not registered' });
      } else {
        setErrors({ email: 'Incorrect email', password: 'Incorrect password' });
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-12 pb-8 items-center">
          <Text className="text-3xl font-bold text-secondary">Welcome Back</Text>
          <Text className="text-gray-500 mt-2 text-center">Login to your account to continue ordering</Text>
        </View>

        <View className="px-6 space-y-4">
          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Email Address</Text>
            <TextInput
              className={`bg-gray-100 p-4 rounded-2xl border ${errors.email ? 'border-red-500' : 'border-transparent'}`}
              placeholder="example@mail.com"
              value={email}
              onChangeText={(t) => { setEmail(t); if(errors.email) setErrors({...errors, email: null}); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.email}</Text>}
          </View>

          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-sm font-medium">Password</Text>
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
            {errors.password && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.password}</Text>}
            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword')}
              className="self-end mt-2"
            >
              <Text className="text-primary font-medium text-xs">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={loading}
            className={`bg-primary p-5 rounded-2xl items-center mt-4 shadow-lg shadow-primary/30 ${loading ? 'opacity-70' : ''}`}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-primary font-bold">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
