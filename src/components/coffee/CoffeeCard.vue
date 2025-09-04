<template>
  <div class="coffee-grid">
    <div
      v-for="coffee in coffees"
      :key="coffee.id"
      class="coffee-card"
      :class="{ 
        'expanded': expandedCards.has(coffee.id),
        'highlighted': isHighlighted(coffee.id),
        'menu-open': activeMenuId === coffee.id
      }"
      :style="getContainerStyling(coffee)"
      :data-coffee-id="coffee.id"
      @click="handleCardClick(coffee)"
    >
      <!-- Header -->
      <div class="card-header">
        <div class="header-main">
          <LogoImage 
            :url="coffee.shops?.url || coffee.bean_url"
            :alt="`${coffee.shops?.name || coffee.shop_name} logo`"
            class="shop-logo"
            fallback-text="☕"
          />
          <div class="coffee-info">
            <h3 class="coffee-name">{{ coffee.name }}</h3>
            <div class="coffee-shop">{{ coffee.shops?.name || coffee.shop_name }}</div>
          </div>
        </div>
        
        <!-- Favorites Button -->
        <button
          v-if="isLoggedIn"
          @click.stop="handleToggleFavorite(coffee)"
          class="favorite-btn"
          :class="{ 'favorited': isFavorited(coffee.id) }"
          :disabled="favoriteLoading[coffee.id]"
          :title="isFavorited(coffee.id) ? 'Remove from favorites' : 'Add to favorites'"
        >
          <svg v-if="favoriteLoading[coffee.id]" class="favorite-spinner" width="20" height="20" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path :class="{ 'heart-filled': isFavorited(coffee.id) }" d="m12,21.35l-1.45-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z"/>
          </svg>
        </button>
        
        <!-- Three dots menu -->
        <div class="menu-container">
          <button 
            type="button"
            class="menu-trigger"
            @click.stop="toggleMenu(coffee.id)"
            :class="{ active: activeMenuId === coffee.id }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="2" fill="currentColor"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <circle cx="12" cy="19" r="2" fill="currentColor"/>
            </svg>
          </button>
          
          <!-- Dropdown menu -->
          <div v-if="activeMenuId === coffee.id" class="menu-dropdown">
            <button 
              type="button" 
              class="menu-item"
              @click.stop="handleEditCoffee(coffee)"
              :disabled="!isLoggedIn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Coffee
            </button>
            
            <button 
              type="button" 
              class="menu-item"
              @click.stop="handleToggleFavorite(coffee)"
              :disabled="!isLoggedIn || favoriteLoading[coffee.id]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path :class="{ 'heart-filled': isFavorited(coffee.id) }" d="m12,21.35l-1.45-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z"/>
              </svg>
              {{ isFavorited(coffee.id) ? 'Remove from Favorites' : 'Add to Favorites' }}
            </button>
            
            <button 
              type="button" 
              class="menu-item menu-item-danger"
              @click.stop="handleDeleteCoffee(coffee)"
              :disabled="!isLoggedIn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Delete Coffee
            </button>
          </div>
        </div>
      </div>

      <!-- Expanded Content -->
      <div v-if="expandedCards.has(coffee.id)" class="expanded-content">
        <!-- Favorite Notes Section -->
        <div v-if="isFavorited(coffee.id)" class="favorite-notes-section" @click.stop>
          <div class="favorite-notes-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="star-icon">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            <span>Favorite Notes</span>
          </div>
          <div class="favorite-notes-content">
            <textarea
              v-model="editingNotes[coffee.id]"
              placeholder="Add personal notes about why you love this coffee..."
              class="favorite-notes-input"
              @blur="updateFavoriteNotes(coffee.id)"
              @keydown.meta.enter="updateFavoriteNotes(coffee.id)"
              @keydown.ctrl.enter="updateFavoriteNotes(coffee.id)"
              rows="2"
            />
          </div>
        </div>

        <!-- Details -->
        <div class="details-list">
          <div class="detail-row">
            <strong>Origin: </strong>
            <template v-if="isEditing">
              <input
                id="origin"
                v-model="form.origin"
                list="origins"
                placeholder="Start typing country... *"
                required
                class="input" @click.stop
              />
              <datalist id="origins">
                <option
                  v-for="o in originOptions"
                  :key="o"
                  :value="o"
                />
              </datalist>
            </template>
            <template v-else>{{ coffee.origin }}</template>
          </div>
          
          <div class="detail-row">
            <strong>Region: </strong>
            <template v-if="isEditing">
              <input v-model="form.region" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.region }}</template>
          </div>
          
          <div class="detail-row">
            <strong>Altitude (m): </strong>
            <template v-if="isEditing">
              <input v-model="form.altitude_meters" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.altitude_meters }}</template>
          </div>
          
          <div class="detail-row">
            <strong>Variety: </strong>
            <template v-if="isEditing">
              <input v-model="form.botanic_variety" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.botanic_variety }}</template>
          </div>
          
          <div class="detail-row">
            <strong>Farm/Producer: </strong>
            <template v-if="isEditing">
              <input v-model="form.farm_producer" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.farm_producer }}</template>
          </div>
          
          <div class="detail-row">
            <strong>Processing: </strong>
            <template v-if="isEditing">
              <input v-model="form.processing_method" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.processing_method }}</template>
          </div>
          
          <div class="detail-row">
            <strong>SCA Score: </strong>
            <template v-if="isEditing">
              <input v-model.number="form.sca"
                type="number"
                step="0.1"
                placeholder="SCA Score"
                class="input"
                @click.stop
              />
            </template>
            <template v-else>{{ coffee.sca }}</template>
          </div>
        </div>
        
        <!-- Flavor Section -->
        <div v-if="coffee.flavor" class="flavor-section">
          <div class="flavor-title">Flavor Profile</div>
          <div class="flavor-text">{{ coffee.flavor }}</div>
        </div>
        
        <!-- Notes Section -->
        <div v-if="coffee.notes" class="notes-section">
          <div class="notes-title">Notes</div>
          <div class="notes-text">{{ coffee.notes }}</div>
        </div>

        <!-- Recipe Section -->
        <div v-if="hasRecipeData(coffee)" class="recipe-section">
          <div class="recipe-header">
            <div class="recipe-title">Espresso Recipe</div>
          </div>
          
          <!-- Shot Toggle with Icon and Switch -->
          <div 
            v-if="getRecipeValue(coffee, 'recipe_in_grams') && getRecipeValue(coffee, 'recipe_out_grams')"
            class="shot-toggle" 
            @click.stop="toggleShotMode(coffee.id)"
          >
            <!-- Coffee Icon (placeholder for actual shot icons) -->
            <div class="shot-icon">
              <img 
                :src="isDoubleShotMode(coffee.id) ? doubleShotIcon : singleShotIcon" 
                class="shot-icon-img" 
                :alt="isDoubleShotMode(coffee.id) ? 'Double Shot' : 'Single Shot'"
              />
            </div>
            
            <!-- Slide Switch -->
            <div class="slide-switch" :data-state="isDoubleShotMode(coffee.id) ? 'double' : 'single'">
              <div class="thumb"></div>
              <span class="label label-single">Single</span>
              <span class="label label-double">Double</span>
            </div>
          </div>
          
          <div class="recipe-grid">
            <div class="recipe-item" v-if="getRecipeValue(coffee, 'recipe_in_grams') && getRecipeValue(coffee, 'recipe_out_grams')">
              <div class="recipe-label">Ratio</div>
              <div class="recipe-value">{{ (getRecipeValue(coffee, 'recipe_out_grams') / getRecipeValue(coffee, 'recipe_in_grams')).toFixed(2) }}</div>
            </div>
            <div class="recipe-item" v-if="getRecipeValue(coffee, 'recipe_in_grams')">
              <div class="recipe-label">In (G)</div>
              <div class="recipe-value">{{ getRecipeValue(coffee, 'recipe_in_grams') }}</div>
            </div>
            <div class="recipe-item" v-if="getRecipeValue(coffee, 'recipe_out_grams')">
              <div class="recipe-label">Out (G)</div>
              <div class="recipe-value">{{ getRecipeValue(coffee, 'recipe_out_grams') }}</div>
            </div>
            <div class="recipe-item" v-if="coffee.recipe_time_seconds">
              <div class="recipe-label">Time (S)</div>
              <div class="recipe-value">{{ coffee.recipe_time_seconds }}</div>
            </div>
            <div class="recipe-item" v-if="coffee.recipe_temperature_c">
              <div class="recipe-label">Temp (°C)</div>
              <div class="recipe-value">{{ coffee.recipe_temperature_c }}</div>
            </div>
          </div>
        </div>

        <!-- Container Assignments -->
        <ContainerAssignmentGrid
          :available-containers="availableContainers"
          :selected-containers="getAssignedContainers(coffee)"
          :context-coffee="coffee"
          :context-mode="'assign'"
          :disabled="!isLoggedIn"
          variant="card"
          title="Containers"
          :show-title="false"
          @container-changed="handleContainerAssignmentChange"
        />
        
        <!-- Collapse Button -->
        <button 
          class="collapse-btn" 
          @click.stop="$emit('card-expand', coffee.id)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18,15 12,9 6,15"/>
          </svg>
          Collapse
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Delete Coffee</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete "<strong>{{ coffeeToDelete?.name }}</strong>"?</p>
          <p class="modal-warning">This action cannot be undone.</p>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="cancelDelete">
            Cancel
          </button>
          <button class="modal-btn modal-btn-danger" @click="confirmDeleteAction" :disabled="isDeleting">
            <span v-if="isDeleting">Deleting...</span>
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Favorite Confirmation Modal -->
    <div v-if="showFavoriteModal" class="modal-overlay" @click="cancelUnfavorite">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Remove from Favorites</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to remove "<strong>{{ coffeeToUnfavorite?.name }}</strong>" from your favorites?</p>
          <p class="modal-warning">Any personal notes you've added will also be removed.</p>
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="cancelUnfavorite">
            Keep Favorite
          </button>
          <button class="modal-btn modal-btn-danger" @click="confirmUnfavoriteAction" :disabled="isUnfavoriting">
            <span v-if="isUnfavoriting">Removing...</span>
            <span v-else>Remove from Favorites</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import LogoImage from '../shared/LogoImage.vue'
