// API utility for making requests to the backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Make a fetch request to the API
 * @param {string} endpoint - The API endpoint (without the base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise} - The fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Add authorization header if token exists
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If we're sending JSON data, add the Content-Type header
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  console.log(`Making API request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // For non-2xx responses, throw an error
    if (!response.ok) {
      // Try to parse the error response as JSON
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, create a generic error message
        errorData = { error: `API request failed with status ${response.status}` };
      }
      
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API request to ${url} failed:`, error);
    throw error;
  }
};

// Convenience methods for common HTTP methods
export const get = (endpoint) => apiRequest(endpoint, { method: 'GET' });

export const post = (endpoint, data) => {
  const options = {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  };
  
  return apiRequest(endpoint, options);
};

export const put = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const del = (endpoint) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
  });
};

export default {
  get,
  post,
  put,
  delete: del,
}; 