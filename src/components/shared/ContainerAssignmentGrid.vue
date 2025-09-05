<template>
  <div 
    v-if="availableContainers.length > 0" 
    class="container-assignment-grid"
    :class="{
      'variant-form': variant === 'form',
      'variant-card': variant === 'card', 
      'variant-filter': variant === 'filter'
    }"
  >
    <div v-if="showTitle" class="container-title">{{ title }}</div>
    
    <!-- Loading state -->
    <div v-if="containerLoading" class="container-loading">
      <div class="loading-spinner">Loading containers...</div>
    </div>

    <!-- Container grid/list -->
    <div v-else class="container-grid">
      <!-- Form variant: Toggle buttons -->
      <template v-if="variant === 'form'">
        <button
          v-for="container in availableContainers"
          :key="container.id"
          class="container-chip"
          :class="{ 
            'assigned': isContainerSelected(container.id),
            'loading': isContainerLoading(container.id)
          }"
          @click="handleContainerToggle(container)"
          :disabled="disabled || isContainerLoading(container.id)"
          :style="{ 
            '--container-color': container.color,
            borderColor: isContainerSelected(container.id) ? container.color : '#e5e7eb'
          }"
        >
          <div class="container-icon">
            <svg 
              class="coffee-beans-icon" 
              :style="{ fill: container.color }"
              viewBox="144 144 512 512" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <path d="m620.41 538.86-47.23-250.48v-93.051c0-4.1758-1.6602-8.1797-4.6133-11.133-2.9531-2.9492-6.957-4.6094-11.133-4.6094h-299.14c-4.1758 0-8.1797 1.6602-11.133 4.6094-2.9531 2.9531-4.6094 6.957-4.6094 11.133v61.562l-62.977 344.95c-0.86328 4.582 0.34766 9.3086 3.3047 12.91 3.0664 3.6836 7.6484 5.7734 12.438 5.668h283.39c1.6055-0.019531 3.1992-0.28516 4.7227-0.78516h2.3594l125.95-62.977h0.003906c3.2578-1.5273 5.8945-4.1289 7.4727-7.3672 1.5742-3.2344 1.9922-6.9141 1.1836-10.426zm-346.37-327.79h267.65v62.977h-94.465c-0.88672-0.14453-1.7891-0.14453-2.6758 0-4.3555-12.379-13.664-22.387-25.691-27.629-12.031-5.2422-25.699-5.2422-37.73 0-12.027 5.2422-21.336 15.25-25.691 27.629-0.88672-0.14453-1.7891-0.14453-2.6758 0h-78.719zm141.7 78.719c0 4.1758-1.6602 8.1797-4.6094 11.133-2.9531 2.9531-6.957 4.6133-11.133 4.6133s-8.1797-1.6602-11.133-4.6133c-2.9531-2.9531-4.6133-6.957-4.6133-11.133 0-4.1758 1.6602-8.1797 4.6133-11.133 2.9531-2.9531 6.957-4.6094 11.133-4.6094s8.1797 1.6562 11.133 4.6094c2.9492 2.9531 4.6094 6.957 4.6094 11.133zm-150.04 15.746h87.062c0.88672 0.14453 1.7891 0.14453 2.6758 0 4.3555 12.379 13.664 22.387 25.691 27.625 12.031 5.2422 25.699 5.2422 37.73 0 12.027-5.2383 21.336-15.246 25.691-27.625 0.88672 0.14453 1.7891 0.14453 2.6758 0h75.258l-56.68 283.39-251.59-0.003907zm234.74 270.64 48.805-244.19 37.785 200.89z"></path>
                <path d="m375.44 368.51c-25.664 3.4844-49.477 15.285-67.789 33.602-18.316 18.312-30.117 42.125-33.602 67.789-3.5938 24.004 4.2734 48.309 21.254 65.652v0.78906c0.25781-0.070312 0.52734-0.070312 0.78516 0 14.555 13.441 33.723 20.77 53.531 20.465 3.5117 0.23047 7.0352 0.23047 10.551 0 25.555-3.2578 49.25-15.082 67.227-33.535 19.207-17.672 31.766-41.402 35.582-67.227 4.1211-24.25-3.7617-48.992-21.152-66.383-17.395-17.395-42.137-25.277-66.387-21.152zm-45.027 55.734c14.664-14.918 34.512-23.602 55.418-24.246h5.3555c-11.449 6.1055-21.051 15.168-27.809 26.242-6.7539 11.074-10.418 23.762-10.609 36.734 0 26.293-25.664 38.73-39.832 43.453-14.168-21.887-7.3984-56.523 17.477-81.555zm76.203 76.203-0.003906-0.003907c-15.551 16.98-37.758 26.301-60.77 25.504 11.445-6.1055 21.047-15.168 27.805-26.242 6.7539-11.074 10.418-23.762 10.609-36.73 0-26.293 25.664-38.73 39.832-43.453 14.172 21.883 7.4023 56.52-17.477 81.551z"></path>
              </g>
            </svg>
          </div>
          <span class="container-name">{{ container.name }}</span>
          <div v-if="isContainerLoading(container.id)" class="loading-spinner-small"></div>
        </button>
      </template>

      <!-- Card variant: Toggle buttons -->
      <template v-else-if="variant === 'card'">
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
          <div class="container-icon">
            <svg 
              class="coffee-beans-icon" 
              :style="{ fill: container.color }"
              viewBox="144 144 512 512" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <path d="m620.41 538.86-47.23-250.48v-93.051c0-4.1758-1.6602-8.1797-4.6133-11.133-2.9531-2.9492-6.957-4.6094-11.133-4.6094h-299.14c-4.1758 0-8.1797 1.6602-11.133 4.6094-2.9531 2.9531-4.6094 6.957-4.6094 11.133v61.562l-62.977 344.95c-0.86328 4.582 0.34766 9.3086 3.3047 12.91 3.0664 3.6836 7.6484 5.7734 12.438 5.668h283.39c1.6055-0.019531 3.1992-0.28516 4.7227-0.78516h2.3594l125.95-62.977h0.003906c3.2578-1.5273 5.8945-4.1289 7.4727-7.3672 1.5742-3.2344 1.9922-6.9141 1.1836-10.426zm-346.37-327.79h267.65v62.977h-94.465c-0.88672-0.14453-1.7891-0.14453-2.6758 0-4.3555-12.379-13.664-22.387-25.691-27.629-12.031-5.2422-25.699-5.2422-37.73 0-12.027 5.2422-21.336 15.25-25.691 27.629-0.88672-0.14453-1.7891-0.14453-2.6758 0h-78.719zm141.7 78.719c0 4.1758-1.6602 8.1797-4.6094 11.133-2.9531 2.9531-6.957 4.6133-11.133 4.6133s-8.1797-1.6602-11.133-4.6133c-2.9531-2.9531-4.6133-6.957-4.6133-11.133 0-4.1758 1.6602-8.1797 4.6133-11.133 2.9531-2.9531 6.957-4.6094 11.133-4.6094s8.1797 1.6562 11.133 4.6094c2.9492 2.9531 4.6094 6.957 4.6094 11.133zm-150.04 15.746h87.062c0.88672 0.14453 1.7891 0.14453 2.6758 0 4.3555 12.379 13.664 22.387 25.691 27.625 12.031 5.2422 25.699 5.2422 37.73 0 12.027-5.2383 21.336-15.246 25.691-27.625 0.88672 0.14453 1.7891 0.14453 2.6758 0h75.258l-56.68 283.39-251.59-0.003907zm234.74 270.64 48.805-244.19 37.785 200.89z"></path>
                <path d="m375.44 368.51c-25.664 3.4844-49.477 15.285-67.789 33.602-18.316 18.312-30.117 42.125-33.602 67.789-3.5938 24.004 4.2734 48.309 21.254 65.652v0.78906c0.25781-0.070312 0.52734-0.070312 0.78516 0 14.555 13.441 33.723 20.77 53.531 20.465 3.5117 0.23047 7.0352 0.23047 10.551 0 25.555-3.2578 49.25-15.082 67.227-33.535 19.207-17.672 31.766-41.402 35.582-67.227 4.1211-24.25-3.7617-48.992-21.152-66.383-17.395-17.395-42.137-25.277-66.387-21.152zm-45.027 55.734c14.664-14.918 34.512-23.602 55.418-24.246h5.3555c-11.449 6.1055-21.051 15.168-27.809 26.242-6.7539 11.074-10.418 23.762-10.609 36.734 0 26.293-25.664 38.73-39.832 43.453-14.168-21.887-7.3984-56.523 17.477-81.555zm76.203 76.203-0.003906-0.003907c-15.551 16.98-37.758 26.301-60.77 25.504 11.445-6.1055 21.047-15.168 27.805-26.242 6.7539-11.074 10.418-23.762 10.609-36.73 0-26.293 25.664-38.73 39.832-43.453 14.172 21.883 7.4023 56.52-17.477 81.551z"></path>
              </g>
            </svg>
          </div>
          <span class="container-name">{{ container.name }}</span>
          <div v-if="isContainerLoading(container.id)" class="loading-spinner-small"></div>
        </button>
      </template>

      <!-- Filter variant: Toggle tags -->
      <template v-else-if="variant === 'filter'">
        <button
          v-for="container in availableContainers"
          :key="container.id"
          class="container-filter-tag"
          :class="{ 
            'active': isContainerSelected(container.id),
            'multi-selected': selectedCount > 1 && isContainerSelected(container.id)
          }"
          @click="handleContainerToggle(container)"
          :disabled="disabled"
        >
          <div class="container-icon">
            <svg 
              class="coffee-beans-icon" 
              :style="{ fill: container.color }"
              viewBox="144 144 512 512" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <path d="m620.41 538.86-47.23-250.48v-93.051c0-4.1758-1.6602-8.1797-4.6133-11.133-2.9531-2.9492-6.957-4.6094-11.133-4.6094h-299.14c-4.1758 0-8.1797 1.6602-11.133 4.6094-2.9531 2.9531-4.6094 6.957-4.6094 11.133v61.562l-62.977 344.95c-0.86328 4.582 0.34766 9.3086 3.3047 12.91 3.0664 3.6836 7.6484 5.7734 12.438 5.668h283.39c1.6055-0.019531 3.1992-0.28516 4.7227-0.78516h2.3594l125.95-62.977h0.003906c3.2578-1.5273 5.8945-4.1289 7.4727-7.3672 1.5742-3.2344 1.9922-6.9141 1.1836-10.426zm-346.37-327.79h267.65v62.977h-94.465c-0.88672-0.14453-1.7891-0.14453-2.6758 0-4.3555-12.379-13.664-22.387-25.691-27.629-12.031-5.2422-25.699-5.2422-37.73 0-12.027 5.2422-21.336 15.25-25.691 27.629-0.88672-0.14453-1.7891-0.14453-2.6758 0h-78.719zm141.7 78.719c0 4.1758-1.6602 8.1797-4.6094 11.133-2.9531 2.9531-6.957 4.6133-11.133 4.6133s-8.1797-1.6602-11.133-4.6133c-2.9531-2.9531-4.6133-6.957-4.6133-11.133 0-4.1758 1.6602-8.1797 4.6133-11.133 2.9531-2.9531 6.957-4.6094 11.133-4.6094s8.1797 1.6562 11.133 4.6094c2.9492 2.9531 4.6094 6.957 4.6094 11.133zm-150.04 15.746h87.062c0.88672 0.14453 1.7891 0.14453 2.6758 0 4.3555 12.379 13.664 22.387 25.691 27.625 12.031 5.2422 25.699 5.2422 37.73 0 12.027-5.2383 21.336-15.246 25.691-27.625 0.88672 0.14453 1.7891 0.14453 2.6758 0h75.258l-56.68 283.39-251.59-0.003907zm234.74 270.64 48.805-244.19 37.785 200.89z"></path>
                <path d="m375.44 368.51c-25.664 3.4844-49.477 15.285-67.789 33.602-18.316 18.312-30.117 42.125-33.602 67.789-3.5938 24.004 4.2734 48.309 21.254 65.652v0.78906c0.25781-0.070312 0.52734-0.070312 0.78516 0 14.555 13.441 33.723 20.77 53.531 20.465 3.5117 0.23047 7.0352 0.23047 10.551 0 25.555-3.2578 49.25-15.082 67.227-33.535 19.207-17.672 31.766-41.402 35.582-67.227 4.1211-24.25-3.7617-48.992-21.152-66.383-17.395-17.395-42.137-25.277-66.387-21.152zm-45.027 55.734c14.664-14.918 34.512-23.602 55.418-24.246h5.3555c-11.449 6.1055-21.051 15.168-27.809 26.242-6.7539 11.074-10.418 23.762-10.609 36.734 0 26.293-25.664 38.73-39.832 43.453-14.168-21.887-7.3984-56.523 17.477-81.555zm76.203 76.203-0.003906-0.003907c-15.551 16.98-37.758 26.301-60.77 25.504 11.445-6.1055 21.047-15.168 27.805-26.242 6.7539-11.074 10.418-23.762 10.609-36.73 0-26.293 25.664-38.73 39.832-43.453 14.172 21.883 7.4023 56.52-17.477 81.551z"></path>
              </g>
            </svg>
          </div>
          <span class="container-name">{{ container.name }}</span>
          <span v-if="showCounts && containerCounts[container.id]" class="container-count">
            {{ containerCounts[container.id] }}
          </span>
        </button>
      </template>
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
  variant: {
    type: String,
    default: 'card', // 'form', 'card', 'filter'
    validator: (value) => ['form', 'card', 'filter'].includes(value)
  },
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
  },
  contextMode: {
    type: String,
    default: 'toggle' // 'toggle', 'assign', 'filter'
  }
})