import ContainerAssignmentGrid from '../shared/ContainerAssignmentGrid.vue'
import singleShotIcon from '../../assets/icons/1shot.svg'
import doubleShotIcon from '../../assets/icons/2shot.svg'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { useContainerAssignment } from '../../composables/useContainerAssignment'
import { useRecipeUtils } from '../../composables/useRecipeUtils'
import { useCoffeeData } from '../../composables/useCoffeeData'
import { useFavorites } from '../../composables/useFavorites'

const props = defineProps({
  coffees: { type: Array, default: () => [] },
  expandedCards: { type: Set, default: () => new Set() },
  availableContainers: { type: Array, default: () => [] },
  highlightedCoffeeId: {
    type: [String, Number],
    default: null
  }
})

// Events - Same pattern as ContainersCard.vue and ShopsCard.vue
const emit = defineEmits([
  'card-expand', 
  'edit-coffee', 
  'container-assignment-changed',
  'delete-coffee'
])

// Auth and toast
const { isLoggedIn, userId } = useAuth()
const { success, error, warning, info } = useToast()

// Composables
const {
  selectedContainers,
  containerLoadingStates,
  isContainerAssigned,
  toggleContainerAssignment
} = useContainerAssignment()

const {
  isDoubleShotMode,
  hasRecipeData,
  toggleShotMode,
  getRecipeValue
} = useRecipeUtils()

