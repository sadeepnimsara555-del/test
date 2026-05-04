import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Modal, 
  Image,
  ActivityIndicator,
  Animated
} from 'react-native';
import { MessageCircle, X, Send, Bot, Utensils, Info } from 'lucide-react-native';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: '1', text: 'Hi! I’m your Foodie Buddy. How can I help you today? 😊', isUser: false }
  ]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const flatListRef = useRef();

  const handleSend = async (presetMessage = null) => {
    const textToSend = presetMessage || message;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now().toString(), text: textToSend, isUser: true };
    setChatHistory(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/chatbot/query', { message: textToSend });
      const botMsg = { 
        id: (Date.now() + 1).toString(), 
        text: response.data.reply, 
        isUser: false,
        items: response.data.items 
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMsg = { 
        id: (Date.now() + 1).toString(), 
        text: 'Oops, something went wrong on my end. Try again? 😅', 
        isUser: false 
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View className={`mb-4 max-w-[85%] ${item.isUser ? 'self-end' : 'self-start'}`}>
      <View 
        className={`p-4 rounded-3xl ${item.isUser ? 'bg-primary rounded-tr-none' : 'bg-white rounded-tl-none border border-gray-100 shadow-sm'}`}
      >
        {!item.isUser && (
          <View className="flex-row items-center mb-1">
            <Bot size={12} color="#ff5a5f" />
            <Text className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Foodie Bot</Text>
          </View>
        )}
        <Text className={`${item.isUser ? 'text-white' : 'text-secondary'} text-sm leading-5`}>
          {item.text}
        </Text>
      </View>
      
      {item.items && item.items.length > 0 && (
        <View className="mt-2 flex-row flex-wrap">
          {item.items.map((food) => (
            <TouchableOpacity 
              key={food._id}
              onPress={() => {
                setIsOpen(false);
                navigation.navigate('MenuItemDetail', { item: food });
              }}
              className="bg-white p-2 rounded-xl border border-gray-100 mr-2 mb-2 shadow-sm flex-row items-center"
            >
              <Image source={{ uri: food.image }} className="w-8 h-8 rounded-lg mr-2" />
              <View>
                <Text className="text-[10px] font-bold text-secondary" numberOfLines={1}>{food.name}</Text>
                <Text className="text-[8px] text-primary font-bold">${food.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const SuggestionChip = ({ label, icon: Icon }) => (
    <TouchableOpacity 
      onPress={() => handleSend(label)}
      className="bg-white border border-gray-100 px-4 py-2 rounded-2xl mr-2 mb-2 flex-row items-center shadow-sm"
    >
      <Icon size={14} color="#ff5a5f" className="mr-2" />
      <Text className="text-gray-600 text-xs font-medium">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity 
        onPress={() => setIsOpen(true)}
        className="absolute bottom-28 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-2xl shadow-primary/50 z-50"
      >
        <MessageCircle size={24} color="white" />
        <View className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
      </TouchableOpacity>

      {/* Chat Window Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-gray-50 h-[85%] rounded-t-[40px]"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100 bg-white rounded-t-[40px]">
              <View className="flex-row items-center">
                <View className="bg-primary/10 p-2 rounded-2xl mr-3">
                  <Bot size={24} color="#ff5a5f" />
                </View>
                <View>
                  <Text className="text-secondary font-bold text-lg">Foodie Assistant</Text>
                  <Text className="text-green-500 text-xs font-medium">• Online & ready to help</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Chat Body */}
            <FlatList
              ref={flatListRef}
              data={chatHistory}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              className="px-6 pt-4"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListFooterComponent={
                loading ? (
                  <View className="self-start bg-white p-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm mb-4">
                    <ActivityIndicator size="small" color="#ff5a5f" />
                  </View>
                ) : (
                  chatHistory.length < 5 && (
                    <View className="mt-2 mb-6">
                      <Text className="text-gray-400 text-[10px] uppercase font-bold mb-3 ml-1">Suggestions</Text>
                      <View className="flex-row flex-wrap">
                        <SuggestionChip label="Suggest a combo" icon={Utensils} />
                        <SuggestionChip label="I'm hungry" icon={Bot} />
                        <SuggestionChip label="Show spicy items" icon={Info} />
                        <SuggestionChip label="Help me order" icon={Info} />
                      </View>
                    </View>
                  )
                )
              }
            />

            {/* Input Area */}
            <View className="p-6 bg-white border-t border-gray-100 rounded-b-[40px]">
              <View className="flex-row items-center bg-gray-50 rounded-3xl px-4 py-2 border border-gray-100">
                <TextInput
                  className="flex-1 h-10 text-secondary"
                  placeholder="Type a message..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
                <TouchableOpacity 
                  onPress={() => handleSend()}
                  disabled={!message.trim() || loading}
                  className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${message.trim() ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <Send size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

export default ChatBot;
