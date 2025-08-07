<template>
  <Teleport to="body">
    <button
      class="fab"
      :class="[
        `fab--${variant}`,
        `fab--${size}`,
        {
          'fab--extended': extended,
          'fab--hidden': hidden,
          'fab--mini': mini
        }
      ]"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @click="handleClick"
    >
      <!-- Icon -->
      <component
        v-if="icon && !loading"
        :is="icon"
        class="fab-icon"
        :size="iconSize"
      />
      
      <!-- Loading Spinner -->
      <div
        v-else-if="loading"
        class="fab-spinner"
        aria-hidden="true"
      >
        <svg
          class="fab-spinner-svg"
          :width="iconSize"
          :height="iconSize"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            class="fab-spinner-circle"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="31.416"
            stroke-dashoffset="31.416"
          />
        </svg>
      </div>
      
      <!-- Default Plus Icon -->
      <svg
        v-else-if="!icon && !loading"
        class="fab-icon fab-icon--default"
        :width="iconSize"
        :height="iconSize"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>

      <!-- Extended Label -->
      <span v-if="extended && label" class="fab-label">
        {{ label }}
      </span>
    </button>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  // Icon component (from lucide-vue-next or custom)
  icon: {
    type: [Object, Function, String],
    default: null
  },
  
  // Button label for extended FAB
  label: {
    type: String,
    default: ''
  },
  
  // Accessibility label
  ariaLabel: {
    type: String,
    default: 'Add new item'
  },
  
  // Button size variant
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  
  // Visual variant
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger'].includes(value)
  },
  
  // Extended FAB with label
  extended: {
    type: Boolean,
    default: false
  },
  
  // Mini FAB (smaller size)
  mini: {
    type: Boolean,
    default: false
  },
  
  // Hide the FAB
  hidden: {
    type: Boolean,
    default: false
  },
  
  // Disabled state
  disabled: {
    type: Boolean,
    default: false
  },
  
  // Loading state
  loading: {
    type: Boolean,
    default: false
  },
  
  // Custom position (if not using default)
  position: {
    type: Object,
    default: () => ({
      bottom: '2rem',
      right: '2rem'
    })
  }
})

// Emits
const emit = defineEmits(['click'])

// Computed properties
const iconSize = computed(() => {
  if (props.mini) return 18
  
  switch (props.size) {
    case 'small': return 18
    case 'large': return 28
    default: return 24
  }
})

// Event handlers
const handleClick = (event) => {
  if (props.disabled || props.loading) return
  
  // Haptic feedback for mobile devices
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
  
  emit('click', event)
}
</script>

