import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Minus, Plus, Clock, Star, ShoppingBag } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ReviewModal from '../components/ReviewModal';
import ReviewList from '../components/ReviewList';


const MenuItemDetailScreen = ({ route, navigation }) => {
  const itemId = route.params?.id || route.params?.item?._id;
  const isRecommended = route.params?.isRecommended || false;
  const restaurantId = route.params?.restaurantId;
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [currentItem, setCurrentItem] = useState(route.params?.item || null);
  const [isLoading, setIsLoading] = useState(!route.params?.item);

  // Show "You may also like" whenever coming from Explore page
  const showRecs = Boolean(route.params?.fromExplore);

  useEffect(() => {
    if (itemId) {
      trackView();
      fetchData();
      if (showRecs && currentItem) {
        fetchRecommendations();
      }
    }
  }, [itemId]);

  // If deep linked, fetch recommendations after currentItem loads to get category
  useEffect(() => {
    if (showRecs && currentItem && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [currentItem]);

  const fetchData = async () => {
    try {
      const [itemData, reviewData] = await Promise.all([
        api.get(`/menu/${itemId}`),
        api.get(`/reviews/menu/${itemId}`)
      ]);
      setCurrentItem(itemData.data);
      setReviews(reviewData.data);
      setIsLoading(false);
    } catch (e) {
      console.log('Error fetching item data', e);
      setIsLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await api.post(`/menu/${itemId}/view`);
    } catch (e) {
      // Silent fail - tracking is non-critical
    }
  };

  const fetchRecommendations = async () => {
    if (!currentItem) return;
    try {
      setRecLoading(true);
      // Always pass category so we get same-category items first
      const url = `/menu/recommendations?category=${encodeURIComponent(currentItem.category)}&excludeId=${itemId}`;
      const res = await api.get(url);
      setRecommendations(res.data.slice(0, 6));
    } catch (e) {
      console.log('Error fetching recs', e);
    } finally {
      setRecLoading(false);
    }
  };

  const handleAddToCart = () => {
    const itemRestaurantId = restaurantId || currentItem?.restaurantId;
    for (let i = 0; i < quantity; i++) {
      addToCart(currentItem, itemRestaurantId);
    }
    navigation.goBack();
  };


  if (isLoading || !currentItem) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#ff5a5f" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View className="relative">
          <Image 
            source={{ uri: currentItem.image || 'https://via.placeholder.com/800x600' }} 
            className="w-full h-96"
          />

          {isRecommended && (
            <View className="absolute top-12 right-6 bg-green-500 px-3 py-1 rounded-full shadow-sm">
              <Text className="text-[10px] font-bold text-white uppercase">Recommended</Text>
            </View>
          )}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="absolute top-12 left-6 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} color="black" />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-8 pb-32">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="bg-secondary/10 self-start px-3 py-1 rounded-full mb-2">
                <Text className="text-secondary font-bold uppercase tracking-widest text-[10px]">{currentItem.category}</Text>
              </View>
              <Text className="text-3xl font-bold text-secondary">{currentItem.name}</Text>
            </View>
            <Text className="text-3xl font-bold text-primary">Rs. {currentItem.price}</Text>
          </View>


          <View className="flex-row items-center mt-4 space-x-6">
            <TouchableOpacity 
              onPress={() => {
                setEditingReview(null);
                setIsReviewModalVisible(true);
              }}
              className="flex-row items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100"
            >
              <Star size={18} color="#ff5a5f" fill="#ff5a5f" />
              <Text className="ml-1 font-bold text-secondary">{currentItem.rating || '0.0'}</Text>
              <Text className="ml-1 text-gray-400 text-xs">({reviews.length})</Text>
              <View className="w-[1px] h-4 bg-gray-200 mx-3" />
              <Text className="text-secondary font-bold text-xs">Add Review</Text>
            </TouchableOpacity>
            <View className="flex-row items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <Clock size={18} color="gray" />
              <Text className="ml-1 text-gray-500 text-xs">{currentItem.preparationTime} min</Text>
            </View>
          </View>



          <View className="mt-8">
            <Text className="text-lg font-bold text-secondary mb-3">Description</Text>
            <Text className="text-gray-500 leading-6 text-sm">{currentItem.description}</Text>
          </View>

          {currentItem.ingredients && currentItem.ingredients.length > 0 && (
            <View className="mt-8">
              <Text className="text-lg font-bold text-secondary mb-3">Ingredients</Text>
              <View className="flex-row flex-wrap">
                {currentItem.ingredients.map((ing, idx) => (
                  <View key={idx} className="bg-gray-100 px-4 py-2 rounded-full mr-2 mb-2">
                    <Text className="text-gray-600 text-xs font-medium">{ing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}



          <View className="mt-10">
            <Text className="text-lg font-bold text-secondary mb-4">Quantity</Text>
            <View className="flex-row items-center bg-gray-50 w-36 justify-between p-2 rounded-2xl border border-gray-100">
              <TouchableOpacity 
                onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm"
              >
                <Minus size={20} color="black" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-secondary">{quantity}</Text>
              <TouchableOpacity 
                onPress={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm"
              >
                <Plus size={20} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          {showRecs && recommendations.length > 0 && (
            <View className="mt-12">
              <Text className="text-xl font-bold text-secondary mb-6">You also may Like</Text>
              <View className="flex-row flex-wrap -mx-2">
                {recommendations.map((rec) => (
                  <TouchableOpacity 
                    key={rec._id}
                    onPress={() => navigation.push('MenuItemDetail', { 
                      item: rec, 
                      restaurantId: rec.restaurantId?._id || rec.restaurantId,
                      fromExplore: false 
                    })}
                    className="w-1/2 px-2 mb-4"
                  >
                    <View className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                      <Image source={{ uri: rec.image }} className="w-full h-28" resizeMode="cover" />
                      <View className="p-3">
                        <Text className="font-bold text-secondary text-xs" numberOfLines={1}>{rec.name}</Text>
                        <View className="flex-row items-center mt-1">
                          <Star size={10} color="#ffb800" fill="#ffb800" />
                          <Text className="text-[10px] text-gray-400 ml-1">{rec.rating || '0.0'}</Text>
                        </View>
                        <Text className="text-primary font-bold text-xs mt-1">Rs. {rec.price}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View className="mt-12">
            <Text className="text-xl font-bold text-secondary mb-6">Customer Reviews</Text>
            <ReviewList 
                reviews={reviews} 
                currentUserId={user?._id} 
                onEdit={(review) => {
                  setEditingReview(review);
                  setIsReviewModalVisible(true);
                }}
                onDeleteSuccess={fetchData}
              />
          </View>
        </View>
      </ScrollView>

      <ReviewModal 
        isVisible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        restaurantId={restaurantId || currentItem?.restaurantId}
        menuItemId={currentItem._id}
        editingReview={editingReview}
        onSucess={() => {
          fetchData();
          if (showRecs) fetchRecommendations();
        }}
      />


      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity 
          onPress={handleAddToCart}
          className="bg-primary flex-row items-center justify-between p-5 rounded-3xl shadow-2xl shadow-primary/40"
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2 rounded-xl mr-3">
              <ShoppingBag size={20} color="white" />
            </View>
            <Text className="text-white font-bold text-lg">Add to Cart</Text>
          </View>
          <Text className="text-white font-bold text-lg">Rs. {(currentItem.price * quantity).toFixed(2)}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default MenuItemDetailScreen;
