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

      <!-- Basic Info -->
      <div class="coffee-content">
        <div class="origin-info">
          <span class="origin">{{ coffee.origin }}</span>
          <span v-if="coffee.region" class="region">, {{ coffee.region }}</span>
        </div>
        
        <!-- Container Assignments -->
        <div v-if="availableContainers.length > 0" class="container-section">
          <div class="container-title">Containers</div>
          <div class="container-grid">
            <button
              v-for="container in availableContainers"
              :key="container.id"
              class="container-chip"
              :class="{ 
                'assigned': isContainerAssigned(coffee, container.id),
                'loading': containerLoadingStates[`${coffee.id}-${container.id}`]
              }"
              @click.stop="toggleContainerAssignment(coffee, container)"
              :disabled="containerLoadingStates[`${coffee.id}-${container.id}`] || !isLoggedIn"
              :style="{ 
                '--container-color': container.color,
                borderColor: isContainerAssigned(coffee, container.id) ? container.color : '#e5e7eb'
              }"
            >
              <div class="container-dot" :style="{ background: container.color }"></div>
              <span class="container-name">{{ container.name }}</span>
              <div v-if="containerLoadingStates[`${coffee.id}-${container.id}`]" class="loading-spinner"></div>
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

        <!-- Details Grid -->
        <div class="details-grid">
          <!-- Altitude -->
          <div class="detail-item">
            <div class="detail-label">Altitude</div>
            <div class="detail-value">{{ coffee.altitude_meters || '—' }}</div>
          </div>

          <!-- Variety -->
          <div class="detail-item">
            <div class="detail-label">Variety</div>
            <div class="detail-value">{{ coffee.botanic_variety || '—' }}</div>
          </div>

          <!-- Farm/Producer -->
          <div class="detail-item">
            <div class="detail-label">Farm/Producer</div>
            <div class="detail-value">{{ coffee.farm_producer || '—' }}</div>
          </div>

          <!-- Processing -->
          <div class="detail-item">
            <div class="detail-label">Processing</div>
            <div class="detail-value">{{ coffee.processing_method || '—' }}</div>
          </div>

          <!-- SCA Score -->
          <div class="detail-item">
            <div class="detail-label">SCA Score</div>
            <div class="detail-value">{{ coffee.sca || '—' }}</div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import LogoImage from '../../shared/LogoImage.vue'
import singleShotIcon from '../../../assets/icons/1shot.svg'
import doubleShotIcon from '../../../assets/icons/2shot.svg'
import { useAuth } from '../../../composables/useAuth'
import { useToast } from '../../../composables/useToast'
import { useContainerAssignment } from '../../../composables/useContainerAssignment'
import { useRecipeUtils } from '../../../composables/useRecipeUtils'
import { useCoffeeData } from '../../../composables/useCoffeeData'
import { useFavorites } from '../../../composables/useFavorites'

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
const emit = defineEmits(['card-expand', 'edit-coffee', 'container-assignment-changed'])

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

// Container styling function
const getContainerStyling = (coffee) => {
  const assignments = coffee.containerAssignments || []
  
  if (assignments.length === 0) {
    return {
      backgroundColor: '#ffffff',
      borderLeftColor: '#8b5cf6' // Default violet color
    }
  }
  
  if (assignments.length === 1) {
    const container = getContainerById(assignments[0])
    if (container) {
      return {
        background: `linear-gradient(135deg, ${container.color}25, ${container.color}10)`,
        borderLeftColor: container.color
      }
    }
  }
  
  // Multiple containers - create gradients
  const containers = assignments.map(id => getContainerById(id)).filter(Boolean)
  if (containers.length > 1) {
    const colors = containers.map(c => c.color)
    
    // Create vertical gradient for left border (top to bottom)
    const borderGradient = `linear-gradient(to bottom, ${colors.join(', ')})`
    
    // Create horizontal gradient for background (left to right with higher opacity)
    const backgroundColors = colors.map(color => `${color}20`).join(', ')
    const backgroundGradient = `linear-gradient(to right, ${backgroundColors})`
    
    return {
      background: backgroundGradient,
      borderLeft: `4px solid transparent`,
      borderImage: `${borderGradient} 1`,
      borderImageSlice: 1
    }
  }
  
  // Fallback
  return {
    backgroundColor: '#ffffff',
    borderLeftColor: '#8b5cf6'
  }
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
    await deleteCoffee(coffeeToDelete.value.id)
    success('Coffee Deleted', `${coffeeToDelete.value.name} has been deleted`)
    cancelDelete()
  } catch (error) {
    console.error('Failed to delete coffee:', error)
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