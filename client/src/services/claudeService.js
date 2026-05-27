import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_FUNCTIONS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Calls Cloud Function to generate a professional HR email
 * @param {string} type - congratulations, rejection, meeting, offer, check-in
 * @param {string} recipientName 
 * @param {string} recipientRole 
 * @param {string} context 
 * @returns {Promise<{subject: string, body: string} | null>}
 */
export async function generateEmail(type, recipientName, recipientRole, context) {
  try {
    const response = await api.post('/api/ai/compose-email', {
      type,
      recipientName,
      recipientRole,
      context
    });
    return response.data; // Expected format: { subject, body }
  } catch (error) {
    console.error('Error in generateEmail:', error);
    return null;
  }
}

/**
 * Calls Cloud Function to generate an AI performance review
 * @param {Object} employeeData 
 * @param {Object} attendanceData 
 * @param {Array} performanceHistory 
 * @returns {Promise<string | null>}
 */
export async function generatePerformanceReview(employeeData, attendanceData, performanceHistory) {
  try {
    const response = await api.post('/api/ai/performance-review', {
      employeeData,
      attendanceData,
      performanceHistory
    });
    return response.data; // Expected format: string
  } catch (error) {
    console.error('Error in generatePerformanceReview:', error);
    return null;
  }
}

/**
 * Calls Cloud Function to generate a 3-sentence org health insight
 * @param {Object} orgStats - { avgAttendance, avgPerformance, leaveRate, internConversionRate }
 * @returns {Promise<string | null>}
 */
export async function generateOrgHealthInsight(orgStats) {
  try {
    const response = await api.post('/api/ai/org-health-insight', orgStats);
    return response.data; // Expected format: string
  } catch (error) {
    console.error('Error in generateOrgHealthInsight:', error);
    return null;
  }
}

/**
 * Calls Cloud Function to filter employees using Natural Language
 * @param {string} query - The natural language query
 * @param {Array} employeeData - The dataset to search against
 * @returns {Promise<Array | null>}
 */
export async function naturalLanguageSearch(query, employeeData) {
  try {
    const response = await api.post('/api/ai/nl-search', {
      query,
      data: employeeData
    });
    return response.data; // Expected format: filtered array
  } catch (error) {
    console.error('Error in naturalLanguageSearch:', error);
    return null;
  }
}
