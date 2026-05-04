import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Clock, Star } from 'lucide-react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import DeliveryReviewModal from '../components/DeliveryReviewModal';

const OrdersHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders');
      const rawOrders = response.data;
      
      // Bundle orders that were placed at the exact same time (within 5 seconds)
      const bundledOrders = [];
      let currentBundle = null;
      
      for (const order of rawOrders) {
        if (!currentBundle) {
          currentBundle = {
            _id: `bundle-${order._id}`,
            isBundle: true,
            mainOrderId: order._id,
            orders: [order],
            items: [...order.items],
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            orderStatus: order.orderStatus
          };
        } else {
          const timeDiff = Math.abs(new Date(currentBundle.createdAt).getTime() - new Date(order.createdAt).getTime());
          if (timeDiff < 5000) {
            currentBundle.orders.push(order);
            currentBundle.items.push(...order.items);
            currentBundle.totalAmount += order.totalAmount;
          } else {
            bundledOrders.push(currentBundle);
            currentBundle = {
              _id: `bundle-${order._id}`,
              isBundle: true,
              mainOrderId: order._id,
              orders: [order],
              items: [...order.items],
              totalAmount: order.totalAmount,
              createdAt: order.createdAt,
              orderStatus: order.orderStatus
            };
          }
        }
      }
      if (currentBundle) {
        bundledOrders.push(currentBundle);
      }
      
      setOrders(bundledOrders);
    } catch (error) {
      console.log('Error fetching history', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const OrderItem = ({ item }) => {
    const statusColors = {
      placed: 'text-blue-500 bg-blue-50',
      confirmed: 'text-orange-500 bg-orange-50',
      preparing: 'text-yellow-600 bg-yellow-50',
      ready: 'text-purple-500 bg-purple-50',
      out_for_delivery: 'text-indigo-500 bg-indigo-50',
      delivered: 'text-green-500 bg-green-50',
      cancelled: 'text-red-500 bg-red-50',
    };

    return (
      <View className="bg-white rounded-[32px] mb-6 border border-gray-100 shadow-sm overflow-hidden">
        <TouchableOpacity 
          onPress={() => navigation.navigate('OrderTracking', { orderId: item.mainOrderId || item._id })}
          className="p-5 pb-0"
          activeOpacity={0.7}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-row flex-1">
              <View className="bg-gray-50 p-3 rounded-2xl">
                <Clock size={24} color="#64748b" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-secondary font-bold text-lg" numberOfLines={1}>Order #{(item.mainOrderId || item._id || '').substring(0, 8).toUpperCase()}</Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-gray-400 text-sm">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                  <Text className="text-gray-400 text-sm">
                    {item.items.reduce((sum, i) => sum + i.quantity, 0)} {item.items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'Item' : 'Items'}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="text-primary font-black text-xl">Rs. {item.totalAmount.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>

        <View className="px-5 pb-5 flex-row justify-between items-center mt-5">
          <View className={`px-4 py-1.5 rounded-full ${statusColors[item.orderStatus]?.split(' ')[1]}`}>
            <Text className={`font-bold text-[10px] uppercase tracking-wider ${statusColors[item.orderStatus]?.split(' ')[0]}`}>{item.orderStatus.replace(/_/g, ' ')}</Text>
          </View>
          
          {item.orderStatus === 'delivered' ? (
            <TouchableOpacity 
              onPress={() => {
                setSelectedOrder(item.orders?.find(o => o.deliveryPerson) || item);
                setIsReviewVisible(true);
              }}
              className="flex-row items-center bg-green-500/10 px-4 py-2 rounded-xl"
              activeOpacity={0.6}
            >
              <Star size={14} color="#22c55e" fill="#22c55e" />
              <Text className="text-green-600 font-bold text-xs ml-1.5">Rate Order</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => navigation.navigate('OrderTracking', { orderId: item.mainOrderId || item._id })}
            >
              <View className="bg-gray-50 p-2 rounded-full">
                <ChevronRight size={18} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-6 bg-white border-b border-gray-100">
        <Text className="text-3xl font-bold text-secondary">My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <OrderItem item={item} />}
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && (
            <View className="items-center justify-center mt-20">
              <Text className="text-gray-400 font-medium">No orders found yet</Text>
            </View>
          )
        }
      />
      <DeliveryReviewModal 
        isVisible={isReviewVisible}
        onClose={() => setIsReviewVisible(false)}
        orderId={selectedOrder?.mainOrderId || selectedOrder?._id}
        driverId={selectedOrder?.deliveryPerson?._id}
        driverName={selectedOrder?.deliveryPerson?.name}
        onSucess={fetchOrders}
      />
    </SafeAreaView>
  );
};

export default OrdersHistoryScreen;
