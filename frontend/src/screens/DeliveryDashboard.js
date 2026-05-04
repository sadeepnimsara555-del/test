import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, Image, Modal, TextInput, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Navigation, CheckCircle, Clock, MapPin, Package, History, Star, DollarSign, Globe, CreditCard, Check, X, FileText } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const DeliveryDashboard = ({ navigation, route }) => {
  const { activeTab: propTab } = route.params || {};
  const { user, logout, updateProfile, updateProfileLocal } = useContext(AuthContext);
  const activeTab = propTab || 'active'; // 'active', 'available', 'history'
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [stats, setStats] = useState({ history: [], totalDeliveries: 0, totalEarnings: 0 });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Withdrawal States
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [isFullLogsModalVisible, setIsFullLogsModalVisible] = useState(false);

  // Map / Navigation States
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [customerAddressText, setCustomerAddressText] = useState('');
  const mapRef = useRef(null);
  const [mapDestinationLabel, setMapDestinationLabel] = useState('Destination');

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [activeTab, user?.isOnline])
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const activeRes = await api.get('/delivery/active');
      setActiveOrder(activeRes.data);

      if (activeTab === 'available' && user?.isOnline && !activeRes.data) {
        const availableRes = await api.get('/delivery/available');
        setAvailableOrders(availableRes.data);
      } else if (activeTab === 'history') {
        const statsRes = await api.get('/delivery/stats');
        setStats(statsRes.data);
      } else if (activeTab === 'reviews') {
        const reviewsRes = await api.get('/delivery-reviews/driver');
        setReviews(reviewsRes.data);
      }
    } catch (e) {
      console.log('Error fetching delivery data', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async (newValue) => {
    try {
      if (!newValue && activeOrder) {
        Alert.alert('Cannot go offline', 'Please complete your active delivery first.');
        return;
      }
      
      // OPTIMISTIC UPDATE: Update UI instantly across all tabs
      updateProfileLocal({ ...user, isOnline: newValue });
      
      // SYNC WITH SERVER: Only call the specific status endpoint
      await api.put('/delivery/status', { isOnline: newValue });
    } catch (e) {
      console.log('Error toggling status', e);
      // REVERT ON FAILURE: Bring back the old status if server fails
      updateProfileLocal({ ...user, isOnline: !newValue });
      Alert.alert('Status Error', e.response?.data?.message || 'Could not update online status. Please check your connection.');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.put(`/delivery/accept/${orderId}`);
      fetchDashboardData(); // Refresh - active order will now appear on Active tab
    } catch (e) {
      Alert.alert('Failed to accept', e.response?.data?.message || 'Order may have been taken by another driver.');
      fetchDashboardData();
    }
  };

  const handleWithdraw = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 20) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal amount is $20.00');
      return;
    }

    if (amt > stats.totalEarnings) {
      Alert.alert('Insufficient Balance', `You can only withdraw up to $${stats.totalEarnings.toFixed(2)}`);
      return;
    }

    setWithdrawLoading(true);
    try {
      // Actually call the backend now
      await api.post('/delivery/withdraw', { 
        amount: amt, 
        method: selectedMethod 
      });

      // Simulate the 3s delay for "processing" feel as requested
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setWithdrawSuccess(true);
      fetchDashboardData(); // Refresh stats to update balance
    } catch (e) {
      Alert.alert('Withdrawal Error', e.response?.data?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/delivery/progress/${orderId}`, { status: newStatus });
      fetchDashboardData();
    } catch (e) {
      Alert.alert('Update failed', 'Could not update delivery status.');
    }
  };

  // Geocoding with multi-service fallback: Nominatim → Photon → stripped parts
  const geocodeAddress = async (address) => {
    if (!address || !address.trim()) return null;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- Nominatim fetch (OSM, rate-limited at 1 req/sec) ---
    const nominatimFetch = async (query) => {
      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
          { headers: { 'User-Agent': 'DeliveryDriverApp/1.0', 'Accept': 'application/json' } }
        );
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json') && !ct.includes('text/json')) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
      } catch (e) { /* silently skip */ }
      return null;
    };

    // --- Photon fetch (Komoot, different OSM engine, no strict rate limit) ---
    const photonFetch = async (query) => {
      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encoded}&limit=1&lang=en`,
          { headers: { 'Accept': 'application/json' } }
        );
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json') && !ct.includes('text/json')) return null;
        const data = await res.json();
        if (data?.features?.length > 0) {
          const [lon, lat] = data.features[0].geometry.coordinates;
          return { latitude: lat, longitude: lon };
        }
      } catch (e) { /* silently skip */ }
      return null;
    };

    const parts = address.split(',').map(p => p.trim()).filter(Boolean);

    // Round 1: Try full address on Nominatim
    let result = await nominatimFetch(address);
    if (result) return result;
    await delay(1200); // respect rate limit before next Nominatim call

    // Round 2: Try full address on Photon (different service, more lenient)
    result = await photonFetch(address);
    if (result) return result;

    // Round 3: Strip landmark/shop (first part) → try Photon
    if (parts.length > 1) {
      const stripped = parts.slice(1).join(', ');
      result = await photonFetch(stripped);
      if (result) return result;
    }

    // Round 4: Last 2 parts (street + city) → try Photon
    if (parts.length > 2) {
      const lastTwo = parts.slice(-2).join(', ');
      result = await photonFetch(lastTwo);
      if (result) return result;
    }

    // Round 5: Last part only (city name) → Photon
    if (parts.length >= 1) {
      const city = parts[parts.length - 1];
      if (city.length > 2) {
        result = await photonFetch(city + ', Sri Lanka');
        if (result) return result;
      }
    }

    // Round 6: Strip landmark → Nominatim (last resort)
    if (parts.length > 1) {
      await delay(1200);
      result = await nominatimFetch(parts.slice(1).join(', '));
      if (result) return result;
    }

    return null;
  };

  // Fetch a road route via OSRM (free, no API key needed)
  const fetchRoute = async (origin, destination) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));
        return coords;
      }
      return [origin, destination];
    } catch (e) {
      console.log('Route fetch error', e);
      return [origin, destination];
    }
  };

  const openMapForDelivery = async (order) => {
    setMapLoading(true);
    setIsMapModalVisible(true);
    setRouteCoords([]);
    setDriverLocation(null);
    setCustomerLocation(null);
    setCustomerAddressText(order.deliveryAddress || '');
    setMapDestinationLabel('Customer');

    try {
      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Please enable location access so we can show your position on the map.',
          [
            { text: 'Cancel', onPress: () => setIsMapModalVisible(false), style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Platform.OS === 'ios'
                  ? Linking.openURL('app-settings:')
                  : Linking.openSettings();
              },
            },
          ]
        );
        setMapLoading(false);
        return;
      }

      // 2. Get current driver location
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const driverCoords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setDriverLocation(driverCoords);

      // 3. Geocode customer delivery address (never block - gracefully degrade)
      const custCoords = await geocodeAddress(order.deliveryAddress);
      if (custCoords) {
        setCustomerLocation(custCoords);
      }
      // If geocoding failed, map still opens showing driver location + address text banner

      // 4. Fetch driving route only if geocoding succeeded
      if (custCoords) {
        const route = await fetchRoute(driverCoords, custCoords);
        setRouteCoords(route);
      }

      // 5. Fit map to show both markers
      setTimeout(() => {
        if (mapRef.current && driverCoords && custCoords) {
          mapRef.current.fitToCoordinates([driverCoords, custCoords], {
            edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
            animated: true,
          });
        }
      }, 600);
    } catch (e) {
      console.log('Map open error', e);
      Alert.alert('Error', 'Could not load the map. Please try again.');
      setIsMapModalVisible(false);
    } finally {
      setMapLoading(false);
    }
  };

  // Generic: open map for any address (used in available card for restaurant & customer preview)
  const openMapToAddress = async (address, label) => {
    setMapLoading(true);
    setIsMapModalVisible(true);
    setRouteCoords([]);
    setDriverLocation(null);
    setCustomerLocation(null);
    setCustomerAddressText(address || '');
    setMapDestinationLabel(label || 'Destination');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Please enable location access to see the map.',
          [
            { text: 'Cancel', onPress: () => setIsMapModalVisible(false), style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings(),
            },
          ]
        );
        setMapLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const driverCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setDriverLocation(driverCoords);

      const destCoords = await geocodeAddress(address);
      if (destCoords) {
        setCustomerLocation(destCoords);
        const route = await fetchRoute(driverCoords, destCoords);
        setRouteCoords(route);
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates([driverCoords, destCoords], {
              edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
              animated: true,
            });
          }
        }, 600);
      }
    } catch (e) {
      console.log('openMapToAddress error', e);
      Alert.alert('Error', 'Could not load the map. Please try again.');
      setIsMapModalVisible(false);
    } finally {
      setMapLoading(false);
    }
  };

  const renderAvailableCard = (order) => (
    <View key={order._id} className="bg-white p-5 rounded-[32px] mb-6 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <Text className="font-bold text-secondary text-lg">Order #{order._id.substring(0, 8)}</Text>
          <Text className="text-gray-400 text-xs mt-1">{new Date(order.createdAt).toLocaleTimeString()}</Text>
        </View>
        <Text className="text-primary font-black text-xl">${order.totalAmount}</Text>
      </View>

      <View className="bg-gray-50 p-4 rounded-3xl mb-5">
        {/* Restaurant / Pickup row */}
        <View className="flex-row items-start mb-4">
          <View className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <MapPin size={16} color="#ff5a5f" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pickup From</Text>
            <Text className="text-sm font-bold text-secondary">{order.restaurant.name}</Text>
            <Text className="text-xs text-gray-500 leading-4">{order.restaurant.address}</Text>
          </View>
          <TouchableOpacity
            onPress={() => openMapToAddress(order.restaurant.address, 'Restaurant')}
            style={{
              backgroundColor: 'white',
              padding: 8,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#f1f5f9',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
              elevation: 2,
              alignSelf: 'center',
              marginLeft: 8,
            }}
          >
            <Navigation size={14} color="#ff5a5f" />
          </TouchableOpacity>
        </View>

        {/* Customer / Deliver To row */}
        <View className="flex-row items-start">
          <View className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <Navigation size={16} color="#4ade80" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-[10px] text-gray-400 font-bold uppercase mb-1">Deliver To</Text>
            <Text className="text-sm font-bold text-secondary">{order.user.name}</Text>
            <Text className="text-xs text-gray-500 leading-4">{order.deliveryAddress}</Text>
          </View>
          <TouchableOpacity
            onPress={() => openMapToAddress(order.deliveryAddress, 'Customer')}
            style={{
              backgroundColor: 'white',
              padding: 8,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#f1f5f9',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
              elevation: 2,
              alignSelf: 'center',
              marginLeft: 8,
            }}
          >
            <Navigation size={14} color="#4ade80" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleAcceptOrder(order._id)}
        className="bg-primary p-5 rounded-2xl items-center shadow-lg shadow-primary/30"
      >
        <Text className="text-white font-bold tracking-widest uppercase">Accept Delivery</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActiveCard = (order) => {
    const statusMap = {
      'accepted': { next: 'picked_up', label: 'Confirm Pickup', color: 'bg-amber-500', icon: Package, desc: 'Head to the restaurant to pick up the order' },
      'picked_up': { next: 'on_the_way', label: 'Start Delivery', color: 'bg-sky-500', icon: Navigation, desc: 'Order picked up. Start heading to customer address' },
      'on_the_way': { next: 'delivered', label: 'Mark as Delivered', color: 'bg-emerald-500', icon: CheckCircle, desc: 'Order handed over to the customer' }
    };
    
    const currentPhase = statusMap[order.orderStatus];

    return (
      <View className="bg-white p-6 rounded-[40px] mb-6 shadow-sm border border-gray-100 mt-4">
        <View className="flex-row justify-between items-center mb-6">
           <View>
              <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Active Task</Text>
              <Text className="text-xl font-bold text-secondary">Current Mission</Text>
           </View>
           <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary font-bold text-[10px] uppercase">{order.orderStatus.replace(/_/g, ' ')}</Text>
           </View>
        </View>

        <View className="bg-gray-50 p-6 rounded-3xl mb-6">
          <View className="flex-row items-center mb-8">
            <View className="items-center">
              <View className={`w-3 h-3 rounded-full ${['accepted', 'picked_up', 'on_the_way'].includes(order.orderStatus) ? 'bg-primary' : 'bg-gray-200'}`} />
              <View className={`w-[2px] h-10 ${['picked_up', 'on_the_way'].includes(order.orderStatus) ? 'bg-primary' : 'bg-gray-200'} my-1`} />
              <View className={`w-3 h-3 rounded-full ${['on_the_way', 'delivered'].includes(order.orderStatus) ? 'bg-primary' : 'bg-gray-200'}`} />
            </View>
            <View className="ml-5 flex-1">
              <View className="mb-4">
                 <Text className="text-[10px] text-gray-400 font-bold uppercase">Pickup</Text>
                 <Text className="text-sm font-bold text-secondary">{order.restaurant.name}</Text>
                 <Text className="text-xs text-gray-500" numberOfLines={1}>{order.restaurant.address}</Text>
              </View>
              <View>
                 <Text className="text-[10px] text-primary font-bold uppercase">Customer</Text>
                 <Text className="text-sm font-bold text-secondary">{order.user.name}</Text>
                 <Text className="text-xs text-gray-500" numberOfLines={1}>{order.deliveryAddress}</Text>
              </View>
            </View>
          </View>

          <View className="border-t border-gray-100 pt-4 flex-row justify-between items-center">
             <View>
                <Text className="text-[10px] text-gray-400 font-bold uppercase">
                  {order.orderStatus === 'accepted' ? 'Restaurant Phone' : 'Customer Phone'}
                </Text>
                <Text className="text-secondary font-bold">
                  {order.orderStatus === 'accepted'
                    ? (order.restaurant.contactNumber || 'N/A')
                    : (order.user.phone || 'N/A')}
                </Text>
             </View>
             <TouchableOpacity
               onPress={() =>
                 order.orderStatus === 'accepted'
                   ? openMapToAddress(order.restaurant.address, 'Restaurant')
                   : openMapForDelivery(order)
               }
               className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100"
             >
                <Navigation
                  size={20}
                  color={order.orderStatus === 'accepted' ? '#ff5a5f' : '#4ade80'}
                />
             </TouchableOpacity>
          </View>
        </View>

        {currentPhase ? (
          <View>
            <Text className="text-gray-400 text-center text-xs mb-4 italic px-4">{currentPhase.desc}</Text>
            <TouchableOpacity 
              onPress={() => handleStatusUpdate(order._id, currentPhase.next)}
              className={`p-5 rounded-2xl items-center flex-row justify-center shadow-lg ${currentPhase.color}`}
            >
              <currentPhase.icon size={22} color="white" style={{ marginRight: 10 }} />
              <Text className="text-white font-bold text-lg ml-2">{currentPhase.label}</Text>
            </TouchableOpacity>

            {order.orderStatus === 'accepted' && (
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    'Cancel Delivery?',
                    'This will release the order back to other drivers.',
                    [
                      { text: 'Keep it', style: 'cancel' },
                      { 
                        text: 'Yes, Release', 
                        style: 'destructive', 
                        onPress: () => handleStatusUpdate(order._id, 'ready_for_delivery') 
                      }
                    ]
                  );
                }}
                className="mt-4 p-3 items-center"
              >
                <Text className="text-red-400 font-bold">I can't complete this delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
           <View className="bg-gray-50 p-4 rounded-2xl items-center">
              <ActivityIndicator color="gray" />
              <Text className="text-gray-400 mt-2 text-sm italic">Synchronizing order status...</Text>
           </View>
        )}
      </View>
    );
  };

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100 shadow-sm">
        <View>
          <Text className="text-secondary font-bold text-xl">Driver: {user.name}</Text>
          <View className="flex-row items-center mt-1">
             <View className={`w-2 h-2 rounded-full ${user?.isOnline ? 'bg-green-500' : 'bg-gray-300'} mr-2`} />
             <Text className="text-gray-400 text-[10px] font-bold uppercase">{user?.isOnline ? 'Active Session' : 'Offline'}</Text>
          </View>
        </View>
        <View className="flex-row items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
           <Switch 
            value={user?.isOnline || false} 
            onValueChange={toggleOnline} 
            trackColor={{ false: '#e2e8f0', true: '#4ade80' }}
            thumbColor="white"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
           />
           <Text className={`font-bold text-[10px] ml-1 ${user?.isOnline ? 'text-green-600' : 'text-gray-400'}`}>ONLINE</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
        {loading ? (
          <View className="mt-20">
             <ActivityIndicator size="large" color="#ff5a5f" />
          </View>
        ) : (
          <>
            {activeTab === 'active' && (
              activeOrder ? renderActiveCard(activeOrder) : (
                <View className="items-center mt-20 opacity-40">
                  <View className="bg-gray-200 p-8 rounded-full mb-6">
                    <Navigation size={64} color="gray" />
                  </View>
                  <Text className="text-secondary font-bold text-xl">Idle Status</Text>
                  <Text className="text-gray-500 text-center mt-2 w-2/3 leading-5">No task assigned. Enable online status and check the "Find" tab for new jobs.</Text>
                </View>
              )
            )}

            {activeTab === 'available' && (
              !user?.isOnline ? (
                <View className="items-center mt-20">
                  <View className="bg-amber-50 p-8 rounded-full mb-6 border border-amber-100">
                    <Clock size={64} color="#f59e0b" />
                  </View>
                  <Text className="text-secondary font-bold text-xl">You are Offline</Text>
                  <Text className="text-gray-500 text-center mt-2 w-2/3 leading-5 text-sm">Please toggle the switch at the top to see available orders near you.</Text>
                </View>
              ) : activeOrder ? (
                <View className="bg-indigo-50 p-6 rounded-[32px] mt-4 border border-indigo-100 flex-row items-center">
                  <View className="bg-white p-3 rounded-2xl shadow-sm mr-4">
                     <Package size={24} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                     <Text className="text-indigo-900 font-bold">Delivery in Progress</Text>
                     <Text className="text-indigo-600/60 text-xs mt-1">Complete your current task to view more.</Text>
                  </View>
                </View>
              ) : availableOrders.length > 0 ? (
                <View className="pt-2">
                   <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-4 ml-1">Orders Waiting For Driver</Text>
                   {availableOrders.map(renderAvailableCard)}
                </View>
              ) : (
                <View className="items-center mt-20 opacity-30">
                   <Package size={80} color="gray" />
                   <Text className="text-secondary font-bold text-lg mt-4">Market is Quiet</Text>
                   <Text className="text-gray-500 text-center mt-1">Check back in a few minutes.</Text>
                </View>
              )
            )}

            {activeTab === 'history' && (
              <View className="pt-2">
                {/* Premium Wallet Header */}
                <View className="bg-secondary p-8 rounded-[45px] shadow-2xl shadow-secondary/30 mb-8 overflow-hidden">
                   <View className="flex-row justify-between items-start mb-6">
                      <View>
                        <Text className="text-white/60 text-[10px] font-bold uppercase tracking-[2px] mb-1">Available Balance</Text>
                        <Text className="text-4xl font-black text-white">${stats.totalEarnings.toFixed(2)}</Text>
                      </View>
                      <View className="flex-row space-x-2">
                        <TouchableOpacity onPress={() => setIsFullLogsModalVisible(true)} className="bg-white/10 p-3 rounded-2xl">
                          <FileText size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsTransactionModalVisible(true)} className="bg-white/10 p-3 rounded-2xl">
                          <History size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                   </View>

                   <TouchableOpacity 
                    onPress={() => {
                      if (stats.totalEarnings < 20) {
                        Alert.alert('Minimum Balance Required', 'You need to earn at least $20.00 (Received) to request a withdrawal.');
                        return;
                      }
                      if (!user.withdrawalMethods || user.withdrawalMethods.length === 0) {
                        Alert.alert('No Payment Method', 'Please add a payment method in your profile page first.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Go to Profile', onPress: () => navigation.navigate('WithdrawalMethods') }
                        ]);
                        return;
                      }
                      setIsWithdrawModalVisible(true);
                    }}
                    className={`p-5 rounded-3xl flex-row items-center justify-center ${stats.totalEarnings >= 20 ? 'bg-primary' : 'bg-white/10'}`}
                   >
                      <DollarSign size={20} color="white" />
                      <Text className="text-white font-black text-base ml-2">Withdraw Earnings</Text>
                   </TouchableOpacity>
                </View>

                {/* Quick Stats Chips */}
                <View className="flex-row space-x-3 mb-10 px-1">
                   <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row items-center">
                      <View className="bg-orange-50 p-2 rounded-xl mr-3">
                        <Clock size={16} color="#f97316" />
                      </View>
                      <View>
                        <Text className="text-[8px] text-gray-400 font-bold uppercase">Pending</Text>
                        <Text className="text-secondary font-black text-sm">${(stats.pendingEarnings || 0).toFixed(2)}</Text>
                      </View>
                   </View>
                   {stats.totalEarnings < 20 && (
                     <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row items-center">
                        <View className="bg-emerald-50 p-2 rounded-xl mr-3">
                          <CheckCircle size={16} color="#10b981" />
                        </View>
                        <View>
                          <Text className="text-[8px] text-gray-400 font-bold uppercase">To Unlock</Text>
                          <Text className="text-secondary font-black text-sm">${(20 - stats.totalEarnings).toFixed(2)}</Text>
                        </View>
                     </View>
                   )}
                </View>
                
                <Text className="font-bold text-secondary text-lg mb-5 ml-1">Current Active Earnings</Text>
                {stats.history.length > 0 ? stats.history.map(order => (
                  <View key={order._id} className="bg-white p-5 rounded-3xl mb-4 border border-gray-100 flex-row justify-between items-center shadow-sm">
                    <View className="flex-1">
                      <Text className="font-bold text-secondary text-base">Order #{order._id.substring(0,8).toUpperCase()}</Text>
                      <View className="flex-row items-center mt-1">
                         <Clock size={12} color="gray" />
                         <Text className="text-xs text-gray-400 ml-1">{new Date(order.updatedAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-black size-xl ${order.deliveryFeeStatus === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                        +${(order.deliveryFee || 0).toFixed(2)}
                      </Text>
                      <View className={`px-2 py-1 rounded-lg mt-1 ${order.deliveryFeeStatus === 'paid' ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                        <Text className={`text-[8px] font-bold uppercase ${order.deliveryFeeStatus === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {order.deliveryFeeStatus === 'paid' ? 'Received' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )) : (
                   <View className="items-center mt-10">
                      <History size={40} color="lightgray" />
                      <Text className="text-gray-400 mt-4 italic">No completed jobs yet</Text>
                   </View>
                )}

                <View className="h-10" />

                <View className="h-10" />
              </View>
            )}

            {activeTab === 'reviews' && (
              <View className="pt-2">
                <View className="bg-white p-8 rounded-[40px] mb-8 border border-gray-100 items-center shadow-sm">
                   <Text className="text-secondary font-black text-5xl">
                      {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '5.0'}
                   </Text>
                   <View className="flex-row space-x-1 my-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} color="#4ade80" fill={star <= Math.round(reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 5) ? '#4ade80' : 'transparent'} />
                      ))}
                   </View>
                   <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Average Road Rating</Text>
                   <Text className="text-gray-300 text-[10px] mt-1">Based on {reviews.length} feedback drops</Text>
                </View>

                <Text className="font-bold text-secondary text-lg mb-5 ml-1">Customer Feedback</Text>
                {reviews.length > 0 ? reviews.map(review => (
                  <View key={review._id} className="bg-white p-6 rounded-3xl mb-5 shadow-sm border border-gray-100">
                    <View className="flex-row justify-between items-start mb-4">
                       <View className="flex-row items-center">
                          <Image source={{ uri: review.user.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.user.name || 'User') }} className="w-10 h-10 rounded-full" />
                          <View className="ml-3">
                             <Text className="font-bold text-secondary">{review.user.name}</Text>
                             <Text className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</Text>
                          </View>
                       </View>
                       <View className="bg-green-50 px-3 py-1 rounded-full flex-row items-center">
                          <Star size={10} color="#4ade80" fill="#4ade80" />
                          <Text className="text-[10px] font-bold text-green-700 ml-1">{review.rating}.0</Text>
                       </View>
                    </View>
                    <Text className="text-gray-600 text-sm italic leading-5">"{review.comment}"</Text>
                    
                    {review.order && (
                      <View className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between">
                         <Text className="text-[10px] text-gray-400 font-bold uppercase">Job ID: {review.order._id.toString().substring(0,8).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                )) : (
                   <View className="items-center mt-10 opacity-30">
                      <Star size={48} color="gray" />
                      <Text className="text-secondary font-bold text-lg mt-4">No reviews yet</Text>
                      <Text className="text-gray-500 text-center mt-1 px-10 leading-4">Your rating will appear here once customers provide feedback on your deliveries.</Text>
                   </View>
                )}
                <View className="h-20" />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ───────────── Map Navigation Modal ───────────── */}
      <Modal visible={isMapModalVisible} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Map area */}
          {mapLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
              <ActivityIndicator size="large" color="#ff5a5f" />
              <Text style={{ marginTop: 16, color: '#666', fontSize: 14, fontWeight: '600' }}>Locating you & mapping route…</Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider={PROVIDER_GOOGLE}
              showsUserLocation={false}
              showsMyLocationButton={false}
              initialRegion={
                driverLocation
                  ? {
                      latitude: driverLocation.latitude,
                      longitude: driverLocation.longitude,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }
                  : {
                      latitude: 7.8731,
                      longitude: 80.7718,
                      latitudeDelta: 2,
                      longitudeDelta: 2,
                    }
              }
            >
              {/* Driver marker */}
              {driverLocation && (
                <Marker coordinate={driverLocation} title="You" description="Your current location" anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={{
                    backgroundColor: '#4ade80',
                    borderRadius: 24,
                    padding: 8,
                    borderWidth: 3,
                    borderColor: 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 6,
                  }}>
                    <Navigation size={18} color="white" />
                  </View>
                </Marker>
              )}

              {/* Customer destination marker */}
              {customerLocation && (
                <Marker coordinate={customerLocation} title="Customer" description={customerAddressText} anchor={{ x: 0.5, y: 1 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#ff5a5f',
                      borderRadius: 24,
                      padding: 10,
                      borderWidth: 3,
                      borderColor: 'white',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 6,
                    }}>
                      <MapPin size={18} color="white" />
                    </View>
                    <View style={{ width: 3, height: 10, backgroundColor: '#ff5a5f' }} />
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff5a5f' }} />
                  </View>
                </Marker>
              )}

              {/* Route polyline */}
              {routeCoords.length > 1 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#ff5a5f"
                  strokeWidth={4}
                  lineDashPattern={[0]}
                />
              )}
            </MapView>
          )}

          {/* Top bar */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: Platform.OS === 'ios' ? 54 : 40,
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: 'rgba(255,255,255,0.97)',
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 6,
          }}>
            <TouchableOpacity
              onPress={() => setIsMapModalVisible(false)}
              style={{
                backgroundColor: '#f1f5f9',
                borderRadius: 20,
                padding: 10,
                marginRight: 14,
              }}
            >
              <X size={20} color="#334155" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Navigating to {mapDestinationLabel}</Text>
              <Text style={{ color: '#1e293b', fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{customerAddressText}</Text>
            </View>
          </View>

          {/* Bottom legend card - geocoding succeeded */}
          {!mapLoading && driverLocation && customerLocation && (
            <View style={{
              position: 'absolute',
              bottom: 36,
              left: 20,
              right: 20,
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-around',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 10,
            }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#dcfce7', borderRadius: 12, padding: 8, marginBottom: 6 }}>
                  <Navigation size={18} color="#16a34a" />
                </View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>You</Text>
                <Text style={{ fontSize: 12, color: '#1e293b', fontWeight: '700', marginTop: 2 }}>Current Location</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#f1f5f9' }} />
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 8, marginBottom: 6 }}>
                  <MapPin size={18} color="#dc2626" />
                </View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{mapDestinationLabel}</Text>
                <Text style={{ fontSize: 12, color: '#1e293b', fontWeight: '700', marginTop: 2 }} numberOfLines={1}>Destination</Text>
              </View>
            </View>
          )}

          {/* Geocoding failed - show address text so driver can navigate manually */}
          {!mapLoading && driverLocation && !customerLocation && (
            <View style={{
              position: 'absolute',
              bottom: 36,
              left: 20,
              right: 20,
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ backgroundColor: '#fff7ed', borderRadius: 12, padding: 8, marginRight: 12 }}>
                  <MapPin size={20} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: '#f97316', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Deliver To (Navigate Manually)</Text>
                  <Text style={{ fontSize: 14, color: '#1e293b', fontWeight: '800', lineHeight: 20 }}>{customerAddressText}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#fff7ed', borderRadius: 14, padding: 10 }}>
                <Text style={{ fontSize: 11, color: '#c2410c', textAlign: 'center', fontWeight: '600', lineHeight: 16 }}>
                  Your location is pinned on the map above.{'\n'}Use the address above to navigate.
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal visible={isWithdrawModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[50px] p-8 pb-16">
            {!withdrawSuccess ? (
              <>
                <View className="flex-row justify-between items-center mb-10">
                  <View>
                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Cash Out</Text>
                    <Text className="text-3xl font-black text-secondary">Withdraw Funds</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsWithdrawModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                    <X size={20} color="gray" />
                  </TouchableOpacity>
                </View>

                <View className="bg-gray-50 p-6 rounded-[32px] mb-8 border border-gray-100">
                  <Text className="text-gray-400 text-center text-[10px] font-bold uppercase mb-2">Wallet Balance: ${stats.totalEarnings.toFixed(2)}</Text>
                  <View className="flex-row items-center justify-center bg-white p-4 rounded-2xl border border-gray-100">
                    <DollarSign size={24} color="#059669" />
                    <TextInput 
                      className="text-3xl font-black text-emerald-600 ml-1 min-w-[100px] text-center"
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={withdrawAmount}
                      onChangeText={setWithdrawAmount}
                      autoFocus
                    />
                  </View>
                  <Text className="text-gray-400 text-[8px] text-center mt-3 font-bold uppercase">Enter amount to withdraw (Min $20.00)</Text>
                </View>

                <Text className="font-bold text-secondary text-sm mb-4 ml-1">Select Destination</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10">
                  {user.withdrawalMethods?.map((method, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      onPress={() => setSelectedMethod(method)}
                      className={`mr-4 p-5 rounded-[28px] border-2 w-48 ${selectedMethod === method ? 'bg-secondary border-secondary' : 'bg-white border-gray-100'}`}
                    >
                      <View className="flex-row justify-between items-start mb-4">
                        <View className={`p-2 rounded-xl ${selectedMethod === method ? 'bg-white/20' : 'bg-gray-50'}`}>
                          {method.type === 'card' ? <CreditCard size={20} color={selectedMethod === method ? 'white' : 'gray'} /> : <Globe size={20} color={selectedMethod === method ? 'white' : 'gray'} />}
                        </View>
                        {selectedMethod === method && <CheckCircle size={20} color="white" />}
                      </View>
                      <Text className={`font-bold ${selectedMethod === method ? 'text-white' : 'text-secondary'}`}>
                        {method.type === 'card' ? `**** ${(method.details?.cardNumber || '').slice(-4) || '????'}` : 'PayPal'}
                      </Text>
                      <Text className={`text-[10px] mt-1 ${selectedMethod === method ? 'text-white/60' : 'text-gray-400'}`}>
                        {method.type === 'card' ? method.details.expiry : method.details.email}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity 
                  onPress={handleWithdraw}
                  disabled={withdrawLoading || !selectedMethod}
                  className={`p-6 rounded-[32px] items-center flex-row justify-center shadow-xl ${selectedMethod ? 'bg-emerald-500 shadow-emerald-100' : 'bg-gray-100 shadow-none'}`}
                >
                  {withdrawLoading ? <ActivityIndicator color="white" /> : (
                    <>
                      <DollarSign size={22} color="white" />
                      <Text className="text-white font-black text-lg ml-2">Request Payout</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center py-10">
                <View className="bg-emerald-50 p-10 rounded-full mb-8">
                  <Check size={80} color="#10b981" />
                </View>
                <Text className="text-3xl font-black text-secondary text-center mb-4">Payout Successful!</Text>
                <Text className="text-gray-500 text-center mb-10 leading-6 px-10">
                  Your withdrawal of <Text className="font-bold text-emerald-600">${stats.totalEarnings.toFixed(2)}</Text> to your <Text className="font-bold text-secondary">{selectedMethod?.type === 'card' ? 'Credit Card' : 'PayPal'}</Text> has been processed successfully.
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setIsWithdrawModalVisible(false);
                    setWithdrawSuccess(false);
                    setSelectedMethod(null);
                    setWithdrawAmount('');
                  }}
                  className="bg-secondary w-full p-6 rounded-[32px] items-center shadow-lg shadow-secondary/30"
                >
                  <Text className="text-white font-black text-lg">Great, Thanks!</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Transaction History Modal */}
      <Modal visible={isTransactionModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[50px] p-8 pb-16 h-[80%]">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Payout History</Text>
                <Text className="text-3xl font-black text-secondary">Transactions</Text>
              </View>
              <TouchableOpacity onPress={() => setIsTransactionModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <X size={20} color="gray" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {stats.withdrawals && stats.withdrawals.length > 0 ? (
                stats.withdrawals.map((w, idx) => (
                  <View key={idx} className="bg-gray-50 p-6 rounded-3xl mb-4 border border-gray-100 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className="bg-white p-3 rounded-2xl shadow-sm mr-4">
                        {w.method?.type === 'card' ? <CreditCard size={20} color="gray" /> : <Globe size={20} color="gray" />}
                      </View>
                      <View>
                        <Text className="font-bold text-secondary text-base">Withdrawal</Text>
                        <Text className="text-gray-400 text-[10px]">{new Date(w.createdAt).toLocaleString()}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-black text-red-500 text-lg">-${w.amount.toFixed(2)}</Text>
                      <Text className="text-emerald-600 text-[8px] font-bold uppercase bg-emerald-50 px-2 py-1 rounded-md mt-1">Success</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center mt-10">
                  <History size={48} color="lightgray" />
                  <Text className="text-gray-400 mt-4 italic">No withdrawals yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Career Logs Modal */}
      <Modal visible={isFullLogsModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[50px] p-8 pb-16 h-[85%]">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Career History</Text>
                <Text className="text-3xl font-black text-secondary">Journey Logs</Text>
              </View>
              <TouchableOpacity onPress={() => setIsFullLogsModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <X size={20} color="gray" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {stats.withdrawnLogs && stats.withdrawnLogs.length > 0 ? (
                stats.withdrawnLogs.map((order, idx) => (
                  <View key={idx} className="bg-white p-5 rounded-3xl mb-4 border border-gray-100 flex-row justify-between items-center shadow-sm">
                    <View className="flex-1">
                      <Text className="font-bold text-secondary text-base">Order #{order._id.substring(0,8).toUpperCase()}</Text>
                      <View className="flex-row items-center mt-1">
                        <Clock size={12} color="gray" />
                        <Text className="text-xs text-gray-400 ml-1">{new Date(order.updatedAt).toLocaleDateString()}</Text>
                      </View>
                      <View className="flex-row items-center mt-2">
                        <View className="px-2 py-0.5 rounded-full bg-gray-100">
                          <Text className="text-[8px] font-bold uppercase text-gray-400">Cashed Out</Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-black size-xl text-gray-300">
                        +${(order.deliveryFee || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center mt-10">
                  <Package size={48} color="lightgray" />
                  <Text className="text-gray-400 mt-4 italic">No cashed out logs found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DeliveryDashboard;
