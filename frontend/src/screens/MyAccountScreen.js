import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Phone, MapPin, ShieldAlert, Trash2, CheckCircle, X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import api, { API_URL } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const MyAccountScreen = ({ navigation }) => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const [activeSubTab, setActiveSubTab] = useState(null); // null, 'info', 'control'
  
  // Info Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Control States
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('image', { uri, name: filename, type });

      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${API_URL}/auth/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      return data.imageUrl;
    } catch (error) {
      console.log('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateInfo = async () => {
    if (!name || !phone || !address) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      let finalImageUrl = profileImage;
      if (selectedImage) {
        finalImageUrl = await uploadImage(selectedImage);
      }

      const result = await updateProfile({ name, phone, address, profileImage: finalImageUrl });
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setSelectedImage(null);
        setActiveSubTab(null);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for deletion');
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/auth/profile', { data: { reason: deleteReason } });
      Alert.alert('Account Deleted', 'Your account has been permanently removed.', [
        { text: 'OK', onPress: () => logout() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const renderHeader = (title) => (
    <View className="flex-row items-center px-6 py-6 bg-white border-b border-gray-100">
      <TouchableOpacity onPress={() => {
        if (activeSubTab) {
          setActiveSubTab(null);
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          // Fallback if we can't go back
          const { user } = useContext(AuthContext);
          if (user?.role === 'delivery') navigation.navigate('DeliveryHome');
          else if (user?.role === 'restaurant_owner') navigation.navigate('MainManager');
          else navigation.navigate('Main');
        }
      }}>
        <ArrowLeft size={24} color="#1e293b" />
      </TouchableOpacity>
      <Text className="text-xl font-bold text-secondary ml-4">{title}</Text>
    </View>
  );

  if (activeSubTab === 'info') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {renderHeader('Account Information')}
        <ScrollView className="flex-1 px-6 pt-6">
          <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
            <View className="items-center mb-4">
              <TouchableOpacity onPress={pickImage} className="relative">
                <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  {selectedImage || profileImage ? (
                    <Image 
                      source={{ uri: selectedImage || profileImage }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <User size={64} color="#cbd5e1" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-white shadow-md">
                  <Camera size={16} color="white" />
                </View>
              </TouchableOpacity>
              <Text className="text-gray-400 text-[10px] font-bold uppercase mt-3 tracking-widest">Tap to change photo</Text>
            </View>

            <View>
              <Text className="text-gray-400 mb-2 ml-1 text-xs font-bold uppercase tracking-widest">Full Name</Text>
              <View className="bg-gray-50 flex-row items-center p-4 rounded-2xl border border-gray-100">
                <User size={18} color="#64748b" />
                <TextInput 
                  className="flex-1 ml-3 text-secondary font-bold"
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-400 mb-2 ml-1 text-xs font-bold uppercase tracking-widest">Email Address (Locked)</Text>
              <View className="bg-gray-100 flex-row items-center p-4 rounded-2xl border border-gray-200 opacity-60">
                <Mail size={18} color="#94a3b8" />
                <Text className="flex-1 ml-3 text-gray-500">{user?.email}</Text>
              </View>
            </View>

            <View>
              <Text className="text-gray-400 mb-2 ml-1 text-xs font-bold uppercase tracking-widest">Phone Number</Text>
              <View className="bg-gray-50 flex-row items-center p-4 rounded-2xl border border-gray-100">
                <Phone size={18} color="#64748b" />
                <TextInput 
                  className="flex-1 ml-3 text-secondary"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="0712345678"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-400 mb-2 ml-1 text-xs font-bold uppercase tracking-widest">Delivery Address</Text>
              <View className="bg-gray-50 flex-row items-start p-4 rounded-2xl border border-gray-100">
                <MapPin size={18} color="#64748b" className="mt-1" />
                <TextInput 
                  className="flex-1 ml-3 text-secondary h-20"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="123 Street, City"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleUpdateInfo}
              disabled={loading}
              className={`bg-primary p-5 rounded-2xl items-center shadow-lg shadow-primary/30 mt-4 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Update Information</Text>}
            </TouchableOpacity>
          </View>
          <View className="h-10" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeSubTab === 'control') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {renderHeader('Account Control')}
        <View className="flex-1 px-6 justify-center items-center">
          <View className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 items-center w-full">
            <View className="bg-red-50 p-6 rounded-full mb-6">
              <ShieldAlert size={48} color="#ef4444" />
            </View>
            <Text className="text-2xl font-bold text-secondary text-center mb-2">Danger Zone</Text>
            <Text className="text-gray-500 text-center mb-8 leading-5 px-4">
              Do you want to delete the account? This action is permanent and cannot be undone.
            </Text>
            
            <TouchableOpacity 
              onPress={() => setIsDeleteModalVisible(true)}
              className="bg-red-500 p-5 rounded-2xl items-center w-full shadow-lg shadow-red-200"
            >
              <Text className="text-white font-bold text-lg">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={isDeleteModalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-[40px] p-8 pb-12">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-secondary">Reason for Deletion</Text>
                <TouchableOpacity onPress={() => setIsDeleteModalVisible(false)}>
                  <X size={24} color="gray" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-gray-500 mb-4 text-sm">Please tell us why you are leaving. We value your feedback.</Text>
              
              <TextInput
                className="bg-gray-50 p-5 rounded-3xl border border-gray-100 text-secondary h-32 mb-6"
                placeholder="Type your reason here..."
                multiline
                textAlignVertical="top"
                value={deleteReason}
                onChangeText={setDeleteReason}
              />

              <TouchableOpacity 
                onPress={handleDeleteAccount}
                disabled={!deleteReason.trim() || deleting}
                className={`bg-red-500 p-5 rounded-2xl items-center flex-row justify-center shadow-lg ${(!deleteReason.trim() || deleting) ? 'opacity-50' : ''}`}
              >
                {deleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Trash2 size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-lg ml-2">Confirm Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-6 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            const { user } = useContext(AuthContext);
            if (user?.role === 'delivery') navigation.navigate('DeliveryHome');
            else if (user?.role === 'restaurant_owner') navigation.navigate('MainManager');
            else navigation.navigate('Main');
          }
        }}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-secondary ml-4">My Account</Text>
      </View>
      
      <View className="flex-1 px-6 pt-10 space-y-6">
        {user?.role !== 'restaurant_owner' && (
          <TouchableOpacity 
            onPress={() => setActiveSubTab('info')}
            className="bg-white p-8 rounded-[32px] flex-row items-center border border-gray-100 shadow-sm"
          >
            <View className="bg-blue-50 p-4 rounded-2xl">
              <User size={32} color="#3b82f6" />
            </View>
            <View className="ml-6 flex-1">
              <Text className="text-xl font-bold text-secondary">Information</Text>
              <Text className="text-gray-400 text-sm mt-1">Edit your personal details</Text>
            </View>
            <ArrowLeft size={20} color="#cbd5e1" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={() => setActiveSubTab('control')}
          className="bg-white p-8 rounded-[32px] flex-row items-center border border-gray-100 shadow-sm"
        >
          <View className="bg-red-50 p-4 rounded-2xl">
            <ShieldAlert size={32} color="#ef4444" />
          </View>
          <View className="ml-6 flex-1">
            <Text className="text-xl font-bold text-secondary">Control</Text>
            <Text className="text-gray-400 text-sm mt-1">Manage account security</Text>
          </View>
          <ArrowLeft size={20} color="#cbd5e1" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MyAccountScreen;
