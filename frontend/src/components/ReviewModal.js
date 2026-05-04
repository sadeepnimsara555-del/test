import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Star, X } from 'lucide-react-native';
import api from '../services/api';

const ReviewModal = ({ isVisible, onClose, restaurantId, menuItemId, editingReview, onSucess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setComment(editingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
  }, [editingReview, isVisible]);

  const handleSubmit = async () => {
    if (rating === 0 || !comment) {
      Alert.alert('Error', 'Please provide a rating and comment');
      return;
    }

    setLoading(true);
    try {
      if (editingReview) {
        await api.put(`/reviews/${editingReview._id}`, {
          rating,
          comment,
        });
        Alert.alert('Success', 'Review updated!');
      } else {
        await api.post('/reviews', {
          restaurant: restaurantId,
          menuItem: menuItemId,
          rating,
          comment,
        });
        Alert.alert('Success', 'Thank you for your feedback!');
      }
      
      if (onSucess) onSucess();
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingReview ? 'update' : 'submit'} review`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-[40px] p-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-secondary">
              {editingReview ? 'Edit your review' : 'Rate your order'}
            </Text>
            <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
              <X size={20} color="black" />
            </TouchableOpacity>
          </View>

          <View className="items-center mb-8">
            <View className="flex-row space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Star 
                    size={40} 
                    color={star <= rating ? '#ff5a5f' : '#e5e7eb'} 
                    fill={star <= rating ? '#ff5a5f' : 'transparent'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-gray-400 mt-2 font-medium">Tap to rate</Text>
          </View>

          <View className="mb-8">
            <Text className="text-secondary font-bold mb-3 ml-1">Write a comment</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-3xl h-32 border border-gray-100"
              placeholder="Tell us what you liked (or didn't like)..."
              multiline
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className="bg-primary p-5 rounded-3xl shadow-lg shadow-primary/20 items-center"
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">{editingReview ? 'Update Review' : 'Submit Review'}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewModal;
