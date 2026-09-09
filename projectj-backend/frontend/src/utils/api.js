export const API_BASE_URL = 'http://localhost:8080';

export const apiFetch = async (endpoint, options = {}) => {
  const storedUser = localStorage.getItem('user');
  let token = null;
  if (storedUser && storedUser !== 'undefined') {
    try {
      const parsedUser = JSON.parse(storedUser);
      token = parsedUser ? parsedUser.token : null;
      console.log('API Fetch: read token from localStorage:', token ? `${token.substring(0, 15)}...` : 'null');
    } catch (e) {
      console.error('API Fetch: error parsing user from localStorage:', e);
      localStorage.removeItem('user');
    }
  } else {
    console.log('API Fetch: no valid user found in localStorage');
  }

  // Construct absolute URL
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Prepare headers
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`API Fetch: attaching Authorization header to [${url}]`);
  }

  // Set JSON Content-Type if body is present and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};