const emit = defineEmits(['update:selectedContainers', 'container-changed'])

const { isLoggedIn } = useAuth()
const { containerLoadingStates, toggleContainerAssignment } = useContainerAssignment()

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

// Event handlers
const handleContainerChange = async (event, container) => {
  const isChecked = event.target.checked
  
  if (!isChecked) {
    // Remove from selection
    const updated = props.selectedContainers.filter(id => 
      (typeof id === 'object' ? id.id : id) !== container.id
    )
    emit('update:selectedContainers', updated)
    emit('container-changed', { action: 'removed', container })
    return
  }
  
  // Add to selection - handle conflicts if needed
  await handleContainerToggle(container)
}

const handleContainerToggle = async (container) => {
  if (props.disabled || !isLoggedIn.value) return
  
  const isCurrentlySelected = isContainerSelected(container.id)
  
  if (props.variant === 'filter') {
    // Filter variant: Simple toggle without conflict detection
    let updated
    if (isCurrentlySelected) {
      updated = props.selectedContainers.filter(selected => 
        (typeof selected === 'object' ? selected.id : selected) !== container.id
      )
    } else {
      updated = [...props.selectedContainers, container]
    }
    emit('update:selectedContainers', updated)
    emit('container-changed', { 
      action: isCurrentlySelected ? 'removed' : 'added', 
      container 
    })
    return
  }
  
  // Card/Form variants: Update local state and emit for database handling
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
      coffee: props.contextCoffee // Pass the coffee context
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

/* Form Variant Styles */
.variant-form .container-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.variant-form .container-assignment-grid {
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 8px;
  border-left: 4px solid #22c55e;
}

.variant-form .container-title {
  color: #16a34a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Card Variant Styles */
.variant-card .container-assignment-grid {
  padding: 1rem;
  background: #f5f3ff;
  border-radius: 8px;
  border-left: 4px solid #8b5cf6;
}

.variant-card .container-title {
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.variant-card .container-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.container-chip {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: 2px solid #e5e7eb;
  border-radius: 50px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-width: 70px;
}

.container-chip:hover:not(:disabled) {
  background: rgba(249, 250, 251, 0.98);
  border-color: var(--container-color);
}

.container-chip.assigned {
  background: rgba(255, 255, 255, 0.98);
  border-color: var(--container-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.container-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* New container icon styles to replace container-dot */
.container-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.coffee-beans-icon {
  transition: all 0.2s ease;
}

/* Size variants for different components */
.variant-card .container-icon {
  width: 32px;
  height: 32px;
}

.variant-card .coffee-beans-icon {
  width: 20px;
  height: 20px;
}

.variant-form .container-icon {
  width: 20px;
  height: 20px;
}

.variant-form .coffee-beans-icon {
  width: 12px;
  height: 12px;
}

.variant-filter .container-icon {
  width: 16px;
  height: 16px;
  border: none;
  box-shadow: none;
  background: transparent;
}

.variant-filter .coffee-beans-icon {
  width: 12px;
  height: 12px;
}

/* Icon hover effects */
.container-chip:hover .coffee-beans-icon,
.container-filter-tag:hover .coffee-beans-icon {
  transform: scale(1.1);
}

.container-chip.assigned .coffee-beans-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.container-name {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #374151;
}

.loading-spinner-small {
  position: absolute;
  right: 0.5rem;
  width: 12px;
  height: 12px;
  border: 1px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Filter Variant Styles */
.variant-filter .container-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.container-filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.container-filter-tag:hover:not(.active) {
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.container-filter-tag.active {
  background: linear-gradient(135deg, #22c55e20, #16a34a15);
  border-color: #22c55e;
  color: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  font-weight: 600;
}

.container-filter-tag.multi-selected {
  background: linear-gradient(135deg, #22c55e30, #16a34a20);
  border-color: #16a34a;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

.container-count {
  background: rgba(255, 255, 255, 0.8);
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
}

.container-filter-tag.active .container-count {
  background: rgba(255, 255, 255, 0.95);
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.2);
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container-chip {
    padding: 0.5rem;
    min-width: 60px;
  }
  
  .variant-card .container-icon {
    width: 24px;
    height: 24px;
  }
  
  .variant-card .coffee-beans-icon {
    width: 16px;
    height: 16px;
  }
  
  .variant-form .container-icon {
    width: 16px;
    height: 16px;
  }
  
  .variant-form .coffee-beans-icon {
    width: 10px;
    height: 10px;
  }
  
  .container-name {
    font-size: 0.6875rem;
  }
  
  .container-filter-tag {
    padding: 0.4rem 0.625rem;
    font-size: 0.8125rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .container-assignment-grid {
    background: rgba(31, 41, 55, 0.95);
  }
  
  .variant-card .container-assignment-grid {
    background: #1e1b4b;
    border-color: #6366f1;
  }
  
  .variant-card .container-title {
    color: #a78bfa;
  }
  
  .container-chip {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .container-chip.assigned {
    background: rgba(34, 197, 94, 0.2);
    border-color: #22c55e;
    color: #34d399;
  }
  
  .container-icon {
    background: rgba(55, 65, 81, 0.9);
    border-color: rgba(75, 85, 99, 0.5);
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
  
  .variant-filter .container-icon {
    background: transparent;
  }
  
  .container-count {
    background: rgba(31, 41, 55, 0.8);
    color: #d1d5db;
  }
  
  .container-filter-tag.active .container-count {
    background: rgba(31, 41, 55, 0.9);
    color: #34d399;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .container-chip,
  .container-filter-tag,
  .coffee-beans-icon {
    transition: none;
  }
  
  .container-chip:hover,
  .container-filter-tag:hover {
    transform: none;
  }
  
  .container-chip:hover .coffee-beans-icon,
  .container-filter-tag:hover .coffee-beans-icon {
    transform: none;
  }
}
</style>