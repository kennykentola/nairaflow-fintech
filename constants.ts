export const APP_NAME = "NairaFlow";
export const CURRENCY = "₦";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const MOCK_DELAY = 800; // Simulated network latency

export const LOAN_PURPOSES = [
  "Business Expansion",
  "Personal Emergency",
  "Education / School Fees",
  "Rent Payment",
  "Device Purchase",
  "Medical Bills"
];
