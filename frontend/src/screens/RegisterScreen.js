import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, Linking } from 'react-native';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user'); // 'user', 'restaurant_owner', or 'delivery'
  const [restaurantName, setRestaurantName] = useState('');
  const [receiveEmailNotifications, setReceiveEmailNotifications] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register } = useContext(AuthContext);

  const validate = () => {
    let newErrors = {};
    if (!name) newErrors.name = 'Full name is required';
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!phone) {
      newErrors.phone = 'Phone number is required';
    } else if (phone.length < 10) {
      newErrors.phone = 'Must be at least 10 digits';
    }

    if (!address) newErrors.address = 'Address is required';
    
    if (role === 'restaurant_owner' && !restaurantName) {
      newErrors.restaurantName = 'Restaurant name is required';
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%])[A-Za-z\d!@#$%]{8,}$/;
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(password)) {
      newErrors.password = 'Must be 8+ chars, include A-Z, a-z, 0-9 and !@#$%';
    }
    
    if (!agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    // Auth context needs signature update (we'll assume the arguments include vehicleInfo somehow, or pass all as an object)
    // Currently: register(name, email, password, address, phone, role, restaurantName, receiveEmailNotifications, vehicleInfo);
    const result = await register(name, email, password, address, phone, role, restaurantName, receiveEmailNotifications);
    if (!result.success) {
      Alert.alert('Registration Failed', result.message);
      if (result.message.includes('exists')) {
        setErrors({ email: 'Email already registered' });
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-8 pb-6">
          <Text className="text-3xl font-bold text-secondary">Create Account</Text>
          <Text className="text-gray-500 mt-2">Join us and start ordering delicious food</Text>
        </View>

        <View className="px-6 space-y-4">
          <View className="flex-row space-x-2 mb-2">
            <TouchableOpacity 
              onPress={() => setRole('user')}
              className={`flex-1 p-3 rounded-2xl border-2 ${role === 'user' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
            >
              <Text className={`text-center font-bold text-xs ${role === 'user' ? 'text-primary' : 'text-gray-400'}`}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setRole('restaurant_owner')}
              className={`flex-1 p-3 rounded-2xl border-2 ${role === 'restaurant_owner' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
            >
              <Text className={`text-center font-bold text-xs ${role === 'restaurant_owner' ? 'text-primary' : 'text-gray-400'}`}>Restaurant</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setRole('delivery')}
              className={`flex-1 p-3 rounded-2xl border-2 ${role === 'delivery' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
            >
              <Text className={`text-center font-bold text-xs ${role === 'delivery' ? 'text-primary' : 'text-gray-400'}`}>Delivery</Text>
            </TouchableOpacity>
          </View>

          {role === 'restaurant_owner' && (
            <View>
              <Text className="text-gray-600 mb-1 ml-1 text-xs font-bold uppercase">Restaurant Name</Text>
              <TextInput
                className={`bg-gray-100 p-4 rounded-2xl border ${errors.restaurantName ? 'border-red-500' : 'border-transparent'}`}
                placeholder="Delicious Eats Cafe"
                value={restaurantName}
                onChangeText={(t) => { setRestaurantName(t); if(errors.restaurantName) setErrors({...errors, restaurantName: null}); }}
              />
              {errors.restaurantName && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.restaurantName}</Text>}
            </View>
          )}



          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-xs font-bold uppercase">Full Name</Text>
            <TextInput
              className={`bg-gray-100 p-4 rounded-2xl border ${errors.name ? 'border-red-500' : 'border-transparent'}`}
              placeholder="John Doe"
              value={name}
              onChangeText={(t) => { setName(t); if(errors.name) setErrors({...errors, name: null}); }}
            />
            {errors.name && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.name}</Text>}
          </View>

          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-xs font-bold uppercase">Email Address</Text>
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
            <Text className="text-gray-600 mb-1 ml-1 text-xs font-bold uppercase">Phone Number</Text>
            <TextInput
              className={`bg-gray-100 p-4 rounded-2xl border ${errors.phone ? 'border-red-500' : 'border-transparent'}`}
              placeholder="0712345678"
              value={phone}
              onChangeText={(t) => { setPhone(t); if(errors.phone) setErrors({...errors, phone: null}); }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.phone && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.phone}</Text>}
          </View>

          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-xs font-bold uppercase">Address</Text>
            <TextInput
              className={`bg-gray-100 p-4 rounded-2xl border ${errors.address ? 'border-red-500' : 'border-transparent'}`}
              placeholder="123 Street Name, City"
              value={address}
              onChangeText={(t) => { setAddress(t); if(errors.address) setErrors({...errors, address: null}); }}
              multiline
            />
            {errors.address && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.address}</Text>}
          </View>

          <View>
            <Text className="text-gray-600 mb-1 ml-1 text-xs font-bold uppercase">Password</Text>
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
            {errors.password && <Text className="text-red-500 text-[10px] mt-1 ml-2 leading-tight">{errors.password}</Text>}
          </View>

          {role === 'user' && (
            <TouchableOpacity 
              onPress={() => setReceiveEmailNotifications(!receiveEmailNotifications)}
              className="flex-row items-center mt-2 px-1"
            >
              <View className={`w-6 h-6 rounded border-2 items-center justify-center ${receiveEmailNotifications ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                {receiveEmailNotifications && <Check size={16} color="white" strokeWidth={3} />}
              </View>
              <Text className="text-gray-600 ml-3 text-sm">Receive updates about new food items and offers</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              if (errors.agreedToTerms) setErrors({...errors, agreedToTerms: null});
            }}
            className="flex-row items-start mt-4 px-1"
            activeOpacity={0.7}
          >
            <View className={`w-6 h-6 rounded border-2 items-center justify-center mt-0.5 ${agreedToTerms ? 'bg-primary border-primary' : errors.agreedToTerms ? 'border-red-500' : 'border-gray-300'}`}>
              {agreedToTerms && <Check size={16} color="white" strokeWidth={3} />}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-600 text-[13px] leading-5">
                I agree to the <Text className="text-primary font-bold underline" onPress={() => Linking.openURL('https://sites.google.com/view/termsfor-foodieexpress')}>Terms & Conditions</Text> and accept the <Text className="text-primary font-bold underline" onPress={() => Linking.openURL('https://sites.google.com/view/privacypolicy-foodieexpress')}>Privacy Policy</Text> of Foodie Express.
              </Text>
              {errors.agreedToTerms && <Text className="text-red-500 text-[10px] mt-1 ml-1">{errors.agreedToTerms}</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleRegister}
            className="bg-primary p-4 rounded-2xl items-center mt-4 shadow-lg shadow-primary/30"
          >
            <Text className="text-white font-bold text-lg">Register</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary font-bold">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
