export const utils = {
  formatDate: (dateString) => new Date(dateString).toLocaleString(),
  truncateText: (text, maxLength = 100) => text.length > maxLength ? `${text.substring(0, maxLength)}...` : text,
  showToast: (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};