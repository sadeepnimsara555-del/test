import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Lock, CheckCircle } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const PaymentDetailsScreen = ({ route, navigation }) => {
  const { amount, provider, address, orderType, savedMethod } = route.params;
  const { cart, clearCart } = useContext(CartContext);
  const { user, updateProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card details
  const [cardNumber, setCardNumber] = useState(savedMethod?.type === 'card' ? savedMethod.details.cardNumber : '');
  const [expiry, setExpiry] = useState(savedMethod?.type === 'card' ? savedMethod.details.expiry : '');
  const [cvv, setCvv] = useState(savedMethod?.type === 'card' ? savedMethod.details.cvv : '');
  
  // PayPal details
  const [paypalEmail, setPaypalEmail] = useState(savedMethod?.type === 'paypal' ? savedMethod.details.email : '');

  const handlePayment = async () => {
    if (provider === 'card') {
      if (!cardNumber || !expiry || !cvv) {
        Alert.alert('Error', 'Please fill all card details');
        return;
      }
    } else {
      if (!paypalEmail) {
        Alert.alert('Error', 'Please enter your PayPal email');
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Save method to profile if it's new
      if (!savedMethod) {
        const newMethod = {
          type: provider,
          details: provider === 'card' ? { cardNumber, expiry, cvv } : { email: paypalEmail }
        };
        
        // Check if this method already exists to avoid duplicates
        const exists = (user.withdrawalMethods || []).find(m => 
          m.type === provider && 
          (provider === 'card' ? m.details.cardNumber === cardNumber : m.details.email === paypalEmail)
        );

        if (!exists) {
          const updatedMethods = [...(user.withdrawalMethods || []), newMethod];
          await updateProfile({ withdrawalMethods: updatedMethods });
        }
      }

      // Simulate payment processing delay (2s)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Group items by restaurant
      const groupedItems = cart.reduce((acc, item) => {
        const resId = item.restaurantId?._id || item.restaurantId;
        if (!acc[resId]) acc[resId] = [];
        acc[resId].push({ ...item, restaurantId: resId });
        return acc;
      }, {});

      const restaurantIds = Object.keys(groupedItems);
      
      // Place an order for each restaurant
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
          paymentMethod: 'online',
          paymentStatus: 'paid', // Mark as paid since it's online
          onlineProvider: provider
        };

        await api.post('/orders', orderData);
      }

      setSuccess(true);
      clearCart();
    } catch (error) {
      Alert.alert('Payment Error', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <View className="items-center w-full">
           <View className="bg-emerald-50 p-12 rounded-full mb-10 shadow-xl shadow-emerald-100">
             <CheckCircle size={100} color="#10b981" />
           </View>
           <Text className="text-4xl font-black text-secondary text-center mb-4">Payment Success!</Text>
           <Text className="text-gray-400 text-center mb-12 leading-6 px-4">
             Your transaction was successful. We've notified the restaurant to start preparing your delicious meal!
           </Text>
           
           <View className="bg-gray-50 w-full p-6 rounded-[32px] mb-12 border border-gray-100">
             <View className="flex-row justify-between mb-2">
               <Text className="text-gray-400 font-bold text-xs uppercase">Paid via</Text>
               <Text className="text-secondary font-black text-xs uppercase">{provider}</Text>
             </View>
             <View className="flex-row justify-between">
               <Text className="text-gray-400 font-bold text-xs uppercase">Total Charged</Text>
               <Text className="text-emerald-600 font-black text-base">Rs. {amount.toFixed(2)}</Text>
             </View>
           </View>

           <TouchableOpacity 
             onPress={() => navigation.navigate('Main', { screen: 'OrdersTab' })}
             className="bg-secondary w-full p-6 rounded-[32px] items-center shadow-2xl shadow-secondary/30"
           >
             <Text className="text-white font-black text-lg">Track My Order</Text>
           </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary ml-4">Payment Details</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 mb-8">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest">Total Amount</Text>
              <Text className="text-3xl font-black text-secondary mt-1">Rs. {amount.toFixed(2)}</Text>
            </View>
            <View className="bg-primary/10 p-4 rounded-2xl">
              <CreditCard size={32} color="#ff5a5f" />
            </View>
          </View>

          {provider === 'card' ? (
            <View className="space-y-6">
              <View>
                <Text className="text-gray-500 mb-2 ml-1 text-xs font-bold uppercase">Card Number</Text>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row items-center">
                  <CreditCard size={20} color="gray" />
                  <TextInput 
                    className="flex-1 ml-3 text-secondary font-bold"
                    placeholder="xxxx xxxx xxxx xxxx"
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    maxLength={16}
                  />
                </View>
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-gray-500 mb-2 ml-1 text-xs font-bold uppercase">Expiry Date</Text>
                  <TextInput 
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                    placeholder="MM/YY"
                    value={expiry}
                    onChangeText={setExpiry}
                    maxLength={5}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 mb-2 ml-1 text-xs font-bold uppercase">CVV</Text>
                  <TextInput 
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                    placeholder="123"
                    keyboardType="numeric"
                    secureTextEntry
                    value={cvv}
                    onChangeText={setCvv}
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View className="space-y-6">
              <View className="items-center mb-4">
                 <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' }} className="w-32 h-10" resizeMode="contain" />
              </View>
              <View>
                <Text className="text-gray-500 mb-2 ml-1 text-xs font-bold uppercase">PayPal Email</Text>
                <TextInput 
                  className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                  placeholder="yourname@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={paypalEmail}
                  onChangeText={setPaypalEmail}
                />
              </View>
            </View>
          )}

          <View className="mt-10 flex-row items-center justify-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Lock size={16} color="gray" />
            <Text className="text-gray-400 text-xs ml-2">Secure SSL Encrypted Payment</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handlePayment}
          disabled={loading}
          className="bg-primary p-5 rounded-3xl items-center shadow-lg shadow-primary/30 mb-20"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Pay Now</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentDetailsScreen;
