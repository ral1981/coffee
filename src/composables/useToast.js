import { ref, reactive } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  const addToast = (type, message, details = null, duration = 4000) => {
    const id = ++toastId
    const toast = {
      id,
      type,
      message,
      details,
      duration,
      createdAt: Date.now()
    }
    
    toasts.value.push(toast)
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clearAllToasts = () => {
    toasts.value = []
  }
  
  // Convenience methods
  const success = (message, details, duration) => addToast('success', message, details, duration)
  const error = (message, details, duration) => addToast('error', message, details, duration)
  const warning = (message, details, duration) => addToast('warning', message, details, duration)
  const info = (message, details, duration) => addToast('info', message, details, duration)
  
  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  }
}