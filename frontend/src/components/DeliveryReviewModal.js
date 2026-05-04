import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Star, X, CheckCircle } from 'lucide-react-native';
import api from '../services/api';

const DeliveryReviewModal = ({ isVisible, onClose, orderId, driverId, driverName, onSucess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setRating(0);
      setComment('');
    }
  }, [isVisible]);

  const handleSubmit = async () => {
    if (rating === 0 || !comment) {
      Alert.alert('Error', 'Please provide a rating and comment');
      return;
    }

    setLoading(true);
    try {
      await api.post('/delivery-reviews', {
        order: orderId,
        deliveryPerson: driverId,
        rating,
        comment,
      });
      
      Alert.alert('Success', 'Thank you for rating your delivery driver!');
      if (onSucess) onSucess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white rounded-t-[40px] p-8 pb-12">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-2xl font-black text-secondary">Rate your Delivery</Text>
              <Text className="text-gray-400 text-xs mt-1">How was your experience with {driverName || 'your driver'}?</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="items-center mb-10">
            <View className="flex-row space-x-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  className="bg-gray-50 p-2 rounded-2xl border border-gray-100"
                >
                  <Star 
                    size={36} 
                    color={star <= rating ? '#22c55e' : '#e2e8f0'} 
                    fill={star <= rating ? '#22c55e' : 'transparent'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-gray-400 mt-4 font-bold uppercase tracking-widest text-[10px]">Tap stars to rate Driver</Text>
          </View>

          <View className="mb-10">
            <Text className="text-secondary font-bold mb-4 ml-1">Would you like to add a comment?</Text>
            <TextInput
              className="bg-gray-50 p-6 rounded-[32px] h-36 border border-gray-100 text-secondary"
              placeholder="e.g. Friendly service, fast delivery..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className="bg-green-500 p-5 rounded-[24px] shadow-xl shadow-green-200 items-center flex-row justify-center"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <CheckCircle size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">Submit Road Rating</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DeliveryReviewModal;
