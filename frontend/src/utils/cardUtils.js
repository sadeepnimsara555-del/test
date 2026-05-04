/**
 * Formats a card number string with spaces every 4 digits.
 * Example: "1234567812345678" -> "1234 5678 1234 5678"
 */
export const formatCardNumber = (text) => {
  const cleaned = text.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  const matches = cleaned.match(/\d{1,4}/g);
  if (!matches) return '';
  return matches.join(' ').substring(0, 19); // 16 digits + 3 spaces
};

/**
 * Formats an expiry date string as MM/YY.
 * Example: "1224" -> "12/24"
 */
export const formatExpiry = (text) => {
  const cleaned = text.replace(/[^0-9]/g, '');
  if (cleaned.length >= 2) {
    let month = cleaned.substring(0, 2);
    let year = cleaned.substring(2, 4);
    return `${month}/${year}`;
  }
  return cleaned;
};

/**
 * Validates card details for strict length and logic.
 */
export const validateCardDetails = (cardNumber, expiry, cvv) => {
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  const cleanExpiry = expiry.replace('/', '');
  
  if (cleanNumber.length !== 16) return { valid: false, message: 'Card number must be exactly 16 digits' };
  
  if (cleanExpiry.length !== 4) return { valid: false, message: 'Expiry date must be in MM/YY format' };
  
  const month = parseInt(cleanExpiry.substring(0, 2));
  if (month > 12) return { valid: false, message: 'Expiry month cannot be more than 12' };
  if (month === 0) return { valid: false, message: 'Expiry month cannot be 00' };

  const inputYear = parseInt(cleanExpiry.substring(2, 4));
  const currentYearFull = new Date().getFullYear();
  const currentYear = currentYearFull % 100;
  const maxYear = currentYear + 10;

  if (inputYear < currentYear || inputYear > maxYear) {
    return { valid: false, message: 'check the year again' };
  }

  // If same year, check if month has passed
  if (inputYear === currentYear) {
    const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed
    if (month < currentMonth) {
      return { valid: false, message: 'This card has already expired' };
    }
  }

  if (cvv.length !== 3) return { valid: false, message: 'CVV must be exactly 3 digits' };
  
  return { valid: true };
};
