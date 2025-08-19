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
            @click="handleViewCoffee"
            :disabled="!assignedCoffee"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 8h.01M11 12h.01M7 16h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"/>
            </svg>
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
        <span class="status-label">Current Status</span>
        <span 
          class="status-badge"
          :class="statusClass"
        >
          {{ statusText }}
        </span>
      </div>
      
      <!-- Contains information -->
      <div class="contains-section">
        <span class="contains-text">
          {{ containsText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

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

const containsText = computed(() => {
  if (props.assignedCoffee) {
    return `Contains: ${props.assignedCoffee.name}`
  }
  return 'Contains: Nothing'
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
    emit('view-coffee', props.assignedCoffee)
  }
  closeMenu()
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
  .container-card {
    padding: 1rem;
  }
  
  .container-name {
    font-size: 1.125rem;
  }
}
</style>

<!-- Updated ContainersView.vue to use the new card component -->

<template>
  <div class="containers-view">
    <!-- Results Counter -->
    <div class="results-counter">
      <span class="counter-text">
        <strong>{{ containers.length }}</strong> Containers Available
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
    <div v-else-if="containers.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Package :size="48" />
      </div>
      <h3 class="empty-state-title">No containers found</h3>
      <p class="empty-state-description">
        Container data will be loaded from your coffee database.
      </p>
    </div>

    <!-- Containers Grid -->
    <div v-else class="containers-grid">
      <ContainerCard
        v-for="container in containers"
        :key="container.id"
        :container="container"
        :assigned-coffee="getAssignedCoffee(container.id)"
        :is-highlighted="highlightedContainerId === container.id"
        :is-newly-added="newlyAddedContainerId === container.id"
        @view-coffee="handleViewCoffee"
        @edit="handleEditContainer"
        @delete="handleDeleteContainer"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Package } from 'lucide-vue-next'
import { useContainers } from '../composables/useContainers'
import { useCoffeeData } from '../composables/useCoffeeData'
import { useToast } from '../composables/useToast'
import ContainerCard from './ContainerCard.vue'

const router = useRouter()
const { success, info, warning, error: showError } = useToast()

// Use composables
const { 
  containers, 
  loading, 
  highlightedContainerId,
  fetchContainers 
} = useContainers()

const { coffees } = useCoffeeData()

// Inject highlighting state
const newlyAddedContainerId = inject('newlyAddedContainerId', ref(null))

// Get assigned coffee for a container
const getAssignedCoffee = (containerId) => {
  return coffees.value.find(coffee => 
    coffee.coffee_container_assignments?.some(assignment => 
      assignment.container_id === containerId
    )
  ) || null
}

// Event handlers
const handleViewCoffee = (coffee) => {
  router.push({
    path: '/coffee',
    query: { 
      highlight: coffee.id,
      container: coffee.containerIds?.[0] 
    }
  })
  success('Viewing coffee', `Showing ${coffee.name}`)
}

const handleEditContainer = (container) => {
  // Emit edit event to parent (AppLayout)
  // This will open the container form in edit mode
  info('Edit Container', `Edit functionality for "${container.name}" will be implemented`)
}

const handleDeleteContainer = async (container) => {
  if (confirm(`Are you sure you want to delete "${container.name}"?`)) {
    try {
      // Implement delete functionality
      info('Delete Container', `Delete functionality for "${container.name}" will be implemented`)
    } catch (err) {
      showError('Delete Failed', 'Could not delete container')
    }
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
      }
    }, 300)
  })
}

// Watch for newly added containers
watch(newlyAddedContainerId, (newId) => {
  if (newId) {
    scrollToNewContainer(newId)
  }
})

// Initialize data
onMounted(async () => {
  try {
    const result = await fetchContainers()
    if (result && !result.success) {
      warning('Data Notice', 'Using fallback container data')
    }
  } catch (error) {
    console.error('Error fetching containers:', error)
    warning('Load Error', 'Could not load containers from database')
  }
})
</script>

<style scoped>
.containers-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

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
</style>