<style scoped>
/* Base FAB Styles */
.fab {
  position: fixed;
  bottom: var(--fab-bottom, 2rem);
  right: var(--fab-right, 2rem);
  z-index: var(--fab-z-index, 1000);
  
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--fab-gap, 0.5rem);
  
  width: var(--fab-size, 56px);
  height: var(--fab-size, 56px);
  min-width: var(--fab-size, 56px);
  
  border: none;
  border-radius: var(--fab-border-radius, 50%);
  
  background: var(--fab-bg, var(--primary-green, #22c55e));
  color: var(--fab-color, #ffffff);
  
  font-size: var(--fab-font-size, 1rem);
  font-weight: var(--fab-font-weight, 500);
  font-family: inherit;
  
  cursor: pointer;
  user-select: none;
  
  box-shadow: var(--fab-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));
  
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

/* Hover States */
.fab:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: var(--fab-hover-shadow, 0 6px 16px rgba(0, 0, 0, 0.2));
  background: var(--fab-hover-bg, var(--primary-green-hover, #16a34a));
}

/* Active States */
.fab:active:not(:disabled) {
  transform: scale(0.95);
  transition-duration: 0.1s;
}

/* Focus States */
.fab:focus-visible {
  outline: 2px solid var(--focus-color, #22c55e);
  outline-offset: 3px;
}

/* Disabled States */
.fab:disabled {
  background: var(--fab-disabled-bg, #d1d5db);
  color: var(--fab-disabled-color, #9ca3af);
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--fab-disabled-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
}

/* Hidden State */
.fab--hidden {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

/* Size Variants */
.fab--small {
  --fab-size: 40px;
  --fab-font-size: 0.875rem;
  --fab-bottom: 1.5rem;
  --fab-right: 1.5rem;
}

.fab--large {
  --fab-size: 64px;
  --fab-font-size: 1.125rem;
}

/* Mini FAB */
.fab--mini {
  --fab-size: 40px;
  --fab-font-size: 0.875rem;
}

/* Extended FAB */
.fab--extended {
  width: auto;
  min-width: var(--fab-extended-min-width, 80px);
  padding: var(--fab-extended-padding, 0 1rem);
  border-radius: var(--fab-extended-border-radius, 28px);
}

/* Color Variants */
.fab--primary {
  --fab-bg: var(--primary-green, #22c55e);
  --fab-hover-bg: var(--primary-green-hover, #16a34a);
}

.fab--secondary {
  --fab-bg: var(--fab-secondary-bg, #6b7280);
  --fab-hover-bg: var(--fab-secondary-hover-bg, #4b5563);
}

.fab--success {
  --fab-bg: var(--fab-success-bg, #10b981);
  --fab-hover-bg: var(--fab-success-hover-bg, #059669);
}

.fab--warning {
  --fab-bg: var(--fab-warning-bg, #f59e0b);
  --fab-hover-bg: var(--fab-warning-hover-bg, #d97706);
}

.fab--danger {
  --fab-bg: var(--fab-danger-bg, #ef4444);
  --fab-hover-bg: var(--fab-danger-hover-bg, #dc2626);
}

/* Icon Styles */
.fab-icon {
  flex-shrink: 0;
  color: inherit;
}

.fab-icon--default {
  stroke-width: 2.5;
}

/* Label Styles */
.fab-label {
  white-space: nowrap;
  font-weight: var(--fab-font-weight, 500);
  letter-spacing: 0.025em;
}

/* Loading Spinner */
.fab-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-spinner-svg {
  animation: fab-spin 1s linear infinite;
}

.fab-spinner-circle {
  animation: fab-spinner-dash 1.5s ease-in-out infinite;
  stroke-linecap: round;
}

@keyframes fab-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fab-spinner-dash {
  0% {
    stroke-dashoffset: 31.416;
  }
  50% {
    stroke-dashoffset: 7.854;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 31.416;
    transform: rotate(450deg);
  }
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .fab {
    --fab-size: 48px;
    --fab-bottom: 1rem;
    --fab-right: 1rem;
    --fab-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .fab--small {
    --fab-size: 36px;
    --fab-bottom: 0.75rem;
    --fab-right: 0.75rem;
  }
  
  .fab--large {
    --fab-size: 56px;
  }
  
  .fab--extended {
    --fab-extended-min-width: 72px;
    --fab-extended-padding: 0 0.75rem;
    --fab-extended-border-radius: 24px;
  }
  
  .fab-label {
    font-size: 0.875rem;
  }
}

/* Tablet and up */
@media (min-width: 768px) {
  .fab:hover:not(:disabled) {
    transform: scale(1.1);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .fab--primary {
    --fab-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    --fab-hover-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }
  
  .fab:disabled {
    --fab-disabled-bg: #374151;
    --fab-disabled-color: #6b7280;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .fab {
    border: 2px solid currentColor;
    --fab-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  
  .fab:focus-visible {
    outline-width: 3px;
    outline-offset: 4px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .fab {
    transition: none;
  }
  
  .fab:hover:not(:disabled) {
    transform: none;
  }
  
  .fab:active:not(:disabled) {
    transform: none;
  }
  
  .fab-spinner-svg,
  .fab-spinner-circle {
    animation: none;
  }
}

/* Print Styles */
@media print {
  .fab {
    display: none;
  }
}
</style>