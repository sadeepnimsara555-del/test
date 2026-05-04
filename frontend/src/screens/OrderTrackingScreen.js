import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, MapPin, Phone, MessageSquare, CheckCircle2 } from 'lucide-react-native';
import api from '../services/api';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.log('Error fetching order', error);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { title: 'Placed', status: 'placed' },
    { title: 'Confirmed', status: 'confirmed' },
    { title: 'Preparing', status: 'preparing' },
    { title: 'Ready', status: 'ready' },
    { title: 'Out for Delivery', status: 'out_for_delivery' },
    { title: 'Delivered', status: 'delivered' }
  ];

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(step => step.status === status);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ff5a5f" />
      </View>
    );
  }

  const currentIndex = getStatusIndex(order?.orderStatus);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.navigate('Main')} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-xl font-bold text-secondary">Track Order</Text>
          <Text className="text-gray-400 text-xs">#{orderId.substring(0, 8).toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-10">
          <View className="bg-orange-50 w-24 h-24 rounded-full items-center justify-center mb-4">
            <Clock size={40} color="#ff5a5f" />
          </View>
          <Text className="text-2xl font-bold text-secondary">Estimated Arrival</Text>
          <Text className="text-primary text-3xl font-bold mt-2">25 - 35 min</Text>
        </View>

        <View className="bg-gray-50 p-6 rounded-[40px] mb-10">
          {statusSteps.map((step, index) => (
            <View key={index} className="flex-row mb-6 last:mb-0">
              <View className="items-center mr-4">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${index <= currentIndex ? 'bg-primary' : 'bg-gray-200'}`}>
                  {index <= currentIndex ? <CheckCircle2 size={16} color="white" /> : <View className="w-2 h-2 bg-white rounded-full" />}
                </View>
                {index < statusSteps.length - 1 && (
                  <View className={`w-0.5 h-12 ${index < currentIndex ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </View>
              <View className="pt-1">
                <Text className={`font-bold ${index <= currentIndex ? 'text-secondary' : 'text-gray-300'}`}>{step.title}</Text>
                {index === currentIndex && <Text className="text-gray-400 text-xs mt-1">We are currently here</Text>}
              </View>
            </View>
          ))}
        </View>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-row items-center mb-20">
          <Image 
            source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(order?.restaurant?.name) }} 
            className="w-14 h-14 rounded-2xl"
          />
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold text-secondary">{order?.restaurant?.name}</Text>
            <Text className="text-gray-400 text-sm">Restaurant</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-2">
            <Phone size={20} color="#4ade80" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
            <MessageSquare size={20} color="#60a5fa" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {order?.orderStatus === 'placed' && (
        <View className="absolute bottom-10 left-6 right-6">
          <TouchableOpacity 
            onPress={async () => {
              try {
                await api.put(`/orders/${orderId}/cancel`);
                Alert.alert('Success', 'Order cancelled');
                navigation.navigate('Main');
              } catch (e) {
                Alert.alert('Error', 'Cannot cancel now');
              }
            }}
            className="bg-white border-2 border-red-500 p-5 rounded-3xl items-center"
          >
            <Text className="text-red-500 font-bold text-lg">Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OrderTrackingScreen;
