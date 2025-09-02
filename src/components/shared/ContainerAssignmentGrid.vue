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
      <!-- Form variant: Checkboxes -->
      <template v-if="variant === 'form'">
        <label 
          v-for="container in availableContainers" 
          :key="container.id"
          class="container-checkbox"
        >
          <input 
            :checked="isContainerSelected(container.id)"
            @change="handleContainerChange($event, container)"
            type="checkbox"
            :disabled="disabled || isContainerLoading(container.id)"
          />
          <div 
            class="container-dot" 
            :style="{ background: container.color }"
          ></div>
          <span class="container-name">{{ container.name }}</span>
        </label>
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
          <div class="container-dot" :style="{ background: container.color }"></div>
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
          <div class="container-dot" :style="{ background: container.color }"></div>
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
  
  // Card/Form variants: Use conflict detection
  try {
    let result
    
    if (props.contextMode === 'assign' && props.contextCoffee) {
      // Use the grid-specific toggle for direct assignments
      result = await toggleContainerAssignment(
        container.id,
        props.contextCoffee.id,
        props.contextCoffee.name,
        props.availableContainers
      )
    } else {
      // Use form-style toggle
      result = await toggleContainerAssignment(
        container.id,
        props.contextCoffee?.id,
        props.contextCoffee?.name || 'this coffee',
        props.availableContainers,
        isCurrentlySelected ? 'remove' : 'toggle'
      )
    }
    
    if (result.success && !result.cancelled) {
      // Update the selection based on result
      let updated
      if (result.action === 'removed') {
        updated = props.selectedContainers.filter(id => 
          (typeof id === 'object' ? id.id : id) !== container.id
        )
      } else {
        updated = [...props.selectedContainers.filter(id => 
          (typeof id === 'object' ? id.id : id) !== container.id
        ), container]
      }
      
      emit('update:selectedContainers', updated)
      emit('container-changed', { 
        action: result.action, 
        container,
        conflictingCoffee: result.conflictingCoffee 
      })
    }
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
}

/* Form Variant Styles */
.variant-form .container-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.container-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.container-checkbox:hover {
  background: rgba(255, 255, 255, 0.5);
}

.container-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: #22c55e;
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

.container-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.variant-card .container-dot {
  width: 32px;
  height: 32px;
}

.variant-form .container-dot {
  width: 12px;
  height: 12px;
}

.variant-filter .container-dot {
  width: 8px;
  height: 8px;
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
  
  .container-dot {
    width: 24px;
    height: 24px;
  }
  
  .variant-card .container-dot {
    width: 24px;
    height: 24px;
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
  .container-filter-tag {
    transition: none;
  }
  
  .container-chip:hover,
  .container-filter-tag:hover {
    transform: none;
  }
}
</style>