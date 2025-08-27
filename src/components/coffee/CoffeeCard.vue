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
            <span v-else">Delete</span>
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
import LogoImage from '../shared/LogoImage.vue'
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
  border-left: 4px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
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
}

.coffee-shop {
  font-size: 0.875rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Favorites Button */
.favorite-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.favorite-btn:hover {
  background: #f3f4f6;
  color: #ef4444;
  transform: scale(1.1);
}

.favorite-btn.favorited {
  color: #ef4444;
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
.coffee-content {
  margin-bottom: 1rem;
}

.origin-info {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.origin {
  font-weight: 500;
}

/* Container Section */
.container-section {
  margin-top: 1rem;
}

.container-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.container-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.container-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.container-chip:hover:not(:disabled) {
  background: #f9fafb;
  border-color: var(--container-color);
}

.container-chip.assigned {
  background: color-mix(in srgb, var(--container-color) 10%, white);
  border-color: var(--container-color);
  color: #374151;
}

.container-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.container-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.container-name {
  font-weight: 500;
}

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

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-item {
  text-align: center;
}

.detail-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

/* Flavor and Notes */
.flavor-section,
.notes-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
}

.flavor-title,
.notes-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.flavor-text,
.notes-text {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

/* Recipe Section */
.recipe-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fef7ed;
  border-radius: 8px;
  border: 1px solid #fed7aa;
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
  color: #9a3412;
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  margin: 1rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto ;
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
  }
  
  .favorite-notes-section {
    padding: 0.75rem;
  }
  
  .favorite-notes-input {
    padding: 0.5rem;
    font-size: 0.8125rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .favorite-btn {
    border: 1px solid currentColor;
  }
  
  .favorite-notes-section {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .coffee-card,
  .favorite-btn,
  .menu-trigger {
    transition: none;
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
</style>