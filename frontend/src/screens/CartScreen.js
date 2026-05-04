import React, { useContext } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Plus, Minus, CreditCard, ChevronRight } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';

const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useContext(CartContext);

  const CartItem = ({ item }) => (
    <View className="bg-white p-4 rounded-3xl mb-4 flex-row shadow-sm border border-gray-100">
      <Image 
        source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
        className="w-20 h-20 rounded-2xl"
      />
      <View className="flex-1 ml-4 justify-between">
        <View className="flex-row justify-between">
          <Text className="text-lg font-bold text-secondary" numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeFromCart(item._id)}>
            <Trash2 size={18} color="#ff5a5f" />
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-primary font-bold text-lg">${item.price}</Text>
          <View className="flex-row items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
            <TouchableOpacity 
              onPress={() => updateQuantity(item._id, item.quantity - 1)}
              className="w-8 h-8 bg-white rounded-lg items-center justify-center"
            >
              <Minus size={16} color="black" />
            </TouchableOpacity>
            <Text className="mx-3 font-bold">{item.quantity}</Text>
            <TouchableOpacity 
              onPress={() => updateQuantity(item._id, item.quantity + 1)}
              className="w-8 h-8 bg-white rounded-lg items-center justify-center"
            >
              <Plus size={16} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-2xl font-bold text-secondary mb-2">Your cart is empty</Text>
        <Text className="text-gray-500 text-center mb-8">Looks like you haven't added anything to your cart yet.</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ExploreTab')}
          className="bg-primary px-8 py-4 rounded-full shadow-lg shadow-primary/20"
        >
          <Text className="text-white font-bold">Go Back Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')} 
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
        >
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">My Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text className="text-red-500 font-medium">Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {cart.map(item => (
          <CartItem key={item._id} item={item} />
        ))}
        
        <View className="mt-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-32">
          <Text className="text-lg font-bold text-secondary mb-4">Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="text-secondary font-bold">${cartTotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee ({new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size} x $2.50)</Text>
            <Text className="text-secondary font-bold">${(new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50).toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
            <Text className="text-lg font-bold text-secondary">Total</Text>
            <Text className="text-lg font-bold text-primary">
              ${(cartTotal + (new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50)).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity 
          onPress={() => navigation.navigate('Checkout')}
          className="bg-secondary flex-row items-center justify-between p-5 rounded-3xl shadow-2xl shadow-secondary/40"
        >
          <View className="flex-row items-center">
            <CreditCard size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-3">Checkout</Text>
          </View>
          <ChevronRight size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;
