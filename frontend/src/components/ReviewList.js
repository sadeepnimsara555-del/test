import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Star, Trash2, Edit2 } from 'lucide-react-native';
import api from '../services/api';

const ReviewList = ({ reviews, currentUserId, onEdit, onDeleteSuccess }) => {
  const handleDelete = async (reviewId) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete your review?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await api.delete(`/reviews/${reviewId}`);
            onDeleteSuccess();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete review');
          }
        }
      }
    ]);
  };

  if (reviews.length === 0) {
    return (
      <View className="py-10 items-center">
        <Text className="text-gray-400">No reviews yet. Be the first to rate! 😊</Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      {reviews.map((review) => (
        <View key={review._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-row items-center">
              <Image 
                source={{ uri: review.user?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.user?.name || 'User') }} 
                className="w-10 h-10 rounded-full"
              />
              <View className="ml-3">
                <Text className="font-bold text-secondary text-sm">{review.user?.name}</Text>
                <View className="flex-row items-center mt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={10} 
                      color={star <= review.rating ? '#ffb800' : '#e5e7eb'} 
                      fill={star <= review.rating ? '#ffb800' : 'transparent'} 
                    />
                  ))}
                  <Text className="text-gray-400 text-[10px] ml-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
            
            {currentUserId === review.user?._id && (
              <View className="flex-row space-x-2">
                <TouchableOpacity onPress={() => onEdit(review)} className="p-1">
                  <Edit2 size={16} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(review._id)} className="p-1">
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <Text className="text-gray-600 text-sm leading-5">
            {review.comment}
          </Text>

          {review.menuItem && (
            <View className="mt-3 bg-gray-50 self-start px-2 py-1 rounded-lg">
              <Text className="text-[10px] text-gray-400 font-medium italic">Reviewed item: {review.menuItem?.name || 'Food Item'}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

export default ReviewList;
