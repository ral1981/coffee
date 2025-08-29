<template>
  <button 
    :class="[
      'action-btn',
      `variant-${variant}`,
      `size-${size}`,
      { disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
    @keydown.enter.space.stop.prevent="$emit('click')"
    :aria-label="ariaLabel || label"
    tabindex="0"
  >
    <!-- Loading state -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>
    
    <!-- Icon -->
    <component 
      v-else-if="icon" 
      :is="iconComponent" 
      :size="iconSize" 
      class="btn-icon" 
    />
    
    <!-- Label -->
    <span v-if="label" class="btn-label">{{ label }}</span>
    
    <!-- Badge/count -->
    <span v-if="badge !== null && badge !== undefined" class="btn-badge">
      {{ badge }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { Download, Trash2, Heart, Plus, Filter, X, Check } from 'lucide-vue-next'

const props = defineProps({
  label: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'secondary', 'danger', 'success'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  badge: {
    type: [Number, String],
    default: null
  },
  ariaLabel: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['click'])

// Dynamic icon import
const iconComponent = computed(() => {
  if (!props.icon) return null
  
  const iconMap = {
    'Download': Download,
    'Trash2': Trash2,
    'Heart': Heart,
    'Plus': Plus,
    'Filter': Filter,
    'X': X,
    'Check': Check
  }
  
  return iconMap[props.icon] || 'div'
})

const iconSize = computed(() => {
  const sizeMap = {
    small: 14,
    medium: 16,
    large: 18
  }
  return sizeMap[props.size] || 16
})
</script>

<style scoped>
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
  justify-content: center;
  white-space: nowrap;
}

.action-btn:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #22c55e;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Size variants */
.action-btn.size-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.action-btn.size-medium {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.action-btn.size-large {
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
}

/* Color variants */
.action-btn.variant-default:hover:not(.disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn.variant-primary {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.action-btn.variant-primary:hover:not(.disabled) {
  background: #16a34a;
  border-color: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3);
}

.action-btn.variant-primary:focus {
  box-shadow: 0 0 0 2px #22c55e;
}

.action-btn.variant-secondary {
  background: #f8f9fa;
  color: #6b7280;
  border-color: #d1d5db;
}

.action-btn.variant-secondary:hover:not(.disabled) {
  background: #e5e7eb;
  color: #374151;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.action-btn.variant-danger:hover:not(.disabled) {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.action-btn.variant-danger:focus {
  box-shadow: 0 0 0 2px #ef4444;
}

.action-btn.variant-success:hover:not(.disabled) {
  border-color: #22c55e;
  color: #22c55e;
  background: #f0fdf4;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
}

.action-btn.variant-success:focus {
  box-shadow: 0 0 0 2px #22c55e;
}

/* Icon and content */
.btn-icon {
  color: currentColor;
  flex-shrink: 0;
}

.btn-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.btn-badge {
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  margin-left: 0.25rem;
  flex-shrink: 0;
}

.action-btn.variant-primary .btn-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Loading spinner */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .action-btn {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }
  
  .action-btn.variant-default:hover:not(.disabled) {
    background: #4b5563;
    border-color: #6b7280;
  }
  
  .action-btn.variant-secondary {
    background: #1f2937;
    color: #9ca3af;
    border-color: #374151;
  }
  
  .action-btn.variant-secondary:hover:not(.disabled) {
    background: #374151;
    color: #d1d5db;
  }
  
  .action-btn.variant-danger:hover:not(.disabled) {
    background: rgba(220, 38, 38, 0.1);
  }
  
  .action-btn.variant-success:hover:not(.disabled) {
    background: rgba(34, 197, 94, 0.1);
  }
  
  .btn-badge {
    background: rgba(31, 41, 55, 0.9);
    color: #d1d5db;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .action-btn {
    border-width: 2px;
    font-weight: 600;
  }
  
  .btn-badge {
    border: 1px solid currentColor;
    font-weight: 700;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .action-btn {
    transition: none;
  }
  
  .action-btn:hover {
    transform: none;
  }
  
  .spinner {
    animation: none;
  }
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .action-btn.size-medium {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .action-btn.size-large {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .btn-label {
    display: none; /* Show icon only on mobile */
  }
  
  .action-btn[aria-label] .btn-label {
    /* Keep label visible if it's the only text identifier */
    display: initial;
  }
}
</style>