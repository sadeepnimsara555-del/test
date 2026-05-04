import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const SplashScreen = () => {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-4xl font-bold text-primary mb-4">FoodieExpress</Text>
      <ActivityIndicator size="large" color="#ff5a5f" />
    </View>
  );
};

export default SplashScreen;
