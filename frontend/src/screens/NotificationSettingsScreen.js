import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Mail } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

const NotificationSettingsScreen = ({ navigation }) => {
  const { user, updateProfile } = useContext(AuthContext);

  const toggleNotifications = async () => {
    try {
      const result = await updateProfile({ 
        receiveEmailNotifications: !user.receiveEmailNotifications 
      });
      if (!result.success) {
        // Handle error if needed
      }
    } catch (error) {
      console.log('Error toggling notifications', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')} 
          className="bg-gray-50 p-2 rounded-xl"
        >
          <ChevronLeft size={24} color="#1a1c1e" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary ml-4">Notifications</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="mt-8">
          <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">Email Preferences</Text>
          
          <View className="flex-row items-center p-5 bg-gray-50 rounded-3xl border border-gray-100">
            <View className="bg-white p-3 rounded-2xl shadow-sm">
              <Mail size={22} color="#ff5a5f" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-secondary font-bold text-base">New Food Updates</Text>
              <Text className="text-gray-400 text-xs mt-1">Receive emails when restaurants add new dishes</Text>
            </View>
            <Switch
              value={user?.receiveEmailNotifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#d1d1d1', true: '#ff5a5f' }}
              thumbColor={user?.receiveEmailNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <View className="flex-row items-center mb-2">
            <Bell size={20} color="#ff5a5f" />
            <Text className="ml-2 text-primary font-bold">Stay Updated</Text>
          </View>
          <Text className="text-gray-600 leading-relaxed text-sm">
            Enable notifications to be the first to know when your favorite restaurants launch new seasonal menus and exclusive dishes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;
