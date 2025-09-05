<template>
  <div class="container-filters">
    <div class="filter-content">
      <!-- Optional Title -->
      <h3 v-if="showTitle" class="filter-title">{{ title }}</h3>
      
      <!-- Container Tags Grid - Simplified Direct Implementation -->
      <div class="container-grid">
        <button
          v-for="container in containers"
          :key="container.id"
          class="container-filter-tag"
          :class="{ 
            'active': isContainerSelected(container.id),
            'has-count': showCounts && containerCounts[container.id],
            'multi-selected': selectedCount > 1 && isContainerSelected(container.id)
          }"
          @click="handleContainerToggle(container)"
          :disabled="disabled"
          :aria-pressed="isContainerSelected(container.id)"
          :aria-label="`${isContainerSelected(container.id) ? 'Remove' : 'Add'} ${container.name} filter`"
        >
          <!-- Container Color Dot -->
          <div 
            class="container-dot" 
            :style="{ backgroundColor: container.color }"
            :aria-hidden="true"
          ></div>
          
          <!-- Container Name -->
          <span class="container-name">{{ container.name }}</span>
          
          <!-- Count Badge (if enabled and available) -->
          <span 
            v-if="showCounts && containerCounts[container.id]" 
            class="container-count"
            :aria-label="`${containerCounts[container.id]} items`"
          >
            {{ containerCounts[container.id] }}
          </span>
          
          <!-- Selection Indicator -->
          <div 
            v-if="isContainerSelected(container.id)" 
            class="selection-indicator"
            :aria-hidden="true"
          >
            <Check :size="12" />
          </div>
        </button>
      </div>
      
      <!-- Empty State -->
      <div v-if="containers.length === 0" class="empty-state">
        <Package :size="24" class="empty-icon" />
        <p class="empty-text">No containers available</p>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading containers...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, Package } from 'lucide-vue-next'

