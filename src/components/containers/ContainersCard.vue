<template>
  <div class="containers-card-grid">
    <div
      v-for="container in containers"
      :key="container.id"
      class="container-card"
      :class="{ 
        'highlighted': isHighlighted(container.id),
        'new-container': isNewlyAdded(container.id) 
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
            @click="toggleMenu(container.id)"
            :class="{ active: activeMenuId === container.id }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="2" fill="currentColor"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <circle cx="12" cy="19" r="2" fill="currentColor"/>
            </svg>
          </button>
          
          <!-- Dropdown menu -->
          <div v-if="activeMenuId === container.id" class="menu-dropdown">
            <button 
              type="button" 
              class="menu-item"
              @click="handleViewCoffee(container)"
              :disabled="!getAssignedCoffee(container.id)"
              :title="getAssignedCoffee(container.id) 
                ? `View ${getAssignedCoffee(container.id).name}` 
                : 'No coffee assigned'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="21 21l-4.35-4.35"/>
              </svg>
              View Coffee
            </button>
            
            <button 
              type="button" 
              class="menu-item"
              @click="handleEditContainer(container)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Container
            </button>
            
            <button 
              type="button" 
              class="menu-item menu-item-danger"
              @click="handleDeleteContainer(container)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Delete Container
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="container-content">
        <!-- Status section -->
        <div class="status-section">
          <span 
            class="status-badge"
            :class="getAssignedCoffee(container.id) ? 'status-in-use' : 'status-empty'"
          >
            {{ getAssignedCoffee(container.id) ? 'In Use' : 'Empty' }}
          </span>
        </div>

        <!-- Contains section -->
        <div v-if="getAssignedCoffee(container.id)" class="contains-section">
          <div class="contains-text">
            Contains: <span class="coffee-name">{{ getAssignedCoffee(container.id).name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { useToast } from '../../composables/useToast'

// Props
const props = defineProps({
  containers: {
    type: Array,
    required: true,
    default: () => []
  },
  highlightedContainerId: {
    type: [String, Number],
    default: null
  }
})

// Events
const emit = defineEmits(['edit-container', 'view-coffee'])

const router = useRouter()
const { coffees, fetchCoffees } = useCoffeeData()
const { success, warning, info } = useToast()

// Local state
const activeMenuId = ref(null)

// Computed properties
const containerAssignments = computed(() => {
  const assignments = {}
  
  if (!props.containers) return assignments
  
  // Initialize all containers as empty
  props.containers.forEach(container => {
    assignments[container.id] = {
      container,
      coffee: null,
      status: 'empty'
    }
  })
  
  // Find assignments from coffee data
  if (coffees.value && Array.isArray(coffees.value)) {
    coffees.value.forEach(coffee => {
      if (coffee.coffee_container_assignments && Array.isArray(coffee.coffee_container_assignments)) {
        coffee.coffee_container_assignments.forEach(assignment => {
          if (assignments[assignment.container_id]) {
            assignments[assignment.container_id] = {
              container: assignments[assignment.container_id].container,
              coffee: coffee,
              status: 'in_use'
            }
          }
        })
      }
    })
  }
  
  return assignments
})

// Methods
const getAssignedCoffee = (containerId) => {
  return containerAssignments.value[containerId]?.coffee || null
}

const isHighlighted = (containerId) => {
  return props.highlightedContainerId && 
         String(props.highlightedContainerId) === String(containerId)
}

const isNewlyAdded = (containerId) => {
  // This could be enhanced with a prop or composable for newly added items
  return false
}

const toggleMenu = (containerId) => {
  activeMenuId.value = activeMenuId.value === containerId ? null : containerId
}

const closeMenu = () => {
  activeMenuId.value = null
}

const handleViewCoffee = (container) => {
  const assignedCoffee = getAssignedCoffee(container.id)
  if (assignedCoffee) {
    // Navigate to coffee view with this container filter
    router.push({
      path: '/coffee',
      query: { container: container.name }
    })
  } else {
    info('No Coffee', 'This container is currently empty')
  }
  closeMenu()
  emit('view-coffee', container)
}

const handleEditContainer = (container) => {
  console.log('Edit container:', container)
  closeMenu()
  emit('edit-container', container)
}

const handleDeleteContainer = async (container) => {
  const assignedCoffee = getAssignedCoffee(container.id)
  
  if (assignedCoffee) {
    const confirmMessage = `"${container.name}" currently contains "${assignedCoffee.name}". Deleting this container will remove the coffee assignment. Are you sure you want to continue?`
    if (!confirm(confirmMessage)) return
  } else {
    if (!confirm(`Are you sure you want to delete "${container.name}"?`)) return
  }

  try {
    // This would need to be implemented with actual delete logic
    warning('Delete Feature', 'Delete functionality coming soon!')
    closeMenu()
  } catch (error) {
    console.error('Error deleting container:', error)
    warning('Delete Error', 'Could not delete container')
  }
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.menu-container')) {
    closeMenu()
  }
}

// Lifecycle
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  
  // Fetch coffee data to determine container assignments
  try {
    if (!coffees.value || coffees.value.length === 0) {
      await fetchCoffees()
    }
  } catch (error) {
    console.error('Error fetching coffee data:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.containers-card-grid {
  display: grid;
  gap: 1rem;
  overflow: visible;
}

@media (min-width: 768px) {
  .containers-card-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.container-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e5e7eb;
  transition: all 0.2s ease;
}

.container-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Highlighting styles */
.container-card.highlighted,
.container-card.new-container {
  border-left-color: #22c55e;
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  display: inline-block;
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

.contains-section {
  margin-top: 0.5rem;
}

.contains-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.coffee-name {
  font-weight: bold;
  color: #374151;
}

/* Responsive */
@media (max-width: 640px) {
  .containers-list-view {
    padding: 0 0.5rem;
  }
  
  .container-name {
    font-size: 1.125rem;
  }

  .container-icon {
    width: 40px;
    height: 40px;
    margin-right: 0.75rem;
  }

  .container-dot {
    width: 20px;
    height: 20px;
  }

  .menu-trigger {
    width: 28px;
    height: 28px;
  }

  .menu-dropdown {
    right: -0.5rem;
    min-width: 120px;
  }

  .menu-item {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }

  .status-badge {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.625rem;
  }

  .contains-text {
    font-size: 0.8125rem;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .container-card:hover {
    transform: none;
  }
  
  .container-card.highlighted,
  .container-card.new-container {
    animation: none;
    transform: none;
  }
}

/* Focus states for accessibility */
.menu-trigger:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.menu-item:focus {
  background: #f3f4f6;
  outline: none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .container-card {
    border: 2px solid #000;
  }
  
  .status-in-use {
    background: #000;
    color: #fff;
  }
  
  .status-empty {
    background: #fff;
    color: #000;
    border: 1px solid #000;
  }
}
</style>