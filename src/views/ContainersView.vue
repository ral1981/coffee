<template>
  <div class="containers-view">
    <!-- Results Counter -->
    <div class="results-counter">
      <span class="counter-text">
        <strong>{{ containerCount }}</strong> Containers Available
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
      <p class="loading-text">Loading containers...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!containers || containers.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Package :size="48" />
      </div>
      <h3 class="empty-state-title">No containers found</h3>
      <p class="empty-state-description">
        Container data will be loaded from your coffee database.
      </p>
    </div>

    <!-- Containers Grid -->
    <div v-else-if="containers && containers.length > 0" class="containers-grid">
      <div
        v-for="container in containers"
        :key="container.id"
        class="container-card"
        :class="{ 
          'highlighted': highlightedContainerId === container.id,
          'new-container': newlyAddedContainerId === container.id 
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
              <MoreVertical :size="20" />
            </button>
            
            <!-- Dropdown menu -->
            <div v-if="activeMenuId === container.id" class="menu-dropdown">
              <button 
                type="button" 
                class="menu-item"
                @click="handleViewCoffee(container)"
                :disabled="!getAssignedCoffee(container.id)"
                :title="getAssignedCoffee(container.id) ? `Filter coffees in ${container.name}` : 'Container is empty'"
              >
                <Coffee :size="16" />
                View Coffee
              </button>
              
              <button 
                type="button" 
                class="menu-item"
                @click="editContainer(container)"
                title="Edit container details"
              >
                <Edit :size="16" />
                Edit
              </button>
              
              <button 
                type="button" 
                class="menu-item menu-item-danger"
                @click="handleDeleteContainer(container)"
                :title="getAssignedCoffee(container.id) ? 'Delete container (will remove coffee assignment)' : 'Delete container'"
              >
                <Trash2 :size="16" />
                Delete
              </button>
            </div>
          </div>
        </div>
        
        <!-- Status and content section -->
        <div class="container-content">
          <!-- Current Status -->
          <div class="status-section">
            <span class="status-label">Current Status</span>
            <span 
              class="status-badge"
              :class="getAssignedCoffee(container.id) ? 'status-in-use' : 'status-empty'"
            >
              {{ getAssignedCoffee(container.id) ? 'In Use' : 'Empty' }}
            </span>
          </div>
          
          <!-- Contains information -->
          <div class="contains-section">
            <span class="contains-text">
              {{ getAssignedCoffee(container.id) 
                  ? `Contains: ${getAssignedCoffee(container.id).name}` 
                  : 'Contains: Nothing' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="info-card">
        <div class="info-icon">
          <Package :size="24" />
        </div>
        <div class="info-content">
          <h4 class="info-title">Container Management</h4>
          <p class="info-description">
            Organize your coffee collection using labeled containers.
            Each container can hold different types of beans and helps you 
            keep track of your inventory. Containers are loaded from your database.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, inject, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Package, Edit, Coffee, MoreVertical, Trash2 } from 'lucide-vue-next'
import { useContainers } from '../composables/useContainers'
import { useCoffeeData } from '../composables/useCoffeeData'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { success, info, warning, error: showError } = useToast()

const { 
  containers, 
  loading, 
  highlightedContainerId,
  fetchContainers,
  deleteContainer 
} = useContainers()

const { coffees, fetchCoffees } = useCoffeeData()

// Safety check for containers length
const containerCount = computed(() => containers?.value?.length || 0)

// State for menu management
const activeMenuId = ref(null)

// Inject the global highlighting state from AppLayout
const newlyAddedContainerId = inject('newlyAddedContainerId', ref(null))

// Get assigned coffee for each container
const getAssignedCoffee = (containerId) => {
  if (!coffees.value || !Array.isArray(coffees.value)) {
    return null
  }

  // Find the first coffee that is assigned to this container
  const assignedCoffee = coffees.value.find(coffee => {
    // Check if coffee has container assignments
    if (!coffee.coffee_container_assignments || !Array.isArray(coffee.coffee_container_assignments)) {
      return false
    }
    
    // Check if any assignment matches this container
    return coffee.coffee_container_assignments.some(assignment => {
      return assignment.container_id === containerId
    })
  })

  return assignedCoffee || null
}

/* // Computed property to get container status for all containers
const containerAssignments = computed(() => {
  const assignments = {}
  
  if (!containers.value) return assignments
  
  // Initialize all containers as empty
  containers.value.forEach(container => {
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
}) */

// Menu management functions
const toggleMenu = (containerId) => {
  activeMenuId.value = activeMenuId.value === containerId ? null : containerId
}

const closeMenu = () => {
  activeMenuId.value = null
}

// Edit container
const editContainer = (container) => {
  console.log('Edit container:', container)
  closeMenu()
  // TODO: Emit to parent to open container form in edit mode
}

// Delete container
const handleDeleteContainer = async (container) => {
  const assignedCoffee = getAssignedCoffee(container.id)
  
  // Check if container has coffee assigned
  if (assignedCoffee) {
    const confirmMessage = `"${container.name}" currently contains "${assignedCoffee.name}". Deleting this container will remove the coffee assignment. Are you sure you want to continue?`
    if (!confirm(confirmMessage)) {
      return
    }
  } else {
    if (!confirm(`Are you sure you want to delete "${container.name}"?`)) {
      return
    }
  }

  try {
    if (deleteContainer) {
      await deleteContainer(container.id)
      success('Container Deleted', `${container.name} has been deleted`)
      
      // Refresh coffee data to update assignments
      await fetchCoffees()
    } else {
      info('Delete Feature', 'Delete functionality coming soon!')
    }
    closeMenu()
  } catch (err) {
    showError('Delete Failed', 'Could not delete container')
  }
}

// View coffee - navigate to coffee list with container filter
const handleViewCoffee = (container) => {
 const assignedCoffee = getAssignedCoffee(container.id)
 
 if (assignedCoffee) {
   // Navigate to coffee list with container filter applied
   router.push({
     path: '/coffee',
     query: { container: container.id }
   })
   success('Filtering by container', `Showing coffees in ${container.name}`)
 } else {
   info('No Coffee', 'This container is currently empty')
 }
 closeMenu()
}

const viewCoffees = (container) => {
  router.push({
    path: '/coffee',
    query: { container: container.id }
  })
  success('Filtering coffees', `Showing coffees in ${container.name}`)
}

// Click outside handler
const handleClickOutside = (event) => {
  if (!event.target.closest('.menu-container')) {
    closeMenu()
  }
}

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

// Scroll to newly added container
const scrollToNewContainer = (containerId) => {
  nextTick(() => {
    setTimeout(() => {
      const containerElement = document.querySelector(`[data-container-id="${containerId}"]`)
      if (containerElement) {
        containerElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        console.log('📍 Scrolled to new container:', containerId)
      }
    }, 300)
  })
}

// Watch for newly added containers and scroll to them
watch(newlyAddedContainerId, (newId) => {
  if (newId) {
    console.log('🎯 Watching new container, scrolling to:', newId)
    scrollToNewContainer(newId)
  }
})

// Initialize data on mount
onMounted(async () => {
  console.log('ContainersView mounted - fetching data')
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
  
  try {
    // Fetch both containers and coffees
    const [containerResult, coffeeResult] = await Promise.all([
      fetchContainers(),
      fetchCoffees()
    ])
    
    if (containerResult && !containerResult.success) {
      warning('Data Notice', 'Using fallback container data - database may be unavailable')
    }
    
    console.log('📊 Data loaded:', {
      containers: containers.value?.length || 0,
      coffees: coffees.value?.length || 0
    })
    
  } catch (error) {
    console.error('Error fetching data:', error)
    warning('Load Error', 'Could not load data from database')
  }
})

// Cleanup
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.containers-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

/* Results Counter */
.results-counter {
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.counter-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.counter-text strong {
  color: #111827;
  font-weight: 600;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.spinner {
  width: 32px;
  height: 32px;
  color: #8b5cf6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-state-icon {
  margin-bottom: 1rem;
  color: #9ca3af;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state-description {
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 400px;
  margin: 0 auto;
}

/* Containers Grid */
.containers-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .containers-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
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
  margin: 0 0 0.25rem 0;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #22c55e;
  color: white;
}

.btn-primary:hover {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Info Section */
.info-section {
  margin-top: 2rem;
  padding: 0 0.5rem;
}

.info-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.info-icon {
  color: #8b5cf6;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.info-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

/* Menu styles */
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

/* Content styles */
.container-content {
  padding-left: 4px;
  border-left: 3px solid #e5e7eb;
}

.status-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

/* Responsive */
@media (max-width: 640px) {
  .containers-grid {
    gap: 0.75rem;
  }
  
  .container-card {
    padding: 1rem;
  }
  
  .container-name {
    font-size: 1.125rem;
  }
  
  .container-actions {
    flex-direction: column;
  }
}
</style>