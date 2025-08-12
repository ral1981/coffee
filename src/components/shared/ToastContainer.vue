<template>
  <Teleport to="body">
    <div 
      v-if="toasts.length > 0" 
      class="toast-container"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast--${toast.type}`]"
          role="alert"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon">
            <!-- Success icon -->
            <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            
            <!-- Error icon -->
            <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            
            <!-- Warning icon -->
            <svg v-else-if="toast.type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21,16l-10-16L1,16z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <circle cx="12" cy="17" r="1"/>
            </svg>
            
            <!-- Info icon -->
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m12,16v-4"/>
              <path d="m12,8h.01"/>
            </svg>
          </div>
          
          <div class="toast-content">
            <div class="toast-message">{{ toast.message }}</div>
            <div v-if="toast.details" class="toast-details">{{ toast.details }}</div>
          </div>
          
          <button 
            class="toast-close"
            @click.stop="removeToast(toast.id)"
            aria-label="Close notification"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 100%;
}

.toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.toast--success {
  border-left-color: #22c55e;
  background: #f0fdf4;
}

.toast--error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.toast--warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.toast--info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast--success .toast-icon {
  color: #16a34a;
}

.toast--error .toast-icon {
  color: #dc2626;
}

.toast--warning .toast-icon {
  color: #d97706;
}

.toast--info .toast-icon {
  color: #2563eb;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25;
  margin-bottom: 0.25rem;
}

.toast--success .toast-message {
  color: #166534;
}

.toast--error .toast-message {
  color: #991b1b;
}

.toast--warning .toast-message {
  color: #92400e;
}

.toast--info .toast-message {
  color: #1e40af;
}

.toast-details {
  font-size: 0.8125rem;
  line-height: 1.25;
  opacity: 0.8;
}

.toast--success .toast-details {
  color: #15803d;
}

.toast--error .toast-details {
  color: #b91c1c;
}

.toast--warning .toast-details {
  color: #a16207;
}

.toast--info .toast-details {
  color: #1d4ed8;
}

.toast-close {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
  flex-shrink: 0;
  margin-top: -0.125rem;
}

.toast-close:hover {
  opacity: 1;
}

.toast--success .toast-close {
  color: #166534;
}

.toast--error .toast-close {
  color: #991b1b;
}

.toast--warning .toast-close {
  color: #92400e;
}

.toast--info .toast-close {
  color: #1e40af;
}

/* Toast animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .toast-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
  
  .toast {
    padding: 0.875rem;
  }
  
  .toast-message {
    font-size: 0.8125rem;
  }
  
  .toast-details {
    font-size: 0.75rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toast {
    transition: none;
  }
  
  .toast:hover {
    transform: none;
  }
  
  .toast-enter-active,
  .toast-leave-active {
    transition: opacity 0.2s;
  }
  
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>