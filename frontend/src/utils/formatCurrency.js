/**
 * Formats a number as Indian Rupee (INR) currency
 * @param {number} amount
 * @returns {string}
 */
export const formatINR = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default formatINR;
