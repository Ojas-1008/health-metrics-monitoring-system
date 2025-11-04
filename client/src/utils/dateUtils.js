/**
 * ============================================
 * DATE UTILITY FUNCTIONS
 * ============================================
 *
 * Purpose: Centralized date handling for Health Metrics app
 *
 * Features:
 * - Format dates for display (short, long, ISO formats)
 * - Parse dates from various inputs
 * - Get date ranges (last 7/30/90/365 days, custom)
 * - Date arithmetic (add/subtract days)
 * - Date validation
 * - Relative date labels ("Today", "Yesterday", etc.)
 * - Date comparison utilities
 *
 * Note: All dates are normalized to UTC midnight (00:00:00)
 * to match backend date storage conventions
 */

/**
 * ============================================
 * FORMAT FUNCTIONS
 * ============================================
 */

/**
 * Format date for display (short format: MMM DD, YYYY)
 * @param {string|Date} date - Date to format (ISO string or Date object)
 * @returns {string} - Formatted date string (e.g., "Nov 04, 2025")
 *
 * @example
 * formatDateShort('2025-11-04'); // "Nov 04, 2025"
 * formatDateShort(new Date()); // "Nov 04, 2025"
 */
export const formatDateShort = (date) => {
  try {
    const dateObj = normalizeDate(date);
    if (!dateObj) return '';

    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date (short):', error);
    return '';
  }
};

/**
 * Format date for display (long format: Monday, November 4, 2025)
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 *
 * @example
 * formatDateLong('2025-11-04'); // "Monday, November 4, 2025"
 */
export const formatDateLong = (date) => {
  try {
    const dateObj = normalizeDate(date);
    if (!dateObj) return '';

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date (long):', error);
    return '';
  }
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} - ISO string (e.g., "2025-11-04")
 *
 * @example
 * formatDateISO('2025-11-04'); // "2025-11-04"
 * formatDateISO(new Date('2025-11-04')); // "2025-11-04"
 */
export const formatDateISO = (date) => {
  try {
    const dateObj = normalizeDate(date);
    if (!dateObj) return '';

    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date (ISO):', error);
    return '';
  }
};

/**
 * Format date with custom pattern
 * @param {string|Date} date - Date to format
 * @param {string} format - Format pattern (e.g., 'MM/DD/YYYY', 'DD-MM-YYYY')
 * @returns {string} - Formatted date string
 *
 * @example
 * formatDateCustom('2025-11-04', 'MM/DD/YYYY'); // "11/04/2025"
 * formatDateCustom('2025-11-04', 'DD-MM-YYYY'); // "04-11-2025"
 */
export const formatDateCustom = (date, format = 'MM/DD/YYYY') => {
  try {
    const dateObj = normalizeDate(date);
    if (!dateObj) return '';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  } catch (error) {
    console.error('Error formatting date (custom):', error);
    return '';
  }
};

/**
 * Get relative date label (Today, Yesterday, Tomorrow, or date)
 * @param {string|Date} date - Date to get label for
 * @returns {string} - Relative label (e.g., "Today", "Yesterday", "Nov 04")
 *
 * @example
 * getRelativeDateLabel(new Date()); // "Today"
 * getRelativeDateLabel(addDays(new Date(), -1)); // "Yesterday"
 * getRelativeDateLabel('2025-11-02'); // "Nov 02"
 */
export const getRelativeDateLabel = (date) => {
  try {
    const dateObj = normalizeDate(date);
    const today = normalizeDate(new Date());

    if (!dateObj || !today) return '';

    const diffTime = today - dateObj;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === -1) return 'Tomorrow';

    return formatDateShort(dateObj);
  } catch (error) {
    console.error('Error getting relative date label:', error);
    return '';
  }
};

/**
 * ============================================
 * PARSE FUNCTIONS
 * ============================================
 */

/**
 * Parse date from various input formats
 * @param {string|Date|number} date - Date to parse (ISO string, Date object, or timestamp)
 * @returns {Date|null} - Normalized Date object or null if invalid
 *
 * @example
 * parseDate('2025-11-04'); // Date object
 * parseDate(new Date()); // Date object
 * parseDate(1730678400000); // Date object from timestamp
 */
export const parseDate = (date) => {
  if (!date) return null;

  try {
    // Already a Date object
    if (date instanceof Date) {
      return normalizeDate(date);
    }

    // ISO string or other string format
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      return normalizeDate(dateObj);
    }

    // Timestamp (milliseconds)
    if (typeof date === 'number') {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      return normalizeDate(dateObj);
    }

    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * ============================================
 * DATE RANGE FUNCTIONS
 * ============================================
 */

/**
 * Get date range for last N days
 * @param {number} days - Number of days (e.g., 7, 30, 90)
 * @returns {object} - { startDate: string, endDate: string } in ISO format
 *
 * @example
 * getLast7Days(); // { startDate: "2025-10-28", endDate: "2025-11-04" }
 * getLast30Days(); // { startDate: "2025-10-05", endDate: "2025-11-04" }
 */
export const getLastNDays = (days = 7) => {
  try {
    if (days < 1 || days > 365) {
      console.warn(`Invalid days parameter: ${days}. Must be between 1 and 365.`);
      days = 7; // Default fallback
    }

    const endDate = normalizeDate(new Date());
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1)); // Include today
    normalizeDate(startDate);

    return {
      startDate: formatDateISO(startDate),
      endDate: formatDateISO(endDate),
      days,
    };
  } catch (error) {
    console.error(`Error getting last ${days} days:`, error);
    return { startDate: '', endDate: '', days: 0 };
  }
};

