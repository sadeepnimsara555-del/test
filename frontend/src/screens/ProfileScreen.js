import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, Phone, Mail, LogOut, ChevronRight, Settings, CreditCard, Bell, Shield, Store, FileText } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfile } = useContext(AuthContext);

  const toggleNotifications = async () => {
    try {
      const result = await updateProfile({ 
        receiveEmailNotifications: !user.receiveEmailNotifications 
      });
      if (!result.success) {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (e) {
            console.log('Logout error:', e);
          }
        }
      }
    ]);
  };

  const ProfileOption = ({ icon: Icon, title, onPress, color = "gray", subTitle }) => (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center p-5 bg-white rounded-3xl mb-4 border border-gray-100 shadow-sm"
    >
      <View className="bg-gray-50 p-3 rounded-2xl">
        <Icon size={22} color={color} />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-secondary font-bold text-base">{title}</Text>
        {subTitle && <Text className="text-gray-400 text-xs mt-1">{subTitle}</Text>}
      </View>
      <ChevronRight size={20} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="px-6">
        <View className="items-center py-10">
          <View className="relative">
            <Image 
              source={{ uri: user?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name) + '&size=256' }} 
              className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
            />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center border-4 border-white shadow-sm">
              <Settings size={18} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-secondary mt-4">{user?.name}</Text>
          <View className="bg-primary/10 px-4 py-1 rounded-full mt-2">
            <Text className="text-primary font-bold text-xs uppercase">{user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>

        <View className="mb-10">
          <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs ml-2 mb-4">Account Information</Text>
          <View className="bg-white rounded-[40px] p-2 border border-gray-100 shadow-sm">
            <View className="flex-row items-center p-4 border-b border-gray-50">
              <Mail size={18} color="gray" />
              <Text className="ml-4 text-secondary flex-1">{user?.email}</Text>
            </View>
            <View className="flex-row items-center p-4 border-b border-gray-50">
              <Phone size={18} color="gray" />
              <Text className="ml-4 text-secondary flex-1">{user?.phone || 'Not provided'}</Text>
            </View>
            <View className="flex-row items-center p-4">
              <MapPin size={18} color="gray" />
              <Text className="ml-4 text-secondary flex-1" numberOfLines={1}>{user?.address || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        <View className="mb-10">
          <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs ml-2 mb-4">Menu</Text>
          
          <ProfileOption 
            icon={User} 
            title="My Account" 
            subTitle="Information and Control" 
            onPress={() => navigation.navigate('MyAccount')} 
          />

          <ProfileOption 
            icon={CreditCard} 
            title="Payment Methods" 
            onPress={() => navigation.navigate('WithdrawalMethods')} 
          />
          
          {user?.role === 'user' && (
            <ProfileOption 
              icon={Bell} 
              title="Notifications" 
              subTitle="Manage email notifications" 
              onPress={() => navigation.navigate('NotificationSettings')} 
            />
          )}
          <ProfileOption 
            icon={Shield} 
            title="Privacy Policy" 
            onPress={() => Linking.openURL('https://sites.google.com/view/privacypolicy-foodieexpress')} 
          />
          <ProfileOption 
            icon={FileText} 
            title="Terms & Conditions" 
            onPress={() => Linking.openURL('https://sites.google.com/view/termsfor-foodieexpress')} 
          />
          
          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center p-5 bg-red-50 rounded-3xl mb-10 border border-red-100"
          >
            <View className="bg-white p-3 rounded-2xl">
              <LogOut size={22} color="#ef4444" />
            </View>
            <Text className="text-red-500 font-bold text-base ml-4 flex-1">Logout</Text>
            <ChevronRight size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
