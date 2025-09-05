<template>
  <div 
    v-if="availableContainers.length > 0" 
    class="container-assignment-grid"
  >
    <div v-if="showTitle" class="container-title">{{ title }}</div>
    
    <!-- Loading state -->
    <div v-if="containerLoading" class="container-loading">
      <div class="loading-spinner">Loading containers...</div>
    </div>

    <!-- Container grid -->
    <div v-else class="container-grid">
      <button
        v-for="container in availableContainers"
        :key="container.id"
        class="container-chip"
        :class="{ 
          'assigned': isContainerSelected(container.id),
          'loading': isContainerLoading(container.id)
        }"
        @click.stop="handleContainerToggle(container)"
        :disabled="disabled || isContainerLoading(container.id)"
        :style="{ 
          '--container-color': container.color,
          borderColor: isContainerSelected(container.id) ? container.color : '#e5e7eb'
        }"
      >
        <div class="container-content">
          <div class="container-icon" :style="{ borderColor: container.color }">
            <svg 
              class="coffee-beans-icon" 
              :style="{ fill: container.color }"
              viewBox="144 144 512 512" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m620.41 538.86-47.23-250.48v-93.051c0-4.1758-1.6602-8.1797-4.6133-11.133-2.9531-2.9492-6.957-4.6094-11.133-4.6094h-299.14c-4.1758 0-8.1797 1.6602-11.133 4.6094-2.9531 2.9531-4.6094 6.957-4.6094 11.133v61.562l-62.977 344.95c-0.86328 4.582 0.34766 9.3086 3.3047 12.91 3.0664 3.6836 7.6484 5.7734 12.438 5.668h283.39c1.6055-0.019531 3.1992-0.28516 4.7227-0.78516h2.3594l125.95-62.977h0.003906c3.2578-1.5273 5.8945-4.1289 7.4727-7.3672 1.5742-3.2344 1.9922-6.9141 1.1836-10.426zm-346.37-327.79h267.65v62.977h-94.465c-0.88672-0.14453-1.7891-0.14453-2.6758 0-4.3555-12.379-13.664-22.387-25.691-27.629-12.031-5.2422-25.699-5.2422-37.73 0-12.027 5.2422-21.336 15.25-25.691 27.629-0.88672-0.14453-1.7891-0.14453-2.6758 0h-78.719zm141.7 78.719c0 4.1758-1.6602 8.1797-4.6094 11.133-2.9531 2.9531-6.957 4.6133-11.133 4.6133s-8.1797-1.6602-11.133-4.6133c-2.9531-2.9531-4.6133-6.957-4.6133-11.133 0-4.1758 1.6602-8.1797 4.6133-11.133 2.9531-2.9531 6.957-4.6094 11.133-4.6094s8.1797 1.6562 11.133 4.6094c2.9492 2.9531 4.6094 6.957 4.6094 11.133zm-150.04 15.746h87.062c0.88672 0.14453 1.7891 0.14453 2.6758 0 4.3555 12.379 13.664 22.387 25.691 27.625 12.031 5.2422 25.699 5.2422 37.73 0 12.027-5.2383 21.336-15.246 25.691-27.625 0.88672 0.14453 1.7891 0.14453 2.6758 0 h75.258l-56.68 283.39-251.59-0.003907zm234.74 270.64 48.805-244.19 37.785 200.89z"></path>
              <path d="m375.44 368.51c-25.664 3.4844-49.477 15.285-67.789 33.602-18.316 18.312-30.117 42.125-33.602 67.789-3.5938 24.004 4.2734 48.309 21.254 65.652v0.78906c0.25781-0.070312 0.52734-0.070312 0.78516 0 14.555 13.441 33.723 20.77 53.531 20.465 3.5117 0.23047 7.0352 0.23047 10.551 0 25.555-3.2578 49.25-15.082 67.227-33.535 19.207-17.672 31.766-41.402 35.582-67.227 4.1211-24.25-3.7617-48.992-21.152-66.383-17.395-17.395-42.137-25.277-66.387-21.152zm-45.027 55.734c14.664-14.918 34.512-23.602 55.418-24.246h5.3555c-11.449 6.1055-21.051 15.168-27.809 26.242-6.7539 11.074-10.418 23.762-10.609 36.734 0 26.293-25.664 38.73-39.832 43.453-14.168-21.887-7.3984-56.523 17.477-81.555zm76.203 76.203-0.003906-0.003907c-15.551 16.98-37.758 26.301-60.77 25.504 11.445-6.1055 21.047-15.168 27.805-26.242 6.7539-11.074 10.418-23.762 10.609-36.73 0-26.293 25.664-38.73 39.832-43.453 14.172 21.883 7.4023 56.52-17.477 81.551z"></path>
            </svg>
          </div>
          <span class="container-name">{{ container.name.toUpperCase() }}</span>
        </div>
        <span 
          v-if="showCounts && containerCounts[container.id]" 
          class="container-count"
        >
          {{ containerCounts[container.id] }}
        </span>
        <div v-if="isContainerLoading(container.id)" class="loading-spinner-small"></div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useContainerAssignment } from '../../composables/useContainerAssignment'

