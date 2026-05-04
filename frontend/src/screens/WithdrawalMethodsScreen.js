import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle, Globe } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const WithdrawalMethodsScreen = ({ navigation }) => {
  const { user, updateProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [methodType, setMethodType] = useState('card'); // 'card' or 'paypal'

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  const handleAddMethod = async () => {
    if (methodType === 'card' && (!cardNumber || !expiry || !cvv)) {
      Alert.alert('Error', 'Please fill all card details');
      return;
    }
    if (methodType === 'paypal' && !paypalEmail) {
      Alert.alert('Error', 'Please enter your PayPal email');
      return;
    }

    setLoading(true);
    try {
      const newMethod = {
        type: methodType,
        details: methodType === 'card' 
          ? { cardNumber, expiry, cvv } 
          : { email: paypalEmail },
        isDefault: (user.withdrawalMethods || []).length === 0
      };

      const updatedMethods = [...(user.withdrawalMethods || []), newMethod];
      const result = await updateProfile({ withdrawalMethods: updatedMethods });

      if (result.success) {
        setIsModalOpen(false);
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setPaypalEmail('');
        Alert.alert('Success', 'Withdrawal method added!');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add method');
    } finally {
      setLoading(false);
    }
  };

  const deleteMethod = async (index) => {
    Alert.alert('Delete Method', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          const updatedMethods = user.withdrawalMethods.filter((_, i) => i !== index);
          await updateProfile({ withdrawalMethods: updatedMethods });
        }
      }
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary ml-4">Withdrawal Methods</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs ml-2 mb-4">Saved Methods</Text>
        
        {(user.withdrawalMethods || []).map((method, index) => (
          <View key={index} className="bg-white p-6 rounded-[32px] mb-4 border border-gray-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-gray-50 p-3 rounded-2xl mr-4">
                {method.type === 'card' ? <CreditCard size={24} color="#ff5a5f" /> : <Globe size={24} color="#0070ba" />}
              </View>
              <View>
                <Text className="text-secondary font-bold text-base">
                  {method.type === 'card' ? `Card Ending in ${method.details.cardNumber.slice(-4)}` : 'PayPal'}
                </Text>
                <Text className="text-gray-400 text-xs">
                  {method.type === 'card' ? `Expires ${method.details.expiry}` : method.details.email}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteMethod(index)}>
              <Trash2 size={20} color="#ff4757" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity 
          onPress={() => setIsModalOpen(true)}
          className="bg-primary/10 p-6 rounded-[32px] border border-dashed border-primary/30 flex-row items-center justify-center mt-4"
        >
          <Plus size={24} color="#ff5a5f" />
          <Text className="text-primary font-bold ml-2">Add New Method</Text>
        </TouchableOpacity>

        <View className="mt-10 bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <Text className="text-blue-800 font-bold mb-2">How it works</Text>
          <Text className="text-blue-600/70 text-xs leading-5">
            Your earnings are held securely until you request a withdrawal. Once you reach the minimum balance of {user?.role === 'restaurant_owner' ? '$60.00' : '$20.00'}, you can transfer your funds to any of the methods saved above.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[40px] p-8 pb-12">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-bold text-secondary">New Method</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Text className="text-gray-400 font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row space-x-3 mb-8">
              <TouchableOpacity 
                onPress={() => setMethodType('card')}
                className={`flex-1 p-4 rounded-2xl border ${methodType === 'card' ? 'bg-secondary border-secondary' : 'bg-gray-50 border-gray-100'}`}
              >
                <Text className={`text-center font-bold ${methodType === 'card' ? 'text-white' : 'text-gray-400'}`}>Credit Card</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setMethodType('paypal')}
                className={`flex-1 p-4 rounded-2xl border ${methodType === 'paypal' ? 'bg-secondary border-secondary' : 'bg-gray-50 border-gray-100'}`}
              >
                <Text className={`text-center font-bold ${methodType === 'paypal' ? 'text-white' : 'text-gray-400'}`}>PayPal</Text>
              </TouchableOpacity>
            </View>

            {methodType === 'card' ? (
              <View className="space-y-4">
                <TextInput 
                  placeholder="Card Number" 
                  className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  maxLength={16}
                />
                <View className="flex-row space-x-3">
                  <TextInput 
                    placeholder="MM/YY" 
                    className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                    value={expiry}
                    onChangeText={setExpiry}
                    maxLength={5}
                  />
                  <TextInput 
                    placeholder="CVV" 
                    className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                    keyboardType="numeric"
                    secureTextEntry
                    value={cvv}
                    onChangeText={setCvv}
                    maxLength={3}
                  />
                </View>
              </View>
            ) : (
              <TextInput 
                placeholder="PayPal Email Address" 
                className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                keyboardType="email-address"
                autoCapitalize="none"
                value={paypalEmail}
                onChangeText={setPaypalEmail}
              />
            )}

            <TouchableOpacity 
              onPress={handleAddMethod}
              disabled={loading}
              className="bg-primary p-5 rounded-3xl items-center shadow-lg shadow-primary/30 mt-8"
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Method</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WithdrawalMethodsScreen;
