import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Opens an address or coordinates in the device's default map application.
 * @param {string} address - The street address or "lat,lng" coordinates.
 * @param {string} label - Optional label for the destination.
 */
export const openExternalMap = (address, label = 'Destination') => {
  if (!address) return;

  const encodedAddress = encodeURIComponent(address);
  
  // Use universal links for better compatibility
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const appleMapsUrl = `maps:0,0?q=${encodedAddress}`;

  if (Platform.OS === 'ios') {
    Linking.canOpenURL(appleMapsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(appleMapsUrl);
      } else {
        Linking.openURL(googleMapsUrl);
      }
    });
  } else {
    // On Android, geo: intent is standard, but Google Maps URL is more reliable for labels
    const androidUrl = `geo:0,0?q=${encodedAddress}`;
    Linking.canOpenURL(androidUrl).then((supported) => {
      if (supported) {
        Linking.openURL(androidUrl);
      } else {
        Linking.openURL(googleMapsUrl);
      }
    });
  }
};

/**
 * Fetches the human-readable address of the current location.
 * @returns {Promise<string|null>}
 */
export const getCurrentAddress = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    let location = await Location.getCurrentPositionAsync({});
    let reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });

    if (reverseGeocode.length > 0) {
      const addr = reverseGeocode[0];
      const parts = [
        addr.name,
        addr.street,
        addr.district,
        addr.city,
        addr.region,
        addr.country
      ].filter(part => part && part !== 'null' && part !== '');
      
      // Remove duplicates and join
      return [...new Set(parts)].join(', ');
    } else {
      return `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
    }
  } catch (error) {
    console.error('getCurrentAddress error:', error);
    throw error;
  }
};