const { deleteCoffee } = useCoffeeData()

// Favorites composable
const {
  isFavorited,
  toggleFavorite,
  getFavoriteRecord,
  updateFavoriteNotes: updateNotes,
  fetchFavorites
} = useFavorites()

// Local state
const activeMenuId = ref(null)
const showDeleteModal = ref(false)
const coffeeToDelete = ref(null)
const isDeleting = ref(false)
const favoriteLoading = ref({})
const editingNotes = ref({})
const showFavoriteModal = ref(false)
const coffeeToUnfavorite = ref(null)
const isUnfavoriting = ref(false)

// Container assignment methods
const getAssignedContainers = (coffee) => {
  if (!coffee.coffee_container_assignments) return []
  return coffee.coffee_container_assignments.map(assignment => ({
    id: assignment.container_id,
    name: assignment.containers?.name || '',
    color: assignment.containers?.color || '#6b7280'
  }))
}

const handleContainerAssignmentChange = async (data) => {
  const { action, container, conflictingCoffee } = data
  
  // Emit event to parent for data refresh
  emit('container-assignment-changed', {
    coffeeId: coffee.id,
    containerId: container.id,
    action,
    conflictingCoffee
  })
  
  // Show appropriate toast message
  if (action === 'assigned') {
    if (conflictingCoffee) {
      info('Container Reassigned', `${container.name} moved from "${conflictingCoffee.name}" to "${coffee.name}"`)
    } else {
      success('Container Assigned', `${coffee.name} added to ${container.name}`)
    }
  } else if (action === 'removed') {
    success('Container Removed', `${coffee.name} removed from ${container.name}`)
  }
}

