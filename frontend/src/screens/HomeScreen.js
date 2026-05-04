import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Filter, Star } from 'lucide-react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchRestaurants();
    }, [])
  );

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      setRestaurants(response.data);
    } catch (error) {
      console.log('Error fetching restaurants', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(res => 
    res.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const RestaurantCard = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('RestaurantDetail', { id: item._id })}
      className="bg-white rounded-3xl mb-6 overflow-hidden shadow-sm border border-gray-100"
    >
      <View className="relative">
        <Image 
          source={{ uri: item.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800' }} 
          className="w-full h-44"
          resizeMode="cover"
        />
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/10" />
        <View className="absolute bottom-3 left-4 flex-row items-center">
          <Image 
            source={{ uri: item.logo || 'https://ui-avatars.com/api/?name='+encodeURIComponent(item.name)+'&background=random' }} 
            className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
          />
        </View>
      </View>
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-xl font-bold text-secondary">{item.name}</Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="gray" />
              <Text className="text-gray-500 text-sm ml-1" numberOfLines={1}>{item.address}</Text>
            </View>
          </View>
          <View className="bg-green-50 px-2 py-1 rounded-lg flex-row items-center">
            <Star size={14} color="#4ade80" fill="#4ade80" />
            <Text className="text-green-700 font-bold text-xs ml-1">{item.rating || '0.0'}</Text>
          </View>

        </View>
        
        <View className="flex-row mt-3 space-x-4">
          <View className="bg-gray-50 px-3 py-1 rounded-full">
            <Text className="text-gray-600 text-xs">{item.openingHours}</Text>
          </View>
          <View className="bg-gray-50 px-3 py-1 rounded-full">
            <Text className="text-gray-600 text-xs">Free Delivery</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-gray-500 text-xs uppercase tracking-widest">Delivering to</Text>
          <View className="flex-row items-center">
            <MapPin size={16} color="#ff5a5f" />
            <Text className="text-secondary font-bold text-lg ml-1">{user?.address || 'Set Address'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => user?.role === 'restaurant_owner' && navigation.navigate('OwnerDashboard')}
          className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
        >
          <Image 
            source={{ uri: user?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name) }} 
            className="w-10 h-10 rounded-full"
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 mt-6">
          <Text className="text-3xl font-bold text-secondary">Find Best Food Around You</Text>
          
          <View className="flex-row mt-6 space-x-3">
            <View className="flex-1 bg-white flex-row items-center px-4 rounded-2xl shadow-sm border border-gray-100">
              <Search size={20} color="gray" />
              <TextInput 
                className="flex-1 h-12 ml-2"
                placeholder="Search restaurants..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity className="bg-primary w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-primary/20">
              <Filter size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>



        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-secondary">Nearby Restaurants</Text>
            <TouchableOpacity>
              <Text className="text-primary font-bold">See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#ff5a5f" className="mt-10" />
          ) : (
            filteredRestaurants.map(item => (
              <RestaurantCard key={item._id} item={item} />
            ))
          )}
          
          <View className="h-10" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
