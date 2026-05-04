import { Linking, Platform } from 'react-native';

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
