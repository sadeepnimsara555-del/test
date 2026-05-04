import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Clock, Star, MapPin, ShoppingBag } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';
import api from '../services/api';
import ChatBot from '../components/ChatBot';


const ExploreScreen = ({ navigation }) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('For You');
  const categories = ['For You', 'All', 'Appetizers', 'Main Course', 'Fast Food', 'Desserts', 'Drinks'];

  useFocusEffect(
    useCallback(() => {
      fetchFoods();
    }, [activeCategory])
  );

  const fetchFoods = async () => {
    try {
      setLoading(true);
      if (activeCategory === 'For You') {
        const response = await api.get('/menu/recommendations');
        setFoods(response.data);
      } else {
        const response = await api.get('/menu/all');
        setFoods(response.data);
      }
    } catch (error) {
      console.log('Error fetching foods', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeCategory === 'All' || activeCategory === 'For You' || food.category === activeCategory)
  );

  const { cart, cartTotal } = useContext(CartContext);

  const FoodCard = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('MenuItemDetail', { 
        item, 
        restaurantId: item.restaurantId?._id || item.restaurantId,
        fromExplore: true,
        isRecommended: activeCategory === 'For You'
      })}
      className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-100 shadow-sm flex-1 mx-1.5"
      style={{ maxWidth: '46%' }}
    >
      <View className="relative">
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/300' }} 
          className="w-full h-32"
          resizeMode="cover"
        />
        {activeCategory === 'For You' && (
          <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded-lg">
            <Text className="text-[8px] font-bold text-white uppercase">Recommended</Text>
          </View>
        )}
          <View className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-lg flex-row items-center">
          <Star size={10} color="#ffb800" fill="#ffb800" />
          <Text className="text-[10px] font-bold ml-0.5">{item.rating || '0.0'}</Text>
        </View>

      </View>
      <View className="p-3">
        <Text className="text-secondary font-bold text-sm" numberOfLines={1}>{item.name}</Text>
        <Text className="text-gray-400 text-[10px] mt-1" numberOfLines={1}>{item.category}</Text>
        
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-primary font-bold text-sm">Rs. {item.price}</Text>
          <View className="flex-row items-center">
            <Clock size={10} color="gray" />
            <Text className="text-gray-400 text-[10px] ml-1">{item.preparationTime}m</Text>
          </View>
        </View>

        {item.restaurantId && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.restaurantId._id })}
            className="flex-row items-center mt-3 pt-2 border-t border-gray-50"
          >
            <Image 
              source={{ uri: item.restaurantId.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.restaurantId.name) }} 
              className="w-4 h-4 rounded-full"
            />
            <Text className="text-gray-500 text-[9px] font-medium ml-1 flex-1" numberOfLines={1}>
              {item.restaurantId.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1">
        <FlatList
          ListHeaderComponent={
            <View className="px-6 pt-4 pb-2">
              <Text className="text-3xl font-bold text-secondary">Explore Foods</Text>
              <Text className="text-gray-500 text-sm mt-1">Discover dishes from all restaurants</Text>
              
              <View className="flex-row mt-6 space-x-3">
                <View className="flex-1 bg-white flex-row items-center px-4 rounded-2xl shadow-sm border border-gray-100">
                  <Search size={20} color="gray" />
                  <TextInput 
                    className="flex-1 h-12 ml-2"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                className="mt-6 -mx-6 px-6"
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity 
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-2xl mr-3 ${activeCategory === cat ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white border border-gray-100'}`}
                  >
                    <Text className={`font-bold text-xs ${activeCategory === cat ? 'text-white' : 'text-gray-500'}`}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          data={filteredFoods}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FoodCard item={item} />}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 18 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator size="large" color="#ff5a5f" className="mt-20" />
            ) : (
              <View className="items-center justify-center mt-20">
                <Text className="text-gray-400">No foods found</Text>
              </View>
            )
          }
          ListFooterComponent={<View className="h-24" />}
        />
      </SafeAreaView>

      {cart.length > 0 && (
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity 
            onPress={() => navigation.navigate('CartTab')}
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

      <ChatBot />
    </View>
  );
};


export default ExploreScreen;
