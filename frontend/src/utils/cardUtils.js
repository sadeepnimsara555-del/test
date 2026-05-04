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
    
    // Simple month validation (01-12)
    if (parseInt(month) > 12) month = '12';
    if (month.length === 2 && parseInt(month) === 0) month = '01';
    
    return `${month}/${year}`;
  }
  return cleaned;
};

/**
 * Validates card details for strict length.
 */
export const validateCardDetails = (cardNumber, expiry, cvv) => {
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  const cleanExpiry = expiry.replace('/', '');
  
  if (cleanNumber.length !== 16) return { valid: false, message: 'Card number must be exactly 16 digits' };
  if (cleanExpiry.length !== 4) return { valid: false, message: 'Expiry date must be in MM/YY format' };
  if (cvv.length !== 3) return { valid: false, message: 'CVV must be exactly 3 digits' };
  
  return { valid: true };
};