const props = defineProps({
  /** Array of selected container IDs */
  modelValue: {
    type: Array,
    default: () => []
  },
  
  /** Array of available container objects */
  containers: {
    type: Array,
    default: () => []
  },
  
  /** Object mapping container IDs to counts */
  containerCounts: {
    type: Object,
    default: () => ({})
  },
  
  /** Whether to show the title */
  showTitle: {
    type: Boolean,
    default: true
  },
  
  /** Title text */
  title: {
    type: String,
    default: 'Containers'
  },
  
  /** Whether to show count badges */
  showCounts: {
    type: Boolean,
    default: true
  },
  
  /** Whether the filter is disabled */
  disabled: {
    type: Boolean,
    default: false
  },
  
  /** Loading state */
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Computed properties
const selectedCount = computed(() => props.modelValue.length)

// Simple selection check - directly compare container IDs
const isContainerSelected = (containerId) => {
  return props.modelValue.includes(containerId)
}

// Handle container toggle - emit container ID directly
const handleContainerToggle = (container) => {
  if (props.disabled || props.loading) return
  
  const isSelected = isContainerSelected(container.id)
  let updatedSelection
  
  if (isSelected) {
    // Remove container ID from selection
    updatedSelection = props.modelValue.filter(id => id !== container.id)
    console.log('🗑️ ContainerFilters - Removed filter:', container.name)
  } else {
    // Add container ID to selection
    updatedSelection = [...props.modelValue, container.id]
    console.log('➕ ContainerFilters - Added filter:', container.name)
  }
  
  // Emit the updated selection (array of container IDs)
  emit('update:modelValue', updatedSelection)
}

// Utility method to clear all selections (can be called by parent)
const clearAllSelections = () => {
  if (props.modelValue.length > 0) {
    console.log('🧹 ContainerFilters - Cleared all filters')
    emit('update:modelValue', [])
  }
}

// Expose methods for parent components if needed
defineExpose({
  clearAllSelections,
  isContainerSelected
})
</script>

<style scoped>
/* Container Filters Base Styles */
.container-filters {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.container-filters:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.filter-content {
  padding: 1rem;
}

/* Filter Title */
.filter-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.75rem;
  text-transform: none;
  letter-spacing: normal;
}

/* Container Grid Layout */
.container-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Container Filter Tag Styles */
.container-filter-tag {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
  min-height: 36px;
}

/* Hover shimmer effect */
.container-filter-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.container-filter-tag:hover::before {
  left: 100%;
}

/* Hover state */
.container-filter-tag:hover:not(.active):not(:disabled) {
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* Active state */
.container-filter-tag.active {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(22, 163, 74, 0.08));
  border-color: #22c55e;
  color: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  font-weight: 600;
}

/* Multi-selected enhancement */
.container-filter-tag.multi-selected {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(22, 163, 74, 0.12));
  border-color: #16a34a;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

/* Disabled state */
.container-filter-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Container Color Dot */
.container-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.container-filter-tag.active .container-dot {
  box-shadow: 
    0 0 0 2px rgba(255, 255, 255, 0.9),
    0 0 8px currentColor,
    0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(1.2);
}

.container-filter-tag.multi-selected .container-dot {
  animation: colorPulse 1.5s ease-in-out infinite;
}

@keyframes colorPulse {
  0%, 100% {
    transform: scale(1.2);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.8;
  }
}

/* Container Name */
.container-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: inherit;
}

/* Count Badge */
.container-count {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
  flex-shrink: 0;
}

.container-filter-tag.active .container-count {
  background: rgba(255, 255, 255, 0.95);
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
}

.container-filter-tag:hover .container-count {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

/* Selection Indicator */
.selection-indicator {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  padding: 2px;
  color: #16a34a;
  animation: checkmarkAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
  flex-shrink: 0;
}

@keyframes checkmarkAppear {
  from {
    opacity: 0;
    transform: scale(0) rotate(180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* Interactive hover effects on container */
.container-filters:hover .container-filter-tag:not(:hover):not(.active) {
  opacity: 0.7;
  transform: scale(0.98);
}

.container-filters:hover .container-filter-tag:hover,
.container-filters:hover .container-filter-tag.active {
  opacity: 1;
  z-index: 1;
}

/* Staggered animation for tag appearance */
.container-filter-tag {
  animation: tagAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.container-filter-tag:nth-child(1) { animation-delay: 0s; }
.container-filter-tag:nth-child(2) { animation-delay: 0.05s; }
.container-filter-tag:nth-child(3) { animation-delay: 0.1s; }
.container-filter-tag:nth-child(4) { animation-delay: 0.15s; }
.container-filter-tag:nth-child(5) { animation-delay: 0.2s; }
.container-filter-tag:nth-child(n+6) { animation-delay: 0.25s; }

@keyframes tagAppear {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
}

.empty-icon {
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-text {
  font-style: italic;
  font-size: 0.875rem;
  margin: 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-style: italic;
  font-size: 0.875rem;
  margin: 0;
}

/* Focus management for accessibility */
.container-filter-tag:focus {
  outline: 3px solid #22c55e;
  outline-offset: 2px;
  z-index: 2;
  position: relative;
}

.container-filter-tag:focus-visible {
  box-shadow: 
    0 0 0 3px rgba(34, 197, 94, 0.3),
    0 4px 12px rgba(34, 197, 94, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .filter-content {
    padding: 0.875rem;
  }
  
  .container-grid {
    gap: 0.4rem;
  }
  
  .container-filter-tag {
    padding: 0.4rem 0.7rem;
    font-size: 0.8125rem;
  }
  
  .container-dot {
    width: 7px;
    height: 7px;
  }
  
  .container-count {
    font-size: 0.7rem;
    padding: 0.0625rem 0.3rem;
  }
}

@media (max-width: 640px) {
  .filter-content {
    padding: 0.75rem;
  }
  
  .container-grid {
    gap: 0.375rem;
  }
  
  .container-filter-tag {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .container-dot {
    width: 6px;
    height: 6px;
  }
  
  .container-count {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.25rem;
  }
  
  .selection-indicator {
    padding: 1px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .container-filters {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
  }
  
  .container-filters:hover {
    background: rgba(31, 41, 55, 0.98);
    border-color: #4b5563;
  }
  
  .filter-title {
    color: #d1d5db;
  }
  
  .container-filter-tag {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .container-filter-tag.active {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15));
    border-color: #22c55e;
    color: #34d399;
  }
  
  .container-filter-tag.multi-selected {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2));
    border-color: #16a34a;
  }
  
  .container-filter-tag:hover:not(.active) {
    background: linear-gradient(135deg, #4b5563, #374151);
    border-color: #6b7280;
  }
  
  .container-count {
    background: rgba(31, 41, 55, 0.8);
    color: #d1d5db;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .container-filter-tag.active .container-count {
    background: rgba(31, 41, 55, 0.9);
    color: #34d399;
    border-color: rgba(52, 211, 153, 0.3);
  }
  
  .selection-indicator {
    background: rgba(31, 41, 55, 0.95);
  }
  
  .empty-state,
  .loading-state {
    color: #6b7280;
  }
  
  .loading-spinner {
    border-color: #4b5563;
    border-top-color: #22c55e;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .container-filters {
    border: 2px solid #000;
  }
  
  .container-filter-tag {
    border-width: 2px;
    font-weight: 600;
  }
  
  .container-filter-tag.active {
    border-width: 3px;
    font-weight: 700;
    background: #f0f9ff !important;
    color: #0c4a6e !important;
  }
  
  .container-dot {
    border: 2px solid #000;
    outline: 1px solid #fff;
  }
  
  .container-count {
    border: 1px solid currentColor;
    font-weight: 700;
    background: #fff !important;
  }
  
  .selection-indicator {
    border: 2px solid #000;
    background: #fff !important;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .container-filters,
  .container-filter-tag,
  .container-dot,
  .container-count,
  .selection-indicator {
    animation: none;
    transition: none;
  }
  
  .container-filters:hover,
  .container-filter-tag:hover,
  .container-filter-tag.active {
    transform: none;
  }
  
  .container-filter-tag::before {
    display: none;
  }
  
  .loading-spinner {
    animation: none;
    border-top-color: transparent;
  }
}
</style>