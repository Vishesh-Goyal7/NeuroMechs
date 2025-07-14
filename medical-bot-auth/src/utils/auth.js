// Utility function to handle logout
export function logout() {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('token');
  window.location.href = '/'; // Redirect to base link
}