const props = defineProps({
  // Core data
  availableContainers: {
    type: Array,
    default: () => []
  },
  selectedContainers: {
    type: Array,
    default: () => []
  },
  containerCounts: {
    type: Object,
    default: () => ({})
  },
  
  // Display options
  title: {
    type: String,
    default: 'Containers'
  },
  showTitle: {
    type: Boolean,
    default: true
  },
  showCounts: {
    type: Boolean,
    default: false
  },
  
  // State
  disabled: {
    type: Boolean,
    default: false
  },
  containerLoading: {
    type: Boolean,
    default: false
  },
  
  // Context for conflict detection
  contextCoffee: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:selectedContainers', 'container-changed'])

const { isLoggedIn } = useAuth()
const { containerLoadingStates } = useContainerAssignment()

// Computed properties
const selectedCount = computed(() => props.selectedContainers.length)

const isContainerSelected = (containerId) => {
  return props.selectedContainers.some(id => 
    (typeof id === 'object' ? id.id : id) === containerId
  )
}

const isContainerLoading = (containerId) => {
  if (props.contextCoffee?.id) {
    return containerLoadingStates[`${props.contextCoffee.id}-${containerId}`] || false
  }
  return containerLoadingStates[containerId] || false
}

// Single unified event handler
const handleContainerToggle = async (container) => {
  if (props.disabled || !isLoggedIn.value) return
  
  const isCurrentlySelected = isContainerSelected(container.id)
  
  try {
    let updated
    let action
    
    if (isCurrentlySelected) {
      // Remove from selection
      updated = props.selectedContainers.filter(id => 
        (typeof id === 'object' ? id.id : id) !== container.id
      )
      action = 'removed'
    } else {
      // Add to selection
      updated = [...props.selectedContainers.filter(id => 
        (typeof id === 'object' ? id.id : id) !== container.id
      ), container.id]
      action = 'assigned'
    }
    
    emit('update:selectedContainers', updated)
    emit('container-changed', { 
      action, 
      container,
      coffee: props.contextCoffee
    })
    
  } catch (error) {
    console.error('Container toggle error:', error)
  }
}
</script>

<style scoped>
.container-assignment-grid {
  margin-bottom: 1rem;
}

.container-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.5rem;
}

.container-loading {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.loading-spinner {
  font-size: 0.875rem;
}

.container-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.container-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 0.75rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 80px;
  text-align: center;
}

.container-chip:hover:not(:disabled) {
  border-color: var(--container-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.container-chip.assigned {
  border: 2px solid var(--container-color);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--container-color) 12%, transparent), 
    color-mix(in srgb, var(--container-color) 8%, transparent)
  );
  color: var(--container-color);
  font-weight: 600;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--container-color) 25%, transparent);
}

.container-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.container-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
}

.container-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--container-color, #e2e8f0);
  background: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.coffee-beans-icon {
  width: 14px; /* Adjusted icon size */
  height: 14px;
  transition: all 0.2s ease;
}

.container-chip.assigned .container-icon {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px currentColor;
  transform: scale(1.1);
  border-width: 2px;
}

.container-chip.assigned .coffee-beans-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.container-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: inherit;
  width: 100%;
  text-align: center;
  color: var(--container-color, #666);
}

.container-count {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
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

.container-chip.assigned .container-count {
  background: rgba(255, 255, 255, 0.95);
  color: var(--container-color);
  border-color: color-mix(in srgb, var(--container-color) 20%, transparent);
  box-shadow: 0 2px 4px color-mix(in srgb, var(--container-color) 20%, transparent);
}

.loading-spinner-small {
  width: 12px;
  height: 12px;
  border: 1px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container-grid {
    gap: 0.5rem;
  }
  
  .container-chip {
    padding: 0.75rem;
    font-size: 0.65rem;
    min-width: 90px;
    min-height: 90px;
  }
  
  .container-content {
    gap: 0.75rem;
  }
  
  .container-icon {
    width: 48px;
    height: 48px;
  }
  
  .coffee-beans-icon {
    width: 32px;
    height: 32px;
  }
  
  .container-count {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.25rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .container-assignment-grid {
    background: rgba(31, 41, 55, 0.95);
  }
  
  .container-title {
    color: #d1d5db;
  }
  
  .container-chip {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  /* Updated to use container's color instead of hardcoded green */
  .container-chip.assigned {
    background: linear-gradient(135deg, 
      color-mix(in srgb, var(--container-color) 20%, transparent), 
      color-mix(in srgb, var(--container-color) 15%, transparent)
    );
    border-color: var(--container-color);
    color: var(--container-color);
  }
  
  .container-chip:hover:not(:disabled) {
    background: linear-gradient(135deg, #4b5563, #374151);
    border-color: #6b7280;
  }
  
  .container-count {
    background: rgba(31, 41, 55, 0.8);
    color: #d1d5db;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .container-chip.assigned .container-count {
    background: rgba(31, 41, 55, 0.9);
    color: var(--container-color);
    border-color: color-mix(in srgb, var(--container-color) 30%, transparent);
  }
  
  .container-name {
    color: var(--container-color, #d1d5db);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .container-chip {
    border-width: 2px;
    font-weight: 600;
  }
  
  .container-chip.assigned {
    border-width: 3px;
    font-weight: 700;
  }
  
  .container-dot {
    border: 1px solid currentColor;
  }
  
  .container-count {
    border: 1px solid currentColor;
    font-weight: 700;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .container-chip {
    transition: none;
  }
  
  .container-chip:hover {
    transform: none;
  }
  
  .loading-spinner-small {
    animation: none;
  }
}

/* Focus management for accessibility */
.container-chip:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  z-index: 2;
}
</style>