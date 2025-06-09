export const auth = {
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-change'));
    console.log('Logged in with token:', token); // Debug logging
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('auth-change'));
    window.location.href = 'login.html';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  getAuthHeaders: () => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Auth header with token:', `Bearer ${token}`); // Debug logging
      return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    console.log('No token available'); // Debug logging
    return { 'Content-Type': 'application/json' };
  },

  getToken: () => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Retrieved token:', token); // Debug logging
    } else {
      console.log('No token found'); // Debug logging
    }
    return token;
  },

  requireAuth: () => {
    if (!localStorage.getItem('token')) {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
      return false;
    }
    return true;
  }
};