/**
 * Get date range for last 7 days (this week)
 * @returns {object} - { startDate, endDate, label }
 *
 * @example
 * getLast7Days();
 */
export const getLast7Days = () => {
  const range = getLastNDays(7);
  return { ...range, label: 'Last 7 Days' };
};

/**
 * Get date range for last 30 days (this month)
 * @returns {object} - { startDate, endDate, label }
 *
 * @example
 * getLast30Days();
 */
export const getLast30Days = () => {
  const range = getLastNDays(30);
  return { ...range, label: 'Last 30 Days' };
};

/**
 * Get date range for last 90 days (this quarter)
 * @returns {object} - { startDate, endDate, label }
 *
 * @example
 * getLast90Days();
 */
export const getLast90Days = () => {
  const range = getLastNDays(90);
  return { ...range, label: 'Last 90 Days' };
};

/**
 * Get date range for last 365 days (this year)
 * @returns {object} - { startDate, endDate, label }
 *
 * @example
 * getLast365Days();
 */
export const getLast365Days = () => {
  const range = getLastNDays(365);
  return { ...range, label: 'Last 365 Days' };
};

/**
 * Get custom date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {object} - { startDate, endDate, days } in ISO format
 *
 * @example
 * getDateRange('2025-11-01', '2025-11-04');
 * // { startDate: "2025-11-01", endDate: "2025-11-04", days: 4 }
 */
export const getDateRange = (startDate, endDate) => {
  try {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    if (!start || !end) {
      console.error('Invalid date range provided');
      return { startDate: '', endDate: '', days: 0 };
    }

    if (start > end) {
      console.warn('Start date is after end date. Swapping...');
      return getDateRange(end, start);
    }

    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates

    return {
      startDate: formatDateISO(start),
      endDate: formatDateISO(end),
      days: diffDays,
    };
  } catch (error) {
    console.error('Error getting date range:', error);
    return { startDate: '', endDate: '', days: 0 };
  }
};

/**
 * Get date range for current month
 * @returns {object} - { startDate, endDate, label }
 *
 * @example
 * getCurrentMonth(); // { startDate: "2025-11-01", endDate: "2025-11-04", label: "November 2025" }
 */
export const getCurrentMonth = () => {
  try {
    const today = normalizeDate(new Date());
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    normalizeDate(startDate);
    normalizeDate(endDate);

    const monthName = startDate.toLocaleDateString('en-US', { month: 'long' });
    const year = startDate.getFullYear();

    return {
      startDate: formatDateISO(startDate),
      endDate: formatDateISO(endDate),
      label: `${monthName} ${year}`,
      days: getDaysBetween(startDate, endDate),
    };
  } catch (error) {
    console.error('Error getting current month:', error);
    return { startDate: '', endDate: '', label: '', days: 0 };
  }
};

/**
 * Get date range for current year
 * @returns {object} - { startDate, endDate, label }
 *
 * @example
 * getCurrentYear(); // { startDate: "2025-01-01", endDate: "2025-11-04", label: "2025" }
 */
export const getCurrentYear = () => {
  try {
    const today = normalizeDate(new Date());
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = today;

    normalizeDate(startDate);
    normalizeDate(endDate);

    return {
      startDate: formatDateISO(startDate),
      endDate: formatDateISO(endDate),
      label: `${year}`,
      days: getDaysBetween(startDate, endDate),
    };
  } catch (error) {
    console.error('Error getting current year:', error);
    return { startDate: '', endDate: '', label: '', days: 0 };
  }
};

/**
 * ============================================
 * DATE ARITHMETIC FUNCTIONS
 * ============================================
 */

/**
 * Add days to a date
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} - New normalized date
 *
 * @example
 * addDays('2025-11-04', 5); // 2025-11-09
 * addDays(new Date(), -7); // 7 days ago
 */
export const addDays = (date, days = 0) => {
  try {
    const dateObj = normalizeDate(date);
    if (!dateObj) return null;

    const newDate = new Date(dateObj);
    newDate.setDate(newDate.getDate() + days);
    return normalizeDate(newDate);
  } catch (error) {
    console.error('Error adding days:', error);
    return null;
  }
};

