<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'toast',
            `toast--${toast.type}`,
            'transform transition-all duration-300 ease-in-out'
          ]"
          @click="removeToast(toast.id)"
        >
          <div class="toast__icon">
            <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5" />
            <XCircle v-else-if="toast.type === 'error'" class="w-5 h-5" />
            <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5" />
            <Info v-else class="w-5 h-5" />
          </div>
          
          <div class="toast__content">
            <p class="toast__message">{{ toast.message }}</p>
            <p v-if="toast.details" class="toast__details">{{ toast.details }}</p>
          </div>
          
          <button
            @click.stop="removeToast(toast.id)"
            class="toast__close"
            aria-label="Close notification"
          >
            <X class="w-4 h-4" />
          </button>
          
          <!-- Progress bar for auto-dismiss -->
          <div
            v-if="toast.duration > 0"
            class="toast__progress"
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 24rem;
  width: 100vw;
  max-width: min(24rem, calc(100vw - 2rem));
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
}

.toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.toast--success {
  border-left-color: #10b981;
}

.toast--success .toast__icon {
  color: #10b981;
}

.toast--error {
  border-left-color: #ef4444;
}

.toast--error .toast__icon {
  color: #ef4444;
}

.toast--warning {
  border-left-color: #f59e0b;
}

.toast--warning .toast__icon {
  color: #f59e0b;
}

.toast--info {
  border-left-color: #3b82f6;
}

.toast--info .toast__icon {
  color: #3b82f6;
}

.toast__icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.25;
}

.toast__details {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  line-height: 1.25;
}

.toast__close {
  flex-shrink: 0;
  padding: 0.25rem;
  color: #9ca3af;
  border: none;
  background: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toast__close:hover {
  color: #6b7280;
  background: #f3f4f6;
}

.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  transform-origin: left;
  animation: toast-progress linear forwards;
}

@keyframes toast-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* Transition animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Dark mode support */
.dark .toast {
  background: #1f2937;
  color: white;
}

.dark .toast__message {
  color: #f9fafb;
}

.dark .toast__details {
  color: #d1d5db;
}

.dark .toast__close {
  color: #9ca3af;
}

.dark .toast__close:hover {
  color: #d1d5db;
  background: #374151;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .toast-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
  }
  
  .toast-list {
    max-width: none;
    width: auto;
  }
  
  .toast {
    padding: 0.75rem;
  }
  
  .toast__message {
    font-size: 0.875rem;
  }
  
  .toast__details {
    font-size: 0.8125rem;
  }
}
</style>