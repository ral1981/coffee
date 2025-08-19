<template>
  <div 
    class="container-card"
    :class="{ 
      'highlighted': isHighlighted,
      'new-container': isNewlyAdded 
    }"
    :style="{ borderLeftColor: container.color }"
    :data-container-id="container.id"
  >
    <!-- Header with name and menu -->
    <div class="container-header">
      <div class="container-main">
        <!-- Container icon -->
        <div class="container-icon">
          <div 
            class="container-dot"
            :style="{ background: container.color }"
          ></div>
        </div>
        
        <!-- Container name -->
        <h3 class="container-name">{{ container.name }}</h3>
      </div>
      
      <!-- Three dots menu -->
      <div class="menu-container">
        <button 
          type="button"
          class="menu-trigger"
          @click="toggleMenu"
          :class="{ active: showMenu }"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="2" fill="currentColor"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
            <circle cx="12" cy="19" r="2" fill="currentColor"/>
          </svg>
        </button>
        
        <!-- Dropdown menu -->
        <div v-if="showMenu" class="menu-dropdown">
          <button 
            type="button" 
            class="menu-item"
            @click="handleViewCoffee(container)"
            :disabled="!assignedCoffee"
            :title="assignedCoffee ? `Filter coffees in ${container.name}` : 'Container is empty'"
          >
            <Coffee :size="16" />
            View Coffee
          </button>
          
          <button 
            type="button" 
            class="menu-item"
            @click="handleEdit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          
          <button 
            type="button" 
            class="menu-item menu-item-danger"
            @click="handleDelete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
    
    <!-- Status and content -->
    <div class="container-content">
      <!-- Current Status -->
      <div class="status-section">
        <!-- Status badge -->
        <div 
          class="status-badge" 
          :class="assignedCoffee ? 'status-in-use' : 'status-empty'"
        >
          {{ assignedCoffee ? 'In Use' : 'Empty' }}
        </div>

        <!-- Contains information -->
        <div class="contains-text">
          {{ assignedCoffee 
              ? 'Contains: ' 
              : 'Contains: -' }}
          <span v-if="assignedCoffee" class="coffee-name">{{ assignedCoffee.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Coffee, Edit, Trash2, MoreVertical } from 'lucide-vue-next'

// Props
const props = defineProps({
  container: {
    type: Object,
    required: true
  },
  assignedCoffee: {
    type: Object,
    default: null
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  isNewlyAdded: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['view-coffee', 'edit', 'delete'])

// State
const showMenu = ref(false)

// Computed properties
const statusText = computed(() => {
  return props.assignedCoffee ? 'In Use' : 'Empty'
})

const statusClass = computed(() => {
  return props.assignedCoffee ? 'status-in-use' : 'status-empty'
})

// Methods
const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const handleViewCoffee = () => {
  if (props.assignedCoffee) {
    emit('view-coffee', props.container)
  } else {
    info('No Coffee', 'This container is currently empty')
  }
}

const handleEdit = () => {
  emit('edit', props.container)
  closeMenu()
}

const handleDelete = () => {
  emit('delete', props.container)
  closeMenu()
}

// Close menu when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.menu-container')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.container-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e5e7eb;
  transition: all 0.2s ease;
  position: relative;
}

.container-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* Highlighting styles */
.container-card.highlighted,
.container-card.new-container {
  border-left-color: #22c55e !important;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
  transform: scale(1.02);
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
  }
}

/* Header */
.container-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.container-main {
  display: flex;
  align-items: center;
  flex: 1;
}

.container-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.container-dot {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #ccc;
}

.container-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Menu */
.menu-container {
  position: relative;
}

.menu-trigger {
  background: none;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.menu-trigger:hover,
.menu-trigger.active {
  background: #f3f4f6;
  color: #374151;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  min-width: 140px;
  z-index: 10;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.menu-item:hover:not(:disabled) {
  background: #f9fafb;
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item-danger {
  color: #ef4444;
}

.menu-item-danger:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
}

/* Content */
.container-content {
  padding-left: 4px;
  border-left: 3px solid #e5e7eb;
}

.status-section {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 0.75rem;
}

.status-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  display:inline-block;
  width: fit-content;
}

.status-in-use {
  background: #d1fae5;
  color: #065f46;
}

.status-empty {
  background: #f3f4f6;
  color: #6b7280;
}

.status-section,
.contains-section {
  display: block;
  margin-bottom: 0.5rem;
}

.contains-section {
  margin-top: 0.5rem;
}

.contains-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.coffee-name {
  font-weight: bold;
}

/* Responsive */
@media (max-width: 640px) {
  .container-card {
    padding: 1rem;
  }
  
  .container-name {
    font-size: 1.125rem;
  }
}
</style>