/**
 * Subtract days from a date
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to subtract
 * @returns {Date} - New normalized date
 *
 * @example
 * subtractDays('2025-11-04', 3); // 2025-11-01
 */
export const subtractDays = (date, days = 0) => {
  return addDays(date, -days);
};

/**
 * Get days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} - Number of days between (inclusive)
 *
 * @example
 * getDaysBetween('2025-11-01', '2025-11-04'); // 4
 */
export const getDaysBetween = (startDate, endDate) => {
  try {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    if (!start || !end) return 0;

    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end
  } catch (error) {
    console.error('Error getting days between:', error);
    return 0;
  }
};

/**
 * ============================================
 * DATE COMPARISON FUNCTIONS
 * ============================================
 */

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today
 *
 * @example
 * isToday(new Date()); // true
 * isToday('2025-11-03'); // false (if today is 2025-11-04)
 */
export const isToday = (date) => {
  try {
    const dateObj = normalizeDate(date);
    const today = normalizeDate(new Date());

    if (!dateObj || !today) return false;

    return dateObj.getTime() === today.getTime();
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is before today
 *
 * @example
 * isPast('2025-11-01'); // true
 */
export const isPast = (date) => {
  try {
    const dateObj = normalizeDate(date);
    const today = normalizeDate(new Date());

    if (!dateObj || !today) return false;

    return dateObj < today;
  } catch (error) {
    console.error('Error checking if date is past:', error);
    return false;
  }
};

/**
 * Check if date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is after today
 *
 * @example
 * isFuture('2025-11-05'); // true
 */
export const isFuture = (date) => {
  try {
    const dateObj = normalizeDate(date);
    const today = normalizeDate(new Date());

    if (!dateObj || !today) return false;

    return dateObj > today;
  } catch (error) {
    console.error('Error checking if date is future:', error);
    return false;
  }
};

/**
 * Check if date is valid
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is valid
 *
 * @example
 * isValidDate('2025-11-04'); // true
 * isValidDate('invalid-date'); // false
 */
export const isValidDate = (date) => {
  const dateObj = parseDate(date);
  return dateObj !== null;
};

/**
 * Compare two dates
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {number} - -1 if date1 {`<`} date2, 0 if equal, 1 if date1 {`>`} date2
 *
 * @example
 * compareDates('2025-11-01', '2025-11-04'); // -1
 * compareDates('2025-11-04', '2025-11-04'); // 0
 * compareDates('2025-11-05', '2025-11-04'); // 1
 */
export const compareDates = (date1, date2) => {
  try {
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);

    if (!d1 || !d2) return 0;

    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  } catch (error) {
    console.error('Error comparing dates:', error);
    return 0;
  }
};

/**
 * ============================================
 * HELPER FUNCTIONS (Private)
 * ============================================
 */

/**
 * Normalize date to UTC midnight (00:00:00)
 * Used internally to ensure consistent date handling
 * @param {string|Date} date - Date to normalize
 * @returns {Date|null} - Normalized Date object or null if invalid
 *
 * @private
 */
const normalizeDate = (date) => {
  try {
    let dateObj;

    if (typeof date === 'string') {
      // Parse ISO string
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = new Date(date);
    } else {
      return null;
    }

    if (isNaN(dateObj.getTime())) {
      return null;
    }

    // Set to midnight UTC
    dateObj.setHours(0, 0, 0, 0);

    return dateObj;
  } catch (error) {
    console.error('Error normalizing date:', error);
    return null;
  }
};

/**
 * ============================================
 * PRESET DATE RANGES
 * ============================================
 */

/**
 * Get all predefined date range options
 * @returns {array} - Array of date range presets
 *
 * @example
 * getDateRangePresets();
 * // [
 * //   { label: 'Last 7 Days', key: 'last7days', ...range },
 * //   { label: 'Last 30 Days', key: 'last30days', ...range },
 * //   ...
 * // ]
 */
export const getDateRangePresets = () => {
  return [
    { key: 'last7days', ...getLast7Days() },
    { key: 'last30days', ...getLast30Days() },
    { key: 'last90days', ...getLast90Days() },
    { key: 'last365days', ...getLast365Days() },
    { key: 'currentMonth', ...getCurrentMonth() },
    { key: 'currentYear', ...getCurrentYear() },
  ];
};

/**
 * ============================================
 * DEFAULT EXPORT
 * ============================================
 */

export default {
  // Format functions
  formatDateShort,
  formatDateLong,
  formatDateISO,
  formatDateCustom,
  getRelativeDateLabel,

  // Parse functions
  parseDate,

  // Date range functions
  getLastNDays,
  getLast7Days,
  getLast30Days,
  getLast90Days,
  getLast365Days,
  getDateRange,
  getCurrentMonth,
  getCurrentYear,
  getDateRangePresets,

  // Arithmetic functions
  addDays,
  subtractDays,
  getDaysBetween,

  // Comparison functions
  isToday,
  isPast,
  isFuture,
  isValidDate,
  compareDates,
};
