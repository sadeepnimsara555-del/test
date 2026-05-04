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

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const { latitude, longitude } = location.coords;

    try {
      // Wrap reverseGeocodeAsync in a timeout to prevent long hangs
      const reverseGeocodePromise = Location.reverseGeocodeAsync({ latitude, longitude });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      let reverseGeocode = await Promise.race([reverseGeocodePromise, timeoutPromise]);

      if (reverseGeocode && reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const parts = [
          addr.name,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.country
        ].filter(part => part && part !== 'null' && part !== '');
        
        return [...new Set(parts)].join(', ');
      }
    } catch (innerError) {
      console.warn('Reverse geocoding failed or timed out, falling back to coordinates');
    }

    // Fallback: Return raw coordinates if reverse geocoding fails
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('getCurrentAddress error:', error);
    throw error;
  }
};
