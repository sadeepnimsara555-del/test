import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Truck, ShoppingBag, CreditCard, Wallet, Home as HomeIcon, CheckCircle, Globe } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CheckoutScreen = ({ navigation }) => {
  const { cart, cartTotal, restaurantId, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [onlineProvider, setOnlineProvider] = useState('card'); // card, paypal
  const [address, setAddress] = useState(user?.address || '');
  const [selectedSavedMethod, setSelectedSavedMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user?.address]);

  useEffect(() => {
    // Default to the first saved method if available
    if (user?.withdrawalMethods?.length > 0) {
      setSelectedSavedMethod(user.withdrawalMethods[0]);
    }
  }, [user?.withdrawalMethods]);

  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && !address) {
      Alert.alert('Error', 'Please provide a delivery address');
      return;
    }

    if (paymentMethod === 'online') {
      navigation.navigate('PaymentDetails', {
        amount: (cartTotal + (new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50)),
        provider: selectedSavedMethod ? selectedSavedMethod.type : onlineProvider,
        savedMethod: selectedSavedMethod,
        address,
        orderType
      });
      return;
    }

    setLoading(true);
    try {
      // ... (existing order placement logic for Cash)
      const groupedItems = cart.reduce((acc, item) => {
        const resId = item.restaurantId?._id || item.restaurantId;
        if (!acc[resId]) acc[resId] = [];
        acc[resId].push({ ...item, restaurantId: resId });
        return acc;
      }, {});

      const restaurantIds = Object.keys(groupedItems);
      
      for (const resId of restaurantIds) {
        const resItems = groupedItems[resId];
        const resSubtotal = resItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const orderData = {
          restaurant: resId,
          items: resItems.map(item => ({
            menuItem: item._id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
          })),
          totalAmount: Number((resSubtotal + 2.50).toFixed(2)),
          orderType,
          deliveryAddress: orderType === 'delivery' ? address : '',
          paymentMethod: 'cash',
        };

        await api.post('/orders', orderData);
      }

      clearCart();
      Alert.alert('Success', 'Order placed successfully!', [
        { 
          text: 'Great!', 
          onPress: () => navigation.navigate('Main', { screen: 'OrdersTab' }) 
        }
      ]);
    } catch (error) {
      Alert.alert('Checkout Error', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center bg-white border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')} 
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
        >
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary ml-4">Checkout</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Order Type */}
        <Text className="text-lg font-bold text-secondary mb-4">Order Type</Text>
        <View className="flex-row space-x-4 mb-8">
          {['delivery', 'takeaway'].map(type => (
            <TouchableOpacity 
              key={type}
              onPress={() => setOrderType(type)}
              className={`flex-1 p-4 rounded-3xl items-center border capitalize ${orderType === type ? 'bg-secondary border-secondary' : 'bg-white border-gray-100'}`}
            >
              <Text className={`font-bold ${orderType === type ? 'text-white' : 'text-gray-500'}`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Address */}
        {orderType === 'delivery' && (
          <View className="mb-8">
            <Text className="text-lg font-bold text-secondary mb-4">Delivery Address</Text>
            <View className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex-row items-center">
              <View className="bg-orange-50 p-3 rounded-2xl">
                <MapPin size={24} color="#ff5a5f" />
              </View>
              <TextInput 
                className="flex-1 ml-4 text-secondary font-medium"
                value={address}
                onChangeText={setAddress}
                placeholder="Enter delivery address"
                multiline
              />
            </View>
          </View>
        )}

        {/* Payment Method */}
        <Text className="text-lg font-bold text-secondary mb-4">Payment Method</Text>
        <View className="space-y-4 mb-8">
          <TouchableOpacity 
            onPress={() => setPaymentMethod('online')}
            className={`p-5 rounded-[32px] border ${paymentMethod === 'online' ? 'bg-white border-primary border-2 shadow-sm' : 'bg-white border-gray-100'}`}
          >
            <View className="flex-row items-center">
              <CreditCard size={24} color={paymentMethod === 'online' ? '#ff5a5f' : 'gray'} />
              <Text className={`ml-4 font-bold flex-1 ${paymentMethod === 'online' ? 'text-secondary' : 'text-gray-500'}`}>Online Pay</Text>
              {paymentMethod === 'online' && <View className="w-5 h-5 bg-primary rounded-full items-center justify-center"><View className="w-2 h-2 bg-white rounded-full"/></View>}
            </View>
            
            {paymentMethod === 'online' && (
              <View className="mt-6 pt-6 border-t border-gray-100">
                {user?.withdrawalMethods?.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-widest">Saved Methods</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {user.withdrawalMethods.map((method, idx) => (
                        <TouchableOpacity 
                          key={idx}
                          onPress={() => {
                            setSelectedSavedMethod(method);
                            setOnlineProvider(method.type);
                          }}
                          className={`mr-3 p-4 rounded-2xl border-2 w-40 ${selectedSavedMethod === method ? 'bg-secondary border-secondary' : 'bg-gray-50 border-gray-100'}`}
                        >
                          <View className="flex-row justify-between items-start mb-2">
                             {method.type === 'card' ? <CreditCard size={18} color={selectedSavedMethod === method ? 'white' : 'gray'} /> : <Globe size={18} color={selectedSavedMethod === method ? 'white' : 'gray'} />}
                             {selectedSavedMethod === method && <CheckCircle size={16} color="white" />}
                          </View>
                          <Text className={`font-bold text-xs ${selectedSavedMethod === method ? 'text-white' : 'text-secondary'}`}>
                            {method.type === 'card' ? `**** ${method.details.cardNumber.slice(-4)}` : 'PayPal'}
                          </Text>
                          <Text className={`text-[8px] mt-1 ${selectedSavedMethod === method ? 'text-white/60' : 'text-gray-400'}`}>
                            {method.type === 'card' ? method.details.expiry : method.details.email}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity 
                        onPress={() => setSelectedSavedMethod(null)}
                        className={`p-4 rounded-2xl border-2 border-dashed w-40 items-center justify-center ${!selectedSavedMethod ? 'bg-secondary border-secondary' : 'bg-white border-gray-100'}`}
                      >
                        <Text className={`font-bold text-xs ${!selectedSavedMethod ? 'text-white' : 'text-gray-400'}`}>+ New Method</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}

                {!selectedSavedMethod && (
                  <View className="flex-row justify-around">
                    <TouchableOpacity 
                      onPress={() => setOnlineProvider('card')}
                      className={`px-4 py-2 rounded-xl border ${onlineProvider === 'card' ? 'bg-secondary border-secondary' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <Text className={`text-[10px] font-bold ${onlineProvider === 'card' ? 'text-white' : 'text-gray-500'}`}>CREDIT CARD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setOnlineProvider('paypal')}
                      className={`px-4 py-2 rounded-xl border ${onlineProvider === 'paypal' ? 'bg-secondary border-secondary' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <Text className={`text-[10px] font-bold ${onlineProvider === 'paypal' ? 'text-white' : 'text-gray-500'}`}>PAYPAL</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setPaymentMethod('cash')}
            className={`flex-row items-center p-4 rounded-3xl border ${paymentMethod === 'cash' ? 'bg-white border-primary border-2 shadow-sm' : 'bg-white border-gray-100'}`}
          >
            <Wallet size={24} color={paymentMethod === 'cash' ? '#ff5a5f' : 'gray'} />
            <Text className={`ml-4 font-bold flex-1 ${paymentMethod === 'cash' ? 'text-secondary' : 'text-gray-500'}`}>
              Cash on {orderType === 'delivery' ? 'Delivery' : 'Pickup'}
            </Text>
            {paymentMethod === 'cash' && <View className="w-5 h-5 bg-primary rounded-full items-center justify-center"><View className="w-2 h-2 bg-white rounded-full"/></View>}
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-40">
          <Text className="text-lg font-bold text-secondary mb-4">Final Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})</Text>
            <Text className="text-secondary font-bold">${cartTotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee ({new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size} x $2.50)</Text>
            <Text className="text-secondary font-bold">${(new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50).toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
            <Text className="text-lg font-bold text-secondary">Payable Amount</Text>
            <Text className="text-xl font-bold text-primary">${(cartTotal + (new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50)).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity 
          onPress={handlePlaceOrder}
          disabled={loading}
          className="bg-primary flex-row items-center justify-center p-5 rounded-3xl shadow-2xl shadow-primary/40"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Confirm & Pay ${(cartTotal + (new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50)).toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
