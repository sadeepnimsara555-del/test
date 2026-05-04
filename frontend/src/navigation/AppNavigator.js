import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { Home, ClipboardList, User, ShoppingCart, Utensils, Store, Compass, MessageSquare, Navigation, Star, Wallet } from 'lucide-react-native';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import MenuItemDetailScreen from '../screens/MenuItemDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrdersHistoryScreen from '../screens/OrdersHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OwnerDashboard from '../screens/OwnerDashboard';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import DeliveryDashboard from '../screens/DeliveryDashboard';
import MyAccountScreen from '../screens/MyAccountScreen';
import PaymentDetailsScreen from '../screens/PaymentDetailsScreen';
import WithdrawalMethodsScreen from '../screens/WithdrawalMethodsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'HomeTab') return <Home color={color} size={size} />;
        if (route.name === 'ExploreTab') return <Compass color={color} size={size} />;
        if (route.name === 'CartTab') return <ShoppingCart color={color} size={size} />;
        if (route.name === 'OrdersTab') return <ClipboardList color={color} size={size} />;
        if (route.name === 'ProfileTab') return <User color={color} size={size} />;
      },
      tabBarActiveTintColor: '#ff5a5f',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
    <Tab.Screen name="ExploreTab" component={ExploreScreen} options={{ title: 'Explore' }} />
    <Tab.Screen name="CartTab" component={CartScreen} options={{ title: 'Cart' }} />
    <Tab.Screen name="OrdersTab" component={OrdersHistoryScreen} options={{ title: 'Orders' }} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const ManagerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'ManagerOrders') return <ClipboardList color={color} size={size} />;
        if (route.name === 'ManagerMenu') return <Utensils color={color} size={size} />;
        if (route.name === 'ManagerPayments') return <Wallet color={color} size={size} />;
        if (route.name === 'ManagerReviews') return <MessageSquare color={color} size={size} />;
        if (route.name === 'ManagerSetup') return <Store color={color} size={size} />;
        if (route.name === 'ManagerProfile') return <User color={color} size={size} />;
      },
      tabBarActiveTintColor: '#ff5a5f',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="ManagerOrders" component={OwnerDashboard} initialParams={{ initialTab: 'orders' }} options={{ title: 'Orders' }} />
    <Tab.Screen name="ManagerMenu" component={OwnerDashboard} initialParams={{ initialTab: 'menu' }} options={{ title: 'Menu' }} />
    <Tab.Screen name="ManagerPayments" component={OwnerDashboard} initialParams={{ initialTab: 'payments' }} options={{ title: 'Pay' }} />
    <Tab.Screen name="ManagerReviews" component={OwnerDashboard} initialParams={{ initialTab: 'reviews' }} options={{ title: 'Reviews' }} />
    <Tab.Screen name="ManagerSetup" component={OwnerDashboard} initialParams={{ initialTab: 'settings' }} options={{ title: 'Setup' }} />
    <Tab.Screen name="ManagerProfile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const DeliveryTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'DeliveryActive') return <Navigation color={color} size={size} />;
        if (route.name === 'DeliveryFind') return <Compass color={color} size={size} />;
        if (route.name === 'DeliveryReviews') return <Star color={color} size={size} />;
        if (route.name === 'DeliveryHistory') return <ClipboardList color={color} size={size} />;
        if (route.name === 'DeliveryProfile') return <User color={color} size={size} />;
      },
      tabBarActiveTintColor: '#ff5a5f',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="DeliveryActive" component={DeliveryDashboard} initialParams={{ activeTab: 'active' }} options={{ title: 'Active' }} />
    <Tab.Screen name="DeliveryFind" component={DeliveryDashboard} initialParams={{ activeTab: 'available' }} options={{ title: 'Find Orders' }} />
    <Tab.Screen name="DeliveryReviews" component={DeliveryDashboard} initialParams={{ activeTab: 'reviews' }} options={{ title: 'Reviews' }} />
    <Tab.Screen name="DeliveryHistory" component={DeliveryDashboard} initialParams={{ activeTab: 'history' }} options={{ title: 'History' }} />
    <Tab.Screen name="DeliveryProfile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  const linking = {
    prefixes: ['foodieapp://'],
    config: {
      screens: {
        MenuItemDetail: 'menu/:id',
      },
    },
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </Stack.Group>
        ) : user?.role === 'restaurant_owner' ? (
          <Stack.Group>
            <Stack.Screen name="MainManager" component={ManagerTabs} />
            <Stack.Screen name="MyAccount" component={MyAccountScreen} />
            <Stack.Screen name="WithdrawalMethods" component={WithdrawalMethodsScreen} />
          </Stack.Group>
        ) : user?.role === 'delivery' ? (
          <Stack.Group>
            <Stack.Screen name="DeliveryHome" component={DeliveryTabs} />
            <Stack.Screen name="MyAccount" component={MyAccountScreen} />
            <Stack.Screen name="WithdrawalMethods" component={WithdrawalMethodsScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
            <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="MyAccount" component={MyAccountScreen} />
            <Stack.Screen name="PaymentDetails" component={PaymentDetailsScreen} />
            <Stack.Screen name="WithdrawalMethods" component={WithdrawalMethodsScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
