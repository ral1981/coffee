<template>
  <div 
    :class="[
      'filter-tag',
      `variant-${variant}`,
      { 
        active, 
        disabled,
        'multi-selected': multiSelected,
        'has-remove': removable
      }
    ]"
    @click="handleClick"
    @keydown.enter.space.stop.prevent="handleClick"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-pressed="active"
    :aria-disabled="disabled"
  >
    <!-- Icon (if provided) -->
    <component 
      v-if="icon" 
      :is="iconComponent" 
      :size="iconSize" 
      :class="{ 
        'filled': active && variant === 'favorites',
        'icon': true
      }" 
    />
    
    <!-- Color dot (for containers) -->
    <div 
      v-if="colorDot" 
      class="color-dot" 
      :style="{ backgroundColor: colorDot }"
    ></div>
    
    <!-- Label -->
    <span class="tag-label">{{ label }}</span>
    
    <!-- Count -->
    <span v-if="count !== null && count !== undefined" class="tag-count">
      ({{ count }})
    </span>
    
    <!-- Selection indicator -->
    <div v-if="active && !removable" class="selection-indicator">
      <Check :size="12" />
    </div>
    
    <!-- Remove button -->
    <button 
      v-if="removable" 
      @click.stop="$emit('remove')"
      @keydown.enter.space.stop.prevent="$emit('remove')"
      class="remove-btn"
      :aria-label="`Remove ${label} filter`"
      tabindex="0"
    >
      <X :size="12" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Heart, Archive, MapPin, Store, Check, X } from 'lucide-vue-next'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  count: {
    type: Number,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  iconSize: {
    type: Number,
    default: 16
  },
  colorDot: {
    type: String,
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'favorites', 'container', 'additional'].includes(value)
  },
  removable: {
    type: Boolean,
    default: false
  },
  multiSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'remove'])

// Dynamic icon import
const iconComponent = computed(() => {
  if (!props.icon) return null
  
  const iconMap = {
    'Heart': Heart,
    'Archive': Archive,
    'MapPin': MapPin,
    'Store': Store
  }
  
  return iconMap[props.icon] || 'div'
})

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<style scoped>
.filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
  font-weight: 500;
  position: relative;
  user-select: none;
}

.filter-tag:hover:not(.disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.filter-tag:focus {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
}

.filter-tag.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-tag.disabled:hover {
  transform: none;
  background: #f8f9fa;
}

/* Active states */
.filter-tag.active {
  font-weight: 600;
  animation: tagSelect 0.3s ease-out;
}

/* Variant styles */
.filter-tag.variant-default.active {
  background: #22c55e20;
  border-color: #22c55e;
  color: #22c55e;
}

.filter-tag.variant-default.active:hover {
  background: #22c55e30;
}

.filter-tag.variant-favorites.active {
  background: #fef7e7;
  border-color: #f59e0b;
  color: #d97706;
}

.filter-tag.variant-favorites.active:hover {
  background: #fef3c7;
}

.filter-tag.variant-container.active {
  background: #22c55e20;
  border-color: #22c55e;
  color: #22c55e;
}

.filter-tag.variant-container.active:hover {
  background: #22c55e30;
}

.filter-tag.variant-additional.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
}

.filter-tag.variant-additional.active:hover {
  background: #dbeafe;
}

/* Multi-selected styling */
.filter-tag.multi-selected {
  background: #22c55e25;
  border-color: #22c55e;
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
}

/* Icon styles */
.icon {
  color: currentColor;
  flex-shrink: 0;
}

.icon.filled {
  fill: currentColor;
}

/* Color dot */
.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.filter-tag.active .color-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

/* Label and count */
.tag-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.tag-count {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 400;
  flex-shrink: 0;
}

/* Selection indicator */
.selection-indicator {
  margin-left: 0.25rem;
  color: currentColor;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Remove button */
.remove-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  margin-left: 0.25rem;
  padding: 0.125rem;
  cursor: pointer;
  border-radius: 50%;
  color: #6b7280;
  opacity: 0.7;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.remove-btn:hover {
  opacity: 1;
  background: #fef2f2;
  color: #ef4444;
  transform: scale(1.1);
}

.remove-btn:focus {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
}

/* Animation */
@keyframes tagSelect {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .filter-tag {
    background: #374151;
    color: #d1d5db;
  }
  
  .filter-tag:hover:not(.disabled) {
    background: #4b5563;
  }
  
  .filter-tag.variant-default.active {
    background: rgba(34, 197, 94, 0.2);
    border-color: #22c55e;
    color: #34d399;
  }
  
  .filter-tag.variant-favorites.active {
    background: rgba(251, 191, 36, 0.2);
    border-color: #fbbf24;
    color: #fcd34d;
  }
  
  .remove-btn {
    background: rgba(31, 41, 55, 0.9);
    color: #9ca3af;
  }
  
  .remove-btn:hover {
    background: rgba(220, 38, 38, 0.2);
    color: #f87171;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .filter-tag {
    border-width: 2px;
    font-weight: 600;
  }
  
  .filter-tag.active {
    border-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .filter-tag {
    transition: none;
  }
  
  .filter-tag:hover {
    transform: none;
  }
  
  .filter-tag.active {
    animation: none;
  }
  
  .remove-btn:hover {
    transform: none;
  }
}
</style>