// Container styling
const getContainerStyling = (coffee) => {
  const assignedContainers = props.availableContainers.filter(container => 
    isContainerAssigned(coffee, container.id)
  )
  
  if (assignedContainers.length === 0) {
    return {
      backgroundColor: '#ffffff',
      borderLeftColor: '#e5e7eb'
    }
  }
  
  if (assignedContainers.length === 1) {
    const color = assignedContainers[0].color
    return {
      // Convert hex to rgba with very low opacity
      backgroundColor: hexToRgba(color, 0.05),
      borderLeftColor: color
    }
  }
  
  // Multiple containers - create subtle gradient
  const colors = assignedContainers.map(c => hexToRgba(c.color, 0.05))
  return {
    background: `linear-gradient(to right, ${colors.join(', ')})`,
    borderLeftColor: assignedContainers[0].color
  }
}

// Helper function to convert hex to rgba
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Get container by ID
const getContainerById = (containerId) => {
  return props.availableContainers.find(c => c.id === containerId)
}

// Initialize favorite notes for editing
const initializeFavoriteNotes = () => {
  props.coffees.forEach(coffee => {
    if (isFavorited(coffee.id)) {
      const favoriteRecord = getFavoriteRecord(coffee.id)
      editingNotes.value[coffee.id] = favoriteRecord?.notes || ''
    }
  })
}

const showModal = (type) => {
  if (type === 'favorite') {
    showFavoriteModal.value = true
  } else if (type === 'delete') {
    showDeleteModal.value = true
  }
  
  // Force scroll to top and lock body
  nextTick(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${window.scrollY}px`
    document.body.style.width = '100%'
  })
}

const hideModal = (type) => {
  if (type === 'favorite') {
    showFavoriteModal.value = false
  } else if (type === 'delete') {
    showDeleteModal.value = false
  }
  
  // Restore body scroll
  const scrollY = document.body.style.top
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  window.scrollTo(0, parseInt(scrollY || '0') * -1)
}

// Methods
const isHighlighted = (coffeeId) => {
  return props.highlightedCoffeeId && 
         String(props.highlightedCoffeeId) === String(coffeeId)
}

const toggleCardExpansion = (coffeeId) => {
  emit('card-expand', coffeeId)
}

const toggleMenu = (coffeeId) => {
  activeMenuId.value = activeMenuId.value === coffeeId ? null : coffeeId
}

const closeMenu = () => {
  activeMenuId.value = null
}

// Emit edit event
const handleEditCoffee = (coffee) => {
  console.log('Edit coffee:', coffee)
  closeMenu()
  emit('edit-coffee', coffee)
}

// Card click handler
const handleCardClick = (coffee) => {
  // Don't expand/collapse if menu is open or if clicking inside menu
  if (activeMenuId.value === coffee.id) {
    return
  }
  
  // Normal toggle behavior
  toggleCardExpansion(coffee.id)
}

// Favorites handler
const handleToggleFavorite = async (coffee) => {
  if (favoriteLoading.value[coffee.id]) return
  
  // If already favorited, show confirmation modal
  if (isFavorited(coffee.id)) {
    coffeeToUnfavorite.value = coffee
    showModal('favorite') 
    closeMenu()
    return
  }
  
  // If not favorited, add directly (no confirmation needed)
  favoriteLoading.value[coffee.id] = true
  
  try {
    const result = await toggleFavorite(coffee.id)
    
    if (result.success && isFavorited(coffee.id)) {
      // Initialize notes if newly favorited
      editingNotes.value[coffee.id] = ''
    }
  } catch (err) {
    console.error('Error adding to favorites:', err)
  } finally {
    favoriteLoading.value[coffee.id] = false
    closeMenu()
  }
}

// Handle confirmed unfavoriting
const confirmUnfavoriteAction = async () => {
  if (!coffeeToUnfavorite.value) return
  
  const coffeeId = coffeeToUnfavorite.value.id
  const coffeeName = coffeeToUnfavorite.value.name
  
  isUnfavoriting.value = true
  favoriteLoading.value[coffeeId] = true
  
  try {
    const result = await toggleFavorite(coffeeId)
    
    if (result.success) {
      // Clean up notes when unfavorited
      delete editingNotes.value[coffeeId]
      success('Removed from Favorites', `${coffeeName} has been removed from your favorites`)
    }
  } catch (err) {
    console.error('Error removing from favorites:', err)
    error('Failed to remove favorite', 'Could not remove coffee from favorites')
  } finally {
    // Always clear loading states in finally block
    favoriteLoading.value[coffeeId] = false
    isUnfavoriting.value = false
    showFavoriteModal.value = false
    coffeeToUnfavorite.value = null
  }
}

// Cancel unfavoriting
const cancelUnfavorite = () => {
  hideModal('favorite') // Use new function
  coffeeToUnfavorite.value = null
  isUnfavoriting.value = false
}

// Update favorite notes
const updateFavoriteNotes = async (coffeeId) => {
  if (!isFavorited(coffeeId)) return
  
  const notes = editingNotes.value[coffeeId]
  const favoriteRecord = getFavoriteRecord(coffeeId)
  
  // Only update if notes have changed
  if (notes === favoriteRecord?.notes) return
  
  try {
    await updateNotes(coffeeId, notes)
  } catch (err) {
    console.error('Error updating favorite notes:', err)
    // Revert to original notes on error
    editingNotes.value[coffeeId] = favoriteRecord?.notes || ''
  }
}

const handleDeleteCoffee = (coffee) => {
  if (!isLoggedIn.value) {
    info('Login required', 'Please log in to delete coffee entries')
    closeMenu()
    return
  }
  
  coffeeToDelete.value = coffee
  showModal('delete')
  closeMenu()
}

const cancelDelete = () => {
  hideModal('delete')
  coffeeToDelete.value = null
  isDeleting.value = false
}

const confirmDeleteAction = async () => {
  if (!coffeeToDelete.value) return
  
  isDeleting.value = true
  
  try {
    console.log('CoffeeCard: Emitting delete-coffee event for:', coffeeToDelete.value.name)
    
    // Emit delete event to parent instead of handling delete directly
    emit('delete-coffee', coffeeToDelete.value)
    
    // Close modal immediately - parent will handle success/error messages
    cancelDelete()
  } catch (error) {
    console.error('Failed to emit delete event:', error)
    error('Delete failed', 'Could not delete coffee entry')
    isDeleting.value = false
  }
}

// Click outside to close menu
const handleClickOutside = (event) => {
  const menuElements = document.querySelectorAll('.menu-container')
  const isClickInside = Array.from(menuElements).some(el => el.contains(event.target))
  
  if (!isClickInside) {
    closeMenu()
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    if (showFavoriteModal.value) {
      cancelUnfavorite()
    }
    if (showDeleteModal.value) {
      cancelDelete()
    }
  }
}

// Watch for changes in coffees to update notes
watch(() => props.coffees, initializeFavoriteNotes, { immediate: true })

// Lifecycle
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  
  // Load favorites if user is logged in
  if (isLoggedIn.value) {
    await fetchFavorites()
    initializeFavoriteNotes()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.coffee-grid {
  display: grid;
  gap: 1rem;
  overflow: visible;
}

@media (min-width: 768px) {
  .coffee-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.coffee-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #e5e7eb; /* Default border, will be overridden by inline styles */
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  /* Ensure text is readable on colored backgrounds */
  color: #1f2937;
  --text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}

.coffee-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.coffee-card.expanded {
  cursor: default;
  transform: none;
}

.coffee-card.highlighted {
  animation: highlight 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
}

.coffee-card.menu-open {
  z-index: 100;
}

@keyframes highlight {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.5);
  }
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.header-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.shop-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.coffee-info {
  flex: 1;
  min-width: 0;
}

.coffee-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* Enhanced text readability on colored backgrounds */
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.8);
  -webkit-font-smoothing: antialiased;
}

.coffee-shop {
  font-size: 0.875rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* Enhanced text readability on colored backgrounds */
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.8);
  -webkit-font-smoothing: antialiased;
}

/* Favorites Button */
.favorite-btn {
  padding: 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.favorite-btn:hover {
  background: rgba(243, 244, 246, 0.98);
  color: #ef4444;
  transform: scale(1.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.favorite-btn.favorited {
  color: #ef4444;
  background: rgba(254, 242, 242, 0.95);
  border-color: rgba(239, 68, 68, 0.3);
}

.favorite-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.favorite-spinner {
  animation: spin 1s linear infinite;
}

.heart-filled {
  fill: currentColor;
}

/* Menu */
.menu-container {
  position: relative;
  flex-shrink: 0;
}

.menu-trigger {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(107, 114, 128, 0.3);
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
  background: rgba(243, 244, 246, 0.98);
  color: #374151;
  border-color: rgba(107, 114, 128, 0.5);
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  min-width: 180px;
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

/* Menu heart icon styling */
.menu-item .heart-filled {
  fill: #ef4444;
  color: #ef4444;
}

/* Content */
.loading-spinner {
  position: absolute;
  right: 0.5rem;
  width: 12px;
  height: 12px;
  border: 1px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Expanded Content */
.expanded-content {
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
  margin-top: 1rem;
}

/* Favorite Notes Section */
.favorite-notes-section {
  background: #fef7e7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.favorite-notes-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.75rem;
}

.star-icon {
  color: #fbbf24;
  fill: #fbbf24;
}

.favorite-notes-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.favorite-notes-input {
  width: 100%;
  max-width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 60px;
  background: white;
  font-family: inherit;
  line-height: 1.4;
  box-sizing: border-box
}

.favorite-notes-input:focus {
  outline: none;
  border-color: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

.favorite-notes-input::placeholder {
  color: #9ca3af;
  font-style: italic;
}

.details-list {
  padding: 1rem;
  border-left: 4px solid #e5e7eb;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.detail-row {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row strong {
  color: #1f2937;
  font-weight: 600;
}

/* Flavor */
.flavor-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #dbeafe;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.flavor-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.flavor-text {
  font-size: 0.875rem;
  color: #1f2937;
  line-height: 1.5;
}

/* Notes */
.notes-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border-left: 4px solid #6b7280;
}

.notes-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notes-text {
  font-size: 0.875rem;
  color: #1f2937;
  line-height: 1.5;
}

/* Recipe Section */
.recipe-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fef7ed;
  border-radius: 8px;
  border-left: 4px solid #ea580c;
}

.recipe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.recipe-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #c2410c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Shot Toggle Styles */
.shot-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shot-toggle:hover {
  background: #fef7ed;
  border-color: #ea580c;
}

.shot-icon {
  position: relative;
  width: 32px;
  height: 32px;
  color: #ea580c;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-switch {
  position: relative;
  width: 100px;
  height: 30px;
  background-color: #ddd;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
  font-weight: 500;
  font-size: 0.75rem;
  color: #555;
}

.label {
  z-index: 1;
  width: 50%;
  text-align: center;
  transition: color 0.3s ease;
}

.thumb {
  position: absolute;
  width: 50%;
  height: 100%;
  background-color: #3b82f6;
  border-radius: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: left 0.3s ease, background-color 0.3s ease;
  left: 50%;
}

.thumb:hover {
  background-color: #2563eb;
}

.slide-switch[data-state="single"] .thumb {
  left: 0%;
}

.slide-switch[data-state="single"] .label-single {
  color: #fff;
  font-weight: 600;
}

.slide-switch[data-state="double"] .label-double {
  color: #fff;
  font-weight: 600;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.recipe-item {
  text-align: center;
  background: white;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  min-width: 0;
}

.recipe-label {
  font-size: 0.625rem;
  color: #9a3412;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.recipe-value {
  font-size: 1rem;
  font-weight: 600;
  color: #ea580c;
}

/* Collapse Button */
.collapse-btn {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.collapse-btn:hover {
  background: #e9ecef;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 1rem;
  padding-top: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  margin: 0 auto 2rem auto;
  max-height: none;
  position: relative;
  min-height: fit-content;
}

.modal-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-body {
  padding: 1rem 1.5rem;
}

.modal-body p {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.modal-warning {
  color: #dc2626;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn-cancel {
  background: white;
  color: #374151;
}

.modal-btn-cancel:hover {
  background: #f9fafb;
}

.modal-btn-danger {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.modal-btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.modal-btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .coffee-card {
    padding: 0.875rem;
  }
  
  .card-header {
    gap: 0.25rem;
  }
  
  .coffee-name {
    font-size: 1rem;
  }
  
  .coffee-shop {
    font-size: 0.8125rem;
  }
  
  .favorite-btn {
    padding: 0.375rem;
  }
  
  .menu-trigger {
    width: 28px;
    height: 28px;
  }
  
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .favorite-notes-section {
    padding: 0.75rem;
  }
  
  .favorite-notes-input {
    padding: 0.5rem;
    font-size: 0.8125rem;
  }

  .modal-overlay {
    padding: 0.5rem;
    padding-top: 1rem;
    align-items: flex-start;
  }
  
  .modal-content {
    margin: 0 auto 1rem auto;
    min-height: auto;
  }
  
  .modal-header {
    padding: 1rem 1rem 0.75rem 1rem;
  }
  
  .modal-body {
    padding: 0.75rem 1rem;
  }
  
  .modal-actions {
    padding: 0.75rem 1rem 1rem 1rem;
    flex-direction: column; /* Stack buttons on mobile */
  }
  
  .modal-btn {
    width: 100%; /* Full width buttons on mobile */
    justify-content: center;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .favorite-btn {
    border: 2px solid currentColor;
  }
  
  .favorite-notes-section {
    border-width: 2px;
  }
  
  .coffee-name,
  .coffee-shop,
  .origin-info,
  .container-title {
    text-shadow: var(--text-shadow);
    color: #1f2937;
    font-weight: 600;
  }
  
  .menu-trigger,
  .container-chip {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .coffee-card,
  .favorite-btn,
  .menu-trigger {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .coffee-card:hover {
    transform: none;
  }
  
  .favorite-btn:hover {
    transform: none;
  }
  
  .favorite-spinner {
    animation: none;
  }
  
  @keyframes highlight {
    0%, 100% {
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
    }
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .coffee-card {
    background: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .coffee-name {
    color: #f9fafb;
  }
  
  .coffee-shop {
    color: #9ca3af;
  }
  
  .origin-info {
    color: #9ca3af;
  }
  
  .menu-trigger:hover,
  .menu-trigger.active {
    background: #374151;
    color: #f9fafb;
  }
  
  .menu-dropdown {
    background: #1f2937;
    border-color: #374151;
  }
  
  .menu-item {
    color: #f9fafb;
  }
  
  .menu-item:hover:not(:disabled) {
    background: #374151;
  }
  
  .menu-item-danger:hover:not(:disabled) {
    background: #7f1d1d;
    color: #fecaca;
  }
  
  .container-chip {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .container-chip:hover:not(:disabled) {
    background: #4b5563;
  }
  
  .favorite-notes-section {
    background: #451a03;
    border-color: #92400e;
  }
  
  .favorite-notes-input {
    background: #1f2937;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .favorite-notes-input:focus {
    border-color: #fbbf24;
  }
  
  .favorite-notes-input::placeholder {
    color: #6b7280;
  }
  
  .details-grid .detail-value {
    color: #f9fafb;
  }
  
  .flavor-section,
  .notes-section {
    background: #374151;
  }
  
  .flavor-title,
  .notes-title {
    color: #f9fafb;
  }
  
  .flavor-text,
  .notes-text {
    color: #d1d5db;
  }
  
  .recipe-section {
    background: #451a03;
    border-color: #92400e;
  }
  
  .shot-toggle {
    background: #1f2937;
    border-color: #92400e;
  }
  
  .shot-toggle:hover {
    background: #374151;
  }
  
  .recipe-item {
    background: #1f2937;
    border-color: #92400e;
  }
  
  .collapse-btn {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
  
  .collapse-btn:hover {
    background: #4b5563;
  }
  
  .modal-content {
    background: #1f2937;
  }
  
  .modal-header {
    border-color: #374151;
  }
  
  .modal-title {
    color: #f9fafb;
  }
  
  .modal-body p {
    color: #d1d5db;
  }
  
  .modal-btn-cancel {
    background: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }
  
  .modal-btn-cancel:hover {
    background: #4b5563;
  }
}

/* Print styles */
@media print {
  .coffee-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #e5e7eb;
    margin-bottom: 1rem;
  }
  
  .favorite-btn,
  .menu-container,
  .container-section,
  .collapse-btn {
    display: none;
  }
  
  .coffee-card.expanded {
    page-break-inside: avoid;
  }
  
  .modal-overlay {
    display: none;
  }
}

/* Focus management for accessibility */
.coffee-card:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.favorite-btn:focus-visible,
.menu-trigger:focus-visible,
.container-chip:focus-visible,
.collapse-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.modal-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Loading states */
.coffee-card.loading {
  opacity: 0.7;
  pointer-events: none;
}

.container-chip.loading {
  opacity: 0.8;
  cursor: wait;
}

/* Animation classes for dynamic additions */
.coffee-card.animate-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Container-specific styling classes */
.coffee-card.container-highlight {
  /* Applied when single container is assigned - styling handled via inline styles */
}

.coffee-card.bg-gradient-multiple {
  /* Applied when multiple containers are assigned */
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
}

/* Error states */
.coffee-card.error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.container-chip.error {
  border-color: #ef4444;
  background: #fef2f2;
  color: #dc2626;
}

/* Success states */
.coffee-card.success {
  border-left-color: #22c55e;
  background: #f0fdf4;
}

.container-chip.success {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #166534;
}
</style>