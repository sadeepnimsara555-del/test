import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, MapPin, Phone, Star, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import api from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import ReviewList from '../components/ReviewList';


const RestaurantDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  const { addToCart, cart, cartTotal } = useContext(CartContext);
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Appetizers');
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);


  const categories = ['Appetizers', 'Main Course', 'Fast Food', 'Desserts', 'Drinks'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resData, menuData, reviewData] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/menu/restaurant/${id}`),
        api.get(`/reviews/restaurant/${id}`)
      ]);
      setRestaurant(resData.data);
      setMenu(menuData.data);
      setReviews(reviewData.data);
    } catch (error) {

      console.log('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = menu.filter(item => 
    activeCategory === 'All' || item.category === activeCategory
  );

  const MenuItem = ({ item }) => {
    const cartItem = cart.find(i => i._id === item._id);
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('MenuItemDetail', { item, restaurantId: id })}
        className="bg-white p-4 rounded-3xl mb-4 flex-row border border-gray-100 shadow-sm overflow-hidden"
      >
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
          className="w-24 h-24 rounded-2xl"
        />
        <View className="flex-1 ml-4 justify-between">
          <View>
            <Text className="text-lg font-bold text-secondary">{item.name}</Text>
            <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>{item.description}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-primary font-bold text-lg">Rs. {item.price}</Text>
            <TouchableOpacity 
              onPress={() => addToCart(item, id)}
              className="bg-primary w-8 h-8 rounded-full items-center justify-center"
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ff5a5f" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View className="relative">
          <Image 
            source={{ uri: restaurant?.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800' }} 
            className="w-full h-64"
            resizeMode="cover"
          />
          <View className="absolute bottom-0 left-0 right-0 h-32 bg-black/5" />
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')}
            className="absolute top-12 left-6 w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-lg"
          >
            <ArrowLeft size={20} color="black" />
          </TouchableOpacity>
          
          <View className="absolute -bottom-10 left-6">
            <Image 
              source={{ uri: restaurant?.logo || 'https://ui-avatars.com/api/?name='+encodeURIComponent(restaurant?.name)+'&background=random' }} 
              className="w-24 h-24 rounded-full border-4 border-white shadow-2xl"
            />
          </View>
        </View>

        <View className="bg-gray-50 -mt-10 rounded-t-[40px] px-6 pt-12">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-secondary">{restaurant?.name}</Text>
              <View className="flex-row items-center mt-2">
                <MapPin size={14} color="gray" />
                <Text className="text-gray-500 text-sm ml-1">{restaurant?.address}</Text>
              </View>
            </View>
            <View className="bg-white p-3 rounded-2xl items-center shadow-sm border border-gray-100">
              <Star size={18} color="#ff5a5f" fill="#ff5a5f" />
              <Text className="text-secondary font-bold text-xs mt-1">{restaurant?.rating || '0.0'}</Text>
            </View>

          </View>

          <View className="flex-row justify-between mt-6 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <View className="items-center flex-1 border-r border-gray-100">
              <Clock size={20} color="#ff5a5f" />
              <Text className="text-secondary font-bold mt-1 text-xs">30-40 min</Text>
            </View>
            <TouchableOpacity 
              onPress={() => restaurant?.contactNumber && Linking.openURL(`tel:${restaurant.contactNumber}`)}
              className="items-center flex-1 border-r border-gray-100"
            >
              <Phone size={20} color="#ff5a5f" />
              <Text className="text-secondary font-bold mt-1 text-xs">Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setEditingReview(null);
                setIsReviewModalVisible(true);
              }}
              className="items-center flex-1"
            >
              <Star size={20} color="#ff5a5f" />
              <Text className="text-secondary font-bold mt-1 text-xs">Review</Text>
            </TouchableOpacity>
          </View>


          <View className="mt-8">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => setActiveCategory(item)}
                  className={`px-6 py-3 rounded-2xl mr-3 ${activeCategory === item ? 'bg-secondary' : 'bg-white border border-gray-100'}`}
                >
                  <Text className={`font-bold text-xs ${activeCategory === item ? 'text-white' : 'text-gray-500'}`}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <View className="mt-8">
            <Text className="text-xl font-bold text-secondary mb-4">Menu Items</Text>
            {filteredMenu.map(item => (
              <MenuItem key={item._id} item={item} />
            ))}
          </View>

          <View className="mt-8 pb-32">
            <Text className="text-xl font-bold text-secondary mb-4">Customer Reviews</Text>
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
        restaurantId={id}
        editingReview={editingReview}
        onSucess={fetchData}
      />


      {cart.length > 0 && (
        <View className="absolute bottom-10 left-6 right-6">
          <TouchableOpacity 
            onPress={() => navigation.navigate('Cart')}
            className="bg-primary flex-row items-center justify-between p-5 rounded-3xl shadow-2xl shadow-primary/40"
          >
            <View className="flex-row items-center">
              <View className="bg-white/20 p-2 rounded-xl mr-3">
                <ShoppingBag size={20} color="white" />
              </View>
              <View>
                <Text className="text-white font-bold">{cart.length} Items</Text>
                <Text className="text-white/80 text-xs">View your cart</Text>
              </View>
            </View>
            <Text className="text-white font-bold text-lg">Rs. {cartTotal.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default RestaurantDetailScreen;
