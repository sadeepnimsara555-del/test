import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Plus, Store, Utensils, Clipboard, Settings, Edit2, Trash2, Camera, Check, X, Printer, Download, MessageSquare, Star, Wallet, DollarSign, History, Globe, CreditCard, CheckCircle, FileText, Package, Truck } from 'lucide-react-native';

import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import api, { API_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OwnerDashboard = ({ navigation, route }) => {
  const { initialTab } = route.params || {};
  const { user, logout, updateProfile } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(initialTab || 'orders'); // orders, menu, settings
  const [uploading, setUploading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [isFullLogsModalVisible, setIsFullLogsModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [stats, setStats] = useState({ history: [], withdrawnLogs: [], withdrawals: [], totalEarnings: 0, lifetimeEarnings: 0 });
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    ingredients: '',
    preparationTime: '15',
    image: ''
  });

  const [resForm, setResForm] = useState({
    name: '',
    address: '',
    contactNumber: '',
    ownerName: ''
  });

  const [errors, setErrors] = useState({});

  const ownerCategories = ['Appetizers', 'Main Course', 'Fast Food', 'Desserts', 'Drinks'];

  const handleUpdateLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        setUploading(true);
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop();
        const type = result.assets[0].mimeType || 'image/jpeg';

        const uploadData = new FormData();
        // @ts-ignore
        uploadData.append('image', {
          uri: localUri,
          name: filename || 'logo.jpg',
          type: type,
        });

        const token = await SecureStore.getItemAsync('userToken');
        const response = await fetch(`${API_URL}/restaurants/${restaurant._id}/logo`, {
          method: 'PUT',
          body: uploadData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Update failed');

        setRestaurant(data);
        Alert.alert('Success', 'Logo updated successfully!');
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdateCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        setUploading(true);
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop();
        const type = result.assets[0].mimeType || 'image/jpeg';

        const uploadData = new FormData();
        // @ts-ignore
        uploadData.append('image', {
          uri: localUri,
          name: filename || 'cover.jpg',
          type: type,
        });

        const token = await SecureStore.getItemAsync('userToken');
        const response = await fetch(`${API_URL}/restaurants/${restaurant._id}/cover`, {
          method: 'PUT',
          body: uploadData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Update failed');

        setRestaurant(data);
        Alert.alert('Success', 'Background photo updated successfully!');
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdateOwnerPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        setUploading(true);
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop();
        const type = result.assets[0].mimeType || 'image/jpeg';

        const uploadData = new FormData();
        // @ts-ignore
        uploadData.append('image', {
          uri: localUri,
          name: filename || 'owner.jpg',
          type: type,
        });

        const token = await SecureStore.getItemAsync('userToken');
        const response = await fetch(`${API_URL}/auth/upload`, {
          method: 'POST',
          body: uploadData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');

        await updateProfile({ profileImage: data.imageUrl });
        Alert.alert('Success', 'Owner photo updated successfully!');
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePickMenuItemImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        setUploading(true);
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop();
        const type = result.assets[0].mimeType || 'image/jpeg';

        console.log('Pick result:', { localUri, filename, type });

        const uploadData = new FormData();
        // @ts-ignore
        uploadData.append('image', {
          uri: localUri,
          name: filename || 'image.jpg',
          type: type,
        });

        // Use fetch instead of axios for FormData to avoid potential header/interceptor issues
        const token = await SecureStore.getItemAsync('userToken');
        
        console.log('Attempting upload to:', `${API_URL}/menu/upload`);
        
        const response = await fetch(`${API_URL}/menu/upload`, {
          method: 'POST',
          body: uploadData,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        const data = await response.json();
        console.log('Server response:', data);
        
        if (!response.ok) {
          throw new Error(data.message || `Upload failed with status ${response.status}`);
        }

        setFormData({ ...formData, image: data.imageUrl });
        setErrors({ ...errors, image: null });
        Alert.alert('Success', 'Image uploaded successfully!');
      } catch (error) {
        console.error('Upload Error Details:', error);
        Alert.alert('Error', `Failed to upload image: ${error.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handlePayDriver = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/pay-driver`);
      Alert.alert('Success', 'Payment sent to driver!');
      fetchData();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Payment failed');
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const resResponse = await api.get('/restaurants');
      const myRes = resResponse.data.find(r => r.ownerId === user._id);
      
      if (myRes) {
        setRestaurant(myRes);
        setResForm({
          name: myRes.name || '',
          address: myRes.address || '',
          contactNumber: myRes.contactNumber || '',
          ownerName: user.name || ''
        });

        // Fetch everything including new stats
        const [ordersRes, menuRes, reviewRes, statsRes] = await Promise.all([
          api.get(`/orders/restaurant/${myRes._id}`),
          api.get(`/menu/restaurant/${myRes._id}`),
          api.get(`/reviews/restaurant/${myRes._id}/all`),
          api.get(`/orders/restaurant-stats/${myRes._id}`)
        ]);

        setOrders(ordersRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setMenuItems(menuRes.data);
        setReviews(reviewRes.data);
        setStats(statsRes.data);
      }

    } catch (error) {
      console.log('Error dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) < 60) {
      Alert.alert('Error', 'Minimum withdrawal amount is $60.00');
      return;
    }
    if (Number(withdrawAmount) > stats.totalEarnings) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setWithdrawLoading(true);
      await api.post('/orders/restaurant-withdraw', {
        amount: Number(withdrawAmount),
        method: selectedMethod,
        restaurantId: restaurant._id
      });

      setWithdrawSuccess(true);
      fetchData();
    } catch (e) {
      Alert.alert('Withdrawal Failed', e.response?.data?.message || 'Something went wrong');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.image) newErrors.image = 'Dish photo is required';
    if (!formData.name) newErrors.name = 'Dish name is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.price) newErrors.price = 'Price is required';
    if (isNaN(parseFloat(formData.price))) newErrors.price = 'Invalid price';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.ingredients) newErrors.ingredients = 'Ingredients are required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveItem = async () => {
    if (!validateForm()) {
      return;
    }

    const { name, price, category, description, ingredients, preparationTime } = formData;
    try {
      const payload = {
        name,
        price: parseFloat(price),
        category,
        description,
        ingredients: ingredients.split(',').map(i => i.trim()),
        preparationTime: parseInt(preparationTime),
        restaurantId: restaurant._id,
        image: formData.image
      };

      if (editingItem) {
        await api.put(`/menu/${editingItem._id}`, payload);
        Alert.alert('Success', 'Menu item updated');
      } else {
        await api.post('/menu', payload);
        Alert.alert('Success', 'Menu item added');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setErrors({});
      setFormData({ name: '', price: '', category: '', description: '', ingredients: '', preparationTime: '15', image: '' });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save menu item');
    }
  };

  const handleDeleteItem = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/menu/${id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete');
        }
      }}
    ]);
  };

  const handleUpdateRestaurant = async () => {
    try {
      setUploading(true);
      
      // 1. Update User Profile (Name, Address, Phone) if changed
      // Keeping them in sync as requested so the Profile screen shows updated info
      if (resForm.ownerName !== user.name || resForm.address !== user.address || resForm.contactNumber !== user.phone) {
        await updateProfile({ 
          name: resForm.ownerName,
          address: resForm.address,
          phone: resForm.contactNumber
        });
      }

      // 2. Update Restaurant Details
      const response = await api.put(`/restaurants/${restaurant._id}`, {
        name: resForm.name,
        address: resForm.address,
        contactNumber: resForm.contactNumber
      });

      setRestaurant(response.data);
      Alert.alert('Success', 'Restaurant details updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update details');
    } finally {
      setUploading(false);
    }
  };

  const generateMenuPDF = async (action = 'share') => {
    if (!menuItems || menuItems.length === 0) {
      Alert.alert('Error', 'No menu items to print');
      return;
    }

    try {
      const categorizedMenu = ownerCategories.reduce((acc, cat) => {
        const items = menuItems.filter(item => item.category === cat);
        if (items.length > 0) acc[cat] = items;
        return acc;
      }, {});

      const restaurantLogo = restaurant?.logo || 'https://via.placeholder.com/150';
      const restaurantCover = restaurant?.coverImage || 'https://via.placeholder.com/800x400';

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.4; }
              .header { position: relative; height: 250px; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; overflow: hidden; margin-bottom: 20px; }
              .header-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('${restaurantCover}') center/cover no-repeat; z-index: -2; }
              .header-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: -1; }
              .logo { width: 90px; height: 90px; border-radius: 50%; border: 3px solid white; margin-bottom: 10px; }
              .restaurant-name { font-family: 'Playfair Display', serif; font-size: 36px; margin: 0; }
              .content { padding: 0 40px 40px; }
              .category-section { margin-bottom: 30px; }
              .category-title { font-size: 20px; font-weight: 600; color: #ff5a5f; border-bottom: 2px solid #ff5a5f; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1.5px; }
              .menu-item { display: flex; justify-content: space-between; margin-bottom: 12px; page-break-inside: avoid; border-bottom: 1px dotted #eee; padding-bottom: 8px; }
              .item-info { flex: 1; padding-right: 20px; }
              .item-name { font-weight: 600; font-size: 17px; margin-bottom: 2px; }
              .item-description { font-size: 13px; color: #555; background: #f9f9f9; padding: 4px 8px; border-radius: 4px; border-left: 3px solid #ff5a5f; margin-top: 2px; }
              .item-price { font-weight: 700; font-size: 17px; color: #333; align-self: flex-start; }
              .footer { text-align: center; padding: 30px; font-size: 11px; color: #999; border-top: 1px solid #eee; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-bg"></div>
              <div class="header-overlay"></div>
              <img src="${restaurantLogo}" class="logo" />
              <h1 class="restaurant-name">${restaurant?.name}</h1>
              <p>Freshly Prepared • Chef Inspired</p>
            </div>
            <div class="content">
              ${Object.keys(categorizedMenu).map(cat => `
                <div class="category-section">
                  <div class="category-title">${cat}</div>
                  ${categorizedMenu[cat].map(item => `
                    <div class="menu-item">
                      <div class="item-info">
                        <div class="item-name">${item.name}</div>
                      </div>
                      <div class="item-price">$${item.price}</div>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
            <div class="footer">
              Thank you for visiting ${restaurant?.name}<br/>
              Created with Foodie App
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      const renamedUri = FileSystem.cacheDirectory + `${restaurant?.name.replace(/\s+/g, '_')}_Menu.pdf`;
      await FileSystem.copyAsync({
        from: uri,
        to: renamedUri
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(renamedUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save/Share Restaurant Menu',
          UTI: 'com.adobe.pdf'
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      Alert.alert('Error', 'Failed to generate PDF menu');
    }
  };

  const OrderCard = ({ item }) => (
    <View className="bg-white p-5 rounded-3xl mb-4 border border-gray-100 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Image source={{ uri: item.user?.profileImage || 'https://ui-avatars.com/api/?name='+encodeURIComponent(item.user?.name) }} className="w-10 h-10 rounded-full" />
          <View className="ml-3">
            <Text className="font-bold text-secondary">{item.user?.name}</Text>
            <Text className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleTimeString()}</Text>
          </View>
        </View>
        <Text className="font-bold text-primary">${item.totalAmount.toFixed(2)}</Text>
      </View>
      
      <View className="bg-gray-50 p-4 rounded-2xl mb-4">
        {item.items.map((i, idx) => (
          <Text key={idx} className="text-secondary text-sm mb-1">• {i.quantity}x {i.name}</Text>
        ))}
      </View>

      <Text className="text-gray-500 text-xs mb-3">
        Status: <Text className="font-bold text-secondary uppercase bg-gray-100 px-2 rounded-md">{item.orderStatus.replace(/_/g, ' ')}</Text>
      </Text>

      <View className="flex-row space-x-2">
        {item.orderStatus === 'placed' && (
          <TouchableOpacity onPress={() => updateOrderStatus(item._id, 'confirmed')} className="flex-1 bg-green-500 p-3 rounded-xl items-center"><Text className="text-white font-bold text-xs">Confirm</Text></TouchableOpacity>
        )}
        {item.orderStatus === 'confirmed' && (
          <TouchableOpacity onPress={() => updateOrderStatus(item._id, 'preparing')} className="flex-1 bg-orange-500 p-3 rounded-xl items-center"><Text className="text-white font-bold text-xs">Prepare</Text></TouchableOpacity>
        )}
        {item.orderStatus === 'preparing' && (
          <TouchableOpacity 
            onPress={() => updateOrderStatus(item._id, item.orderType === 'delivery' ? 'ready_for_delivery' : 'ready')} 
            className="flex-1 bg-indigo-500 p-3 rounded-xl items-center"
          >
             <Text className="text-white font-bold text-xs">Mark Ready</Text>
          </TouchableOpacity>
        )}
        {(item.orderStatus === 'ready' || item.orderStatus === 'out_for_delivery' || item.orderStatus === 'ready_for_delivery') && item.orderType !== 'delivery' && (
          <TouchableOpacity onPress={() => updateOrderStatus(item._id, 'delivered')} className="flex-1 bg-green-600 p-3 rounded-xl items-center"><Text className="text-white font-bold text-xs">Delivered</Text></TouchableOpacity>
        )}
        {item.orderType === 'delivery' && ['ready_for_delivery', 'accepted', 'picked_up', 'on_the_way'].includes(item.orderStatus) && (
           <View className="flex-1 bg-gray-100 p-2 rounded-xl items-center border border-gray-200">
              <Text className="text-gray-500 font-bold text-[10px] uppercase">Rider Assignment Complete</Text>
              <Text className="text-xs text-secondary mt-1 tracking-wide">Waiting for Driver...</Text>
              
              {item.orderStatus === 'accepted' && (
                <TouchableOpacity 
                   onPress={() => {
                     Alert.alert(
                       'Kick Driver?',
                       'Driver taking too long? This will unassign them and find someone else.',
                       [
                         { text: 'Wait longer', style: 'cancel' },
                         { 
                           text: 'Find New Driver', 
                           style: 'destructive', 
                           onPress: () => updateOrderStatus(item._id, 'ready_for_delivery') 
                         }
                       ]
                     );
                   }}
                   className="mt-2 bg-white px-3 py-1 rounded-full border border-red-100 shadow-sm"
                >
                   <Text className="text-[10px] text-red-500 font-bold">DRIVER NOT SHOWING UP?</Text>
                </TouchableOpacity>
              )}
           </View>
        )}
      </View>
    </View>
  );

  const MenuCard = ({ item }) => (
    // ... (existing MenuCard content)
    <View className="bg-white p-4 rounded-3xl mb-4 flex-row border border-gray-100 shadow-sm">
      <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} className="w-20 h-20 rounded-2xl" />
      <View className="flex-1 ml-4 justify-between">
        <View className="flex-row justify-between">
          <Text className="text-lg font-bold text-secondary">{item.name}</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity onPress={() => { 
              setEditingItem(item); 
              setErrors({}); 
              setFormData({ ...item, ingredients: item.ingredients?.join(', ') || '' }); 
              setIsModalOpen(true); 
            }}><Edit2 size={18} color="gray" /></TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteItem(item._id)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
          </View>
        </View>
        <View className="flex-row justify-between items-end">
          <Text className="text-primary font-bold text-lg">${item.price}</Text>
          <View className="flex-row items-center">
            <Star size={12} color="#ffb800" fill="#ffb800" />
            <Text className="text-[10px] font-bold text-gray-400 ml-1">{item.rating || '0.0'}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${item.isAvailable ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text className={`text-[10px] font-bold ${item.isAvailable ? 'text-green-500' : 'text-red-500'}`}>{item.isAvailable ? 'AVAILABLE' : 'OUT'}</Text>
          </View>
        </View>
      </View>
    </View>
  );



  const ReviewCard = ({ item }) => (
    <View className="bg-white p-5 rounded-3xl mb-4 border border-gray-100 shadow-sm">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <Image source={{ uri: item.user?.profileImage || 'https://ui-avatars.com/api/?name='+encodeURIComponent(item.user?.name) }} className="w-10 h-10 rounded-full" />
          <View className="ml-3">
            <Text className="font-bold text-secondary text-sm">{item.user?.name}</Text>
            <View className="flex-row items-center mt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={10} color={star <= item.rating ? '#ffb800' : '#e5e7eb'} fill={star <= item.rating ? '#ffb800' : 'transparent'} />
              ))}
              <Text className="text-gray-400 text-[10px] ml-2">{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
        {item.menuItem && (
          <View className="bg-primary/5 px-2 py-1 rounded-lg">
            <Text className="text-[10px] text-primary font-bold uppercase">{item.menuItem.name}</Text>
          </View>
        )}
      </View>
      <Text className="text-gray-600 text-sm leading-5">{item.comment}</Text>
    </View>
  );


  const SettlementCard = ({ item }) => (
    <View className="bg-white p-6 rounded-[35px] mb-5 border border-gray-100 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="bg-gray-50 p-2 rounded-xl mr-3">
             {item.orderType === 'delivery' ? <Truck size={18} color="#64748b" /> : <Store size={18} color="#64748b" />}
          </View>
          <View>
            <Text className="text-secondary font-black text-base">Order #{item._id.substring(0,8).toUpperCase()}</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase">{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <Text className="font-black text-emerald-500 text-xl">
          +${(item.deliveryFeeStatus === 'pending' ? item.totalAmount : (item.totalAmount - (item.deliveryFee || 0))).toFixed(2)}
        </Text>
      </View>

      {item.orderType === 'delivery' && (
        <View className="pt-4 border-t border-gray-50 flex-row justify-between items-center">
          <View>
             <Text className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Driver Fee</Text>
             <Text className={`font-bold text-sm ${item.deliveryFeeStatus === 'paid' ? 'text-emerald-600' : 'text-orange-500'}`}>
                ${(item.deliveryFee || 0).toFixed(2)} {item.deliveryFeeStatus === 'paid' ? '• Paid' : ''}
             </Text>
          </View>
          {item.deliveryFeeStatus === 'pending' && item.orderStatus === 'delivered' && (
            <TouchableOpacity 
              onPress={() => handlePayDriver(item._id)}
              className="bg-secondary px-5 py-2.5 rounded-2xl shadow-lg shadow-secondary/10 flex-row items-center"
            >
              <DollarSign size={14} color="white" />
              <Text className="text-white font-bold text-xs ml-1">Send Fee</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );


  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchData();
      Alert.alert('Success', 'Status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  // Safety guard: if user is null (during logout transition), render nothing
  if (!user) return null;

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator color="#ff5a5f" size="large"/></View>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-secondary flex-1">Manager: {restaurant?.name}</Text>
        <View className="bg-primary/5 px-3 py-1 rounded-full flex-row items-center">
          <Star size={12} color="#ff5a5f" fill="#ff5a5f" />
          <Text className="text-primary font-bold ml-1 text-xs">{restaurant?.rating || '0.0'}</Text>
        </View>
      </View>

      {/* Internal switcher removed as it's now handled by Bottom Tabs */}


      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {activeTab === 'orders' && (
          <>{orders.map(order => <OrderCard key={order._id} item={order} />)}{orders.length === 0 && <Text className="text-gray-400 text-center mt-10">No orders yet</Text>}</>
        )}

        {activeTab === 'menu' && (
          <>
            <View className="flex-row space-x-3 mb-6">
              <TouchableOpacity onPress={() => { setEditingItem(null); setErrors({}); setFormData({ name: '', price: '', category: '', description: '', ingredients: '', preparationTime: '15', image: '' }); setIsModalOpen(true); }} className="flex-1 bg-primary/10 p-5 rounded-3xl items-center border border-primary/20 flex-row justify-center">
                <Plus size={24} color="#ff5a5f" /><Text className="text-primary font-bold ml-2">Add New Dish</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => generateMenuPDF()} className="bg-secondary p-5 rounded-3xl items-center flex-row justify-center">
                <Printer size={24} color="white" />
              </TouchableOpacity>
            </View>
            {menuItems.map(item => <MenuCard key={item._id} item={item} />)}
          </>
        )}
        {activeTab === 'reviews' && (

          <View className="pt-4">
            <View className="bg-white p-6 rounded-3xl mb-6 flex-row items-center justify-around border border-gray-100 shadow-sm">
              <View className="items-center">
                <Text className="text-3xl font-black text-secondary">{restaurant?.rating || '0.0'}</Text>
                <Text className="text-[10px] text-gray-400 font-bold uppercase mt-1">Average Rating</Text>
              </View>
              <View className="w-[1px] h-10 bg-gray-100" />
              <View className="items-center">
                <Text className="text-3xl font-black text-secondary">{reviews.length}</Text>
                <Text className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total Reviews</Text>
              </View>
            </View>
            {reviews.map(review => <ReviewCard key={review._id} item={review} />)}
            {reviews.length === 0 && <Text className="text-gray-400 text-center mt-10">No customer feedback yet</Text>}
          </View>
        )}

        {activeTab === 'payments' && (
          <View className="pt-4">
            {/* Premium Wallet Header */}
            <View className="bg-secondary p-8 rounded-[45px] shadow-2xl shadow-secondary/30 mb-8 overflow-hidden">
               <View className="flex-row justify-between items-start mb-6">
                  <View>
                    <Text className="text-white/60 text-[10px] font-bold uppercase tracking-[2px] mb-1">Available Funds</Text>
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
                  if (stats.totalEarnings < 60) {
                    Alert.alert('Insufficient Balance', 'Minimum withdrawal is $60.00');
                    return;
                  }
                  setIsWithdrawModalVisible(true);
                }}
                className={`p-5 rounded-3xl flex-row items-center justify-center ${stats.totalEarnings >= 60 ? 'bg-primary' : 'bg-white/10'}`}
               >
                  <DollarSign size={20} color="white" />
                  <Text className="text-white font-black text-base ml-2">Request Payout</Text>
               </TouchableOpacity>
            </View>

            {/* Quick Stats Chips */}
            <View className="flex-row space-x-3 mb-10 px-1">
               <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row items-center">
                  <View className="bg-emerald-50 p-2 rounded-xl mr-3">
                    <CheckCircle size={16} color="#10b981" />
                  </View>
                  <View>
                    <Text className="text-[8px] text-gray-400 font-bold uppercase">Lifetime</Text>
                    <Text className="text-secondary font-black text-sm">${stats.lifetimeEarnings.toFixed(2)}</Text>
                  </View>
               </View>
               <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row items-center">
                  <View className="bg-orange-50 p-2 rounded-xl mr-3">
                    <Truck size={16} color="#f97316" />
                  </View>
                  <View>
                    <Text className="text-[8px] text-gray-400 font-bold uppercase">Pending Fees</Text>
                    <Text className="text-secondary font-black text-sm">
                      ${stats.history.filter(o => o.deliveryFeeStatus === 'pending').reduce((sum, o) => sum + (o.deliveryFee || 0), 0).toFixed(2)}
                    </Text>
                  </View>
               </View>
            </View>

            <Text className="font-black text-secondary text-xl mb-6 ml-2">Active Settlements</Text>
            
            {stats.history.length > 0 ? (
              stats.history.map(order => <SettlementCard key={order._id} item={order} />)
            ) : (
              <View className="items-center py-20">
                <Wallet size={50} color="#e2e8f0" />
                <Text className="text-gray-400 mt-4 font-bold">Your wallet is empty</Text>
              </View>
            )}

            <View className="h-20" />
          </View>
        )}


        {activeTab === 'settings' && (
          <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <Text className="text-xl font-bold text-secondary mb-6">Restaurant Profile</Text>
             
             <View className="space-y-6">
                <View>
                   <Text className="text-gray-400 mb-2 ml-1 text-[10px] font-bold uppercase tracking-widest">Storefront Photo</Text>
                   <TouchableOpacity 
                    onPress={handleUpdateCoverImage}
                    className="w-full h-44 bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
                   >
                      {restaurant?.coverImage ? (
                        <Image source={{ uri: restaurant.coverImage }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Camera size={32} color="lightgray" />
                          <Text className="text-gray-400 mt-2 text-xs">Tap to add background photo</Text>
                        </View>
                      )}
                   </TouchableOpacity>
                   <TouchableOpacity onPress={handleUpdateCoverImage} className="mt-2 self-end">
                      <Text className="text-primary font-bold text-xs underline">Change Cover</Text>
                   </TouchableOpacity>
                </View>

                <View className="flex-row items-center space-x-4 mt-2">
                   <View className="relative">
                      <Image 
                        source={{ uri: restaurant?.logo || 'https://via.placeholder.com/150' }} 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                      />
                      <TouchableOpacity 
                        onPress={handleUpdateLogo}
                        className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-white shadow-md"
                      >
                        <Camera size={14} color="white" />
                      </TouchableOpacity>
                   </View>
                   <View className="flex-1">
                      <Text className="text-secondary font-bold text-base">Brand Identity</Text>
                      <Text className="text-gray-400 text-xs mt-1">Logo appears on receipts and your store page</Text>
                   </View>
                </View>

                <View className="h-[1px] bg-gray-100 my-4" />

                <View className="space-y-4">
                   <View>
                      <Text className="text-gray-500 mb-1 ml-1 text-xs font-bold uppercase">Restaurant Name</Text>
                      <TextInput
                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary font-bold"
                        value={resForm.name}
                        onChangeText={(t) => setResForm({...resForm, name: t})}
                        placeholder="My Restaurant"
                      />
                   </View>

                   <View>
                      <Text className="text-gray-500 mb-1 ml-1 text-xs font-bold uppercase">Street Address</Text>
                      <TextInput
                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary"
                        value={resForm.address}
                        onChangeText={(t) => setResForm({...resForm, address: t})}
                        placeholder="123 Food Lane"
                        multiline
                      />
                   </View>

                   <View>
                      <Text className="text-gray-500 mb-1 ml-1 text-xs font-bold uppercase">Contact Number</Text>
                      <TextInput
                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary"
                        value={resForm.contactNumber}
                        onChangeText={(t) => setResForm({...resForm, contactNumber: t})}
                        placeholder="0712345678"
                        keyboardType="phone-pad"
                      />
                   </View>

                   <View className="h-[1px] bg-gray-100 my-4" />

                   <View>
                      <Text className="text-gray-400 mb-2 ml-1 text-[10px] font-bold uppercase tracking-widest">Owner Profile Photo</Text>
                      <View className="flex-row items-center space-x-4">
                         <Image 
                           source={{ uri: user?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name) }} 
                           className="w-20 h-20 rounded-full border-2 border-gray-100" 
                         />
                         <TouchableOpacity 
                          onPress={handleUpdateOwnerPhoto}
                          className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200"
                         >
                            <Text className="text-secondary font-bold text-xs">Upload Photo</Text>
                         </TouchableOpacity>
                      </View>
                   </View>

                   <View>
                      <Text className="text-gray-500 mb-1 ml-1 text-xs font-bold uppercase">Owner Name</Text>
                      <TextInput
                        className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-secondary"
                        value={resForm.ownerName}
                        onChangeText={(t) => setResForm({...resForm, ownerName: t})}
                        placeholder="Full Name"
                      />
                   </View>

                   <View>
                      <Text className="text-gray-400 mb-1 ml-1 text-xs font-bold uppercase">Registered Email (Read-only)</Text>
                      <View className="bg-gray-100 p-4 rounded-2xl border border-gray-200 opacity-60">
                         <Text className="text-gray-500">{user.email}</Text>
                      </View>
                   </View>
                </View>

                <TouchableOpacity 
                  onPress={handleUpdateRestaurant}
                  disabled={uploading}
                  className={`bg-primary p-5 rounded-2xl items-center mt-6 shadow-lg shadow-primary/30 ${uploading ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-bold text-lg">Update Details</Text>
                </TouchableOpacity>
             </View>
          </View>
        )}
        <View className="h-20" />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-secondary">{editingItem ? 'Edit Item' : 'New Menu Item'}</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}><X size={24} color="gray" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-5">
                <View>
                  <Text className="text-gray-500 mb-2 ml-1">Dish Photo</Text>
                  <TouchableOpacity 
                    onPress={handlePickMenuItemImage}
                    className={`w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed ${errors.image ? 'border-red-500' : 'border-gray-200'} items-center justify-center overflow-hidden`}
                  >
                    {uploading ? (
                      <ActivityIndicator color="#ff5a5f" />
                    ) : formData.image ? (
                      <Image source={{ uri: formData.image }} className="w-full h-full" />
                    ) : (
                      <>
                        <Camera size={32} color={errors.image ? "#ef4444" : "gray"} />
                        <Text className={`mt-2 ${errors.image ? 'text-red-500 font-bold' : 'text-gray-400'}`}>Tap to take or pick a photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {errors.image && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.image}</Text>}
                  {formData.image && !uploading && (
                    <TouchableOpacity onPress={handlePickMenuItemImage} className="mt-2 self-end">
                      <Text className="text-primary font-bold">Change Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View>
                  <Text className="text-gray-500 mb-1 ml-1">Dish Name</Text>
                  <TextInput 
                    value={formData.name} 
                    onChangeText={t => {setFormData({...formData, name: t}); if(errors.name) setErrors({...errors, name: null})}} 
                    className={`bg-gray-50 p-4 rounded-xl border ${errors.name ? 'border-red-500' : 'border-transparent'}`} 
                    placeholder="e.g. Spicy Ramen"
                  />
                  {errors.name && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.name}</Text>}
                </View>

                <View>
                  <Text className="text-gray-500 mb-3 ml-1">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
                    {ownerCategories.map((cat) => (
                      <TouchableOpacity 
                        key={cat}
                        onPress={() => {setFormData({...formData, category: cat}); if(errors.category) setErrors({...errors, category: null})}}
                        className={`px-4 py-2 rounded-xl mr-2 border ${formData.category === cat ? 'bg-secondary border-secondary' : 'bg-white border-gray-200'}`}
                      >
                        <Text className={`font-bold text-xs ${formData.category === cat ? 'text-white' : 'text-gray-500'}`}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errors.category && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.category}</Text>}
                </View>

                <View>
                  <Text className="text-gray-500 mb-1 ml-1">Price ($)</Text>
                  <TextInput 
                    value={formData.price.toString()} 
                    onChangeText={t => {setFormData({...formData, price: t}); if(errors.price) setErrors({...errors, price: null})}} 
                    keyboardType="decimal-pad" 
                    className={`bg-gray-50 p-4 rounded-xl border ${errors.price ? 'border-red-500' : 'border-transparent'}`} 
                    placeholder="12.99"
                  />
                  {errors.price && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.price}</Text>}
                </View>

                <View>
                  <Text className="text-gray-500 mb-1 ml-1">Description</Text>
                  <TextInput 
                    value={formData.description} 
                    onChangeText={t => {setFormData({...formData, description: t}); if(errors.description) setErrors({...errors, description: null})}} 
                    multiline 
                    className={`bg-gray-50 p-4 rounded-xl h-24 border ${errors.description ? 'border-red-500' : 'border-transparent'}`} 
                    placeholder="Tell customers about this dish..."
                  />
                  {errors.description && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.description}</Text>}
                </View>

                <View>
                  <Text className="text-gray-500 mb-1 ml-1">Ingredients (Comma separated)</Text>
                  <TextInput 
                    value={formData.ingredients} 
                    onChangeText={t => {setFormData({...formData, ingredients: t}); if(errors.ingredients) setErrors({...errors, ingredients: null})}} 
                    multiline 
                    className={`bg-gray-50 p-4 rounded-xl h-20 border ${errors.ingredients ? 'border-red-500' : 'border-transparent'}`} 
                    placeholder="Tomato, Garlic, Basil..."
                  />
                  {errors.ingredients && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.ingredients}</Text>}
                </View>
                <TouchableOpacity 
                  onPress={handleSaveItem} 
                  disabled={uploading}
                  className={`bg-primary p-5 rounded-2xl items-center shadow-lg shadow-primary/20 ${uploading ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-bold text-lg">{editingItem ? 'Update Dish' : 'Add Dish'}</Text>
                </TouchableOpacity>
              </View>
              <View className="h-10" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal visible={isWithdrawModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[50px] p-8 pb-16">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Settlement</Text>
                <Text className="text-3xl font-black text-secondary">Withdraw</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsWithdrawModalVisible(false); setWithdrawSuccess(false); }} className="bg-gray-100 p-2 rounded-full">
                <X size={20} color="gray" />
              </TouchableOpacity>
            </View>

            {withdrawSuccess ? (
              <View className="items-center py-10">
                 <View className="bg-emerald-50 p-8 rounded-full mb-6">
                    <CheckCircle size={60} color="#10b981" />
                 </View>
                 <Text className="text-2xl font-black text-secondary mb-2">Request Successful!</Text>
                 <Text className="text-gray-400 text-center mb-8">Your payout is being processed and will be credited to your account within 3 business days.</Text>
                 <TouchableOpacity 
                  onPress={() => { setIsWithdrawModalVisible(false); setWithdrawSuccess(false); }}
                  className="bg-secondary w-full p-5 rounded-3xl items-center"
                 >
                   <Text className="text-white font-bold">Done</Text>
                 </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="bg-gray-50 p-8 rounded-[40px] mb-8 border border-gray-100 items-center">
                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2">Available to Withdraw</Text>
                  <Text className="text-4xl font-black text-emerald-600">${stats.totalEarnings.toFixed(2)}</Text>
                </View>

                <Text className="text-gray-500 mb-3 ml-1 text-[10px] font-bold uppercase">Enter Amount (Min $60.00)</Text>
                <TextInput 
                  className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-2xl font-black text-secondary mb-8 text-center"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />

                <Text className="text-gray-500 mb-3 ml-1 text-[10px] font-bold uppercase">Select Method</Text>
                <View className="flex-row space-x-3 mb-10">
                  {['card', 'paypal'].map(method => (
                    <TouchableOpacity 
                      key={method}
                      onPress={() => setSelectedMethod(method)}
                      className={`flex-1 p-5 rounded-3xl border-2 flex-row items-center justify-center ${selectedMethod === method ? 'bg-secondary border-secondary' : 'bg-white border-gray-100'}`}
                    >
                      {method === 'card' ? <CreditCard size={18} color={selectedMethod === method ? 'white' : 'gray'} /> : <Globe size={18} color={selectedMethod === method ? 'white' : 'gray'} />}
                      <Text className={`font-bold ml-2 capitalize ${selectedMethod === method ? 'text-white' : 'text-gray-400'}`}>{method}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  onPress={handleWithdraw}
                  disabled={withdrawLoading}
                  className="bg-primary p-6 rounded-[32px] items-center shadow-xl shadow-primary/30"
                >
                  {withdrawLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Request Payout</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Transaction History Modal */}
      <Modal visible={isTransactionModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[50px] p-8 pb-16 h-[85%]">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">History</Text>
                <Text className="text-3xl font-black text-secondary">Payouts</Text>
              </View>
              <TouchableOpacity onPress={() => setIsTransactionModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <X size={20} color="gray" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {stats.withdrawals && stats.withdrawals.length > 0 ? (
                stats.withdrawals.map((w, idx) => (
                  <View key={idx} className="bg-white p-6 rounded-[32px] mb-4 border border-gray-100 flex-row justify-between items-center shadow-sm">
                    <View>
                      <View className="flex-row items-center mb-1">
                        {w.method === 'card' ? <CreditCard size={14} color="gray" /> : <Globe size={14} color="gray" />}
                        <Text className="text-gray-400 text-[10px] font-bold uppercase ml-1">{w.method}</Text>
                      </View>
                      <Text className="font-bold text-secondary text-lg">${w.amount.toFixed(2)}</Text>
                      <Text className="text-gray-400 text-[10px] mt-1">{new Date(w.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View className="bg-emerald-50 px-3 py-1 rounded-full">
                      <Text className="text-[8px] font-bold text-emerald-600 uppercase">Completed</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center mt-10">
                  <History size={48} color="lightgray" />
                  <Text className="text-gray-400 mt-4 italic">No payouts requested yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Logs Modal */}
      <Modal visible={isFullLogsModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[50px] p-8 pb-16 h-[85%]">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Archive</Text>
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
                      <Text className="font-black text-xl text-gray-300">
                        +${(order.totalAmount - (order.deliveryFee || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center mt-10">
                  <Package size={48} color="lightgray" />
                  <Text className="text-gray-400 mt-4 italic">No cashed out orders yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


export default OwnerDashboard;
