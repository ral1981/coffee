<template>
  <div class="coffee-grid">
    <div
      v-for="coffee in coffees"
      :key="coffee.id"
      class="coffee-card"
      :class="{
        'highlighted': isHighlighted(coffee.id),
        'expanded': expandedCards.has(coffee.id),
        'editing': editingCoffee === coffee.id
      }"
      :data-coffee-id="coffee.id"
      @click="!editingCoffee ? $emit('card-expand', coffee.id) : null"
    >
      <!-- Three dots menu - positioned at card level -->
      <div class="coffee-menu-container">
        <button
          type="button"
          @click.stop="toggleMenu(coffee.id)"
          class="coffee-menu-button"
          :class="{ 'active': openMenuId === coffee.id }"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>

      <!-- Use Teleport to render dropdown in body to avoid clipping -->
      <Teleport to="body">
        <div
          v-if="openMenuId === coffee.id"
          class="coffee-menu-dropdown-portal"
          :style="getDropdownPosition(coffee.id)"
          @click.stop
        >
          <!-- Shop Page (available to all users) -->
          <button
            v-if="coffee.bean_url || coffee.shops?.url"
            type="button"
            @click="openShopPage(coffee)"
            class="menu-item"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="menu-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Shop Page
          </button>

          <!-- Edit (disabled for guests) -->
          <button
            type="button"
            @click="handleMenuAction('edit', coffee)"
            :class="[
              'menu-item',
              isLoggedIn 
                ? 'menu-item-enabled' 
                : 'menu-item-disabled'
            ]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="menu-icon">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            Edit
            <span v-if="!isLoggedIn" class="menu-disabled-hint">Login required</span>
          </button>

          <!-- Delete (disabled for guests) -->
          <button
            type="button"
            @click="handleMenuAction('delete', coffee)"
            :class="[
              'menu-item menu-item-danger',
              isLoggedIn 
                ? 'menu-item-enabled' 
                : 'menu-item-disabled'
            ]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="menu-icon">
              <polyline points="3,6 5,6 21,6"/>
              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2,2h4a2,2 0 0,1,2,2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Delete
            <span v-if="!isLoggedIn" class="menu-disabled-hint">Login required</span>
          </button>
        </div>
      </Teleport>

      <div class="coffee-header">
        <div class="coffee-logo">
          <LogoImage
            :url="coffee.shops?.url || coffee.bean_url"
            :custom-logo="coffee.shops?.logo"
            :size="48"
            alt="shop logo"
            class-name="rounded-lg"
          />
        </div>
        <div class="coffee-info">
          <!-- Coffee Name - Editable -->
          <div class="coffee-name">
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.name"
                class="edit-input name-input"
                placeholder="Coffee name"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </template>
            <template v-else>
              {{ coffee.name }}
            </template>
          </div>
          
          <!-- Shop Name - Editable -->
          <div class="coffee-shop">
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.shop_name"
                list="shops"
                class="edit-input shop-input"
                placeholder="Shop name"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
              <datalist id="shops">
                <option v-for="shop in shopOptions" :key="shop" :value="shop" />
              </datalist>
            </template>
            <template v-else>
              {{ coffee.shops?.name || coffee.shop_name || 'Unknown Shop' }}
            </template>
          </div>
        </div>
      </div>
      
      <!-- Container Tags - Interactive Assignment -->
      <div class="container-section">
        <div class="container-tags">
          <button
            v-for="container in availableContainers"
            :key="container.id"
            class="container-tag"
            :class="{ 
              active: isContainerAssigned(coffee, container.id),
              loading: containerLoadingStates[`${coffee.id}-${container.id}`],
              highlighted: isHighlighted(coffee.id)
            }"
            @click.stop="handleContainerAssignment(coffee, container)"
            :disabled="containerLoadingStates[`${coffee.id}-${container.id}`] || editingCoffee === coffee.id"
          >
            <!-- Loading spinner -->
            <div 
              v-if="containerLoadingStates[`${coffee.id}-${container.id}`]"
              class="container-spinner"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            
            <!-- Container dot -->
            <div 
              v-else
              class="container-dot" 
              :style="{ background: container.color }"
            ></div>
            
            {{ container.name }}
          </button>
        </div>
      </div>

      <!-- Expanded details - Show when expanded OR when editing -->
      <div v-if="expandedCards.has(coffee.id) || editingCoffee === coffee.id" class="coffee-details" @click.stop>
        <!-- Info Grid - Editable -->
        <div class="details-grid">
          <!-- Origin -->
          <div class="detail-item">
            <div class="detail-label">Origin</div>
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.origin"
                list="origins"
                class="edit-input detail-input"
                placeholder="Country *"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
              <datalist id="origins">
                <option v-for="origin in originOptions" :key="origin" :value="origin" />
              </datalist>
            </template>
            <template v-else>
              <div class="detail-value">{{ coffee.origin || '–' }}</div>
            </template>
          </div>

          <!-- Region -->
          <div class="detail-item">
            <div class="detail-label">Region</div>
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.region"
                class="edit-input detail-input"
                placeholder="Region"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </template>
            <template v-else>
              <div class="detail-value">{{ coffee.region || '–' }}</div>
            </template>
          </div>

          <!-- Altitude -->
          <div class="detail-item">
            <div class="detail-label">Altitude (m)</div>
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.altitude_meters"
                class="edit-input detail-input"
                placeholder="1200-1400m"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </template>
            <template v-else>
              <div class="detail-value">{{ coffee.altitude_meters || '–' }}</div>
            </template>
          </div>

          <!-- Variety -->
          <div class="detail-item">
            <div class="detail-label">Variety</div>
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.botanic_variety"
                class="edit-input detail-input"
                placeholder="Bourbon, Typica"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </template>
            <template v-else>
              <div class="detail-value">{{ coffee.botanic_variety || '–' }}</div>
            </template>
          </div>

          <!-- Farm/Producer -->
          <div class="detail-item">
            <div class="detail-label">Farm/Producer</div>
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.farm_producer"
                class="edit-input detail-input"
                placeholder="Farm/Producer"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </template>
            <template v-else>
              <div class="detail-value">{{ coffee.farm_producer || '–' }}</div>
            </template>
          </div>

          <!-- Processing -->
          <div class="detail-item">
            <div class="detail-label">Processing</div>
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model="editForm.processing_method"
                class="edit-input detail-input"
                placeholder="Washed, Natural"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </template>
            <template v-else>
              <div class="detail-value">{{ coffee.processing_method || '–' }}</div>
            </template>
          </div>

          <!-- SCA Score -->
          <div class="detail-item">
            <div class="detail-label">SCA Score</div>
            <template v-if="editingCoffee === coffee.id">
              <input
                v-model.number="editForm.sca"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="edit-input detail-input"
                placeholder="85"
                @click.stop
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </template>
            <template v-else>
              <div class="detail-value">{{ coffee.sca || '–' }}</div>
            </template>
          </div>
        </div>
        
        <!-- Flavor Section - Editable -->
        <div class="flavor-section">
          <div class="flavor-title">Flavor Profile</div>
          <template v-if="editingCoffee === coffee.id">
            <textarea
              v-model="editForm.flavor"
              class="edit-textarea flavor-textarea"
              rows="3"
              placeholder="Describe the flavor notes, body, acidity..."
              @click.stop
            ></textarea>
          </template>
          <template v-else>
            <div class="flavor-text">{{ coffee.flavor || '–' }}</div>
          </template>
        </div>
        
        <!-- Notes Section - Editable -->
        <div class="notes-section">
          <div class="notes-title">Notes</div>
          <template v-if="editingCoffee === coffee.id">
            <textarea
              v-model="editForm.notes"
              class="edit-textarea notes-textarea"
              rows="3"
              placeholder="Add your brewing notes, observations..."
              @click.stop
            ></textarea>
          </template>
          <template v-else>
            <div class="notes-text">{{ coffee.notes || 'No notes yet.' }}</div>
          </template>
        </div>

        <!-- Recipe Section - Always show in edit mode, or if recipe data exists -->
        <div v-if="hasRecipeData(coffee) || editingCoffee === coffee.id" class="recipe-section">
          <div class="recipe-header">
            <div class="recipe-title">Espresso Recipe</div>
            
            <!-- Single/Double Toggle (only in view mode) -->
            <div v-if="editingCoffee !== coffee.id" class="shot-toggle">
              <div class="shot-icon">☕</div>
              <div class="toggle-buttons">
                <button 
                  class="toggle-btn"
                  :class="{ active: !isDoubleShotMode[coffee.id] }"
                  @click.stop="toggleShotMode(coffee.id, false)"
                >
                  Single
                </button>
                <button 
                  class="toggle-btn"
                  :class="{ active: isDoubleShotMode[coffee.id] !== false }"
                  @click.stop="toggleShotMode(coffee.id, true)"
                >
                  Double
                </button>
              </div>
            </div>
          </div>
          
          <template v-if="editingCoffee === coffee.id">
            <!-- Edit Mode Recipe Grid -->
            <div class="recipe-edit-grid">
              <input
                v-model.number="editForm.recipe_in_grams"
                type="number"
                step="0.1"
                placeholder="In (g)"
                class="edit-input recipe-input"
                @click.stop
              />
              <input
                v-model.number="editForm.recipe_out_grams"
                type="number"
                step="0.1"
                placeholder="Out (g)"
                class="edit-input recipe-input"
                @click.stop
              />
              <input
                v-model="editForm.recipe_time_seconds"
                placeholder="Time (s)"
                class="edit-input recipe-input"
                @click.stop
              />
              <input
                v-model.number="editForm.recipe_temperature_c"
                type="number"
                step="0.1"
                placeholder="Temp (°C)"
                class="edit-input recipe-input"
                @click.stop
              />
            </div>
          </template>
          <template v-else>
            <!-- View Mode Recipe Grid -->
            <div class="recipe-grid">
              <div v-if="getRecipeRatio(coffee)" class="recipe-item">
                <div class="recipe-label">Ratio</div>
                <div class="recipe-value">1:{{ getRecipeRatio(coffee) }}</div>
              </div>
              <div v-if="getRecipeValue(coffee, 'inGrams')" class="recipe-item">
                <div class="recipe-label">In (g)</div>
                <div class="recipe-value">{{ getRecipeValue(coffee, 'inGrams') }}</div>
              </div>
              <div v-if="getRecipeValue(coffee, 'outGrams')" class="recipe-item">
                <div class="recipe-label">Out (g)</div>
                <div class="recipe-value">{{ getRecipeValue(coffee, 'outGrams') }}</div>
              </div>
              <div v-if="getRecipeTime(coffee)" class="recipe-item">
                <div class="recipe-label">Time</div>
                <div class="recipe-value">{{ getRecipeTime(coffee) }}</div>
              </div>
              <div v-if="getRecipeTemp(coffee)" class="recipe-item">
                <div class="recipe-label">Temp (°C)</div>
                <div class="recipe-value">{{ getRecipeTemp(coffee) }}</div>
              </div>
            </div>
          </template>
        </div>

        <!-- Save/Cancel Buttons for Edit Mode -->
        <div v-if="editingCoffee === coffee.id" class="edit-actions">
          <button class="btn btn-cancel" @click="cancelEdit">
            Cancel
          </button>
          <button class="btn btn-save" @click="saveEdit" :disabled="!isEditFormValid">
            Save Changes
          </button>
        </div>
        
        <!-- Collapse Button (only in view mode) -->
        <button 
          v-else
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import LogoImage from '../shared/LogoImage.vue'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { useCoffeeEdit } from '../../composables/useCoffeeEdit'
import { useContainerConflict } from '../../composables/useContainerConflict'
import { useContainerAssignment } from '../../composables/useContainerAssignment'
import { useCoffeeFormOptions } from '../../composables/useCoffeeFormOptions'
import { useRecipeUtils } from '../../composables/useRecipeUtils'

const props = defineProps({
  coffees: { type: Array, default: () => [] },
  expandedCards: { type: Set, default: () => new Set() },
  availableContainers: { type: Array, default: () => [] },
  highlightedCoffeeId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['card-expand', 'card-action', 'container-assignment-changed', 'coffee-updated'])

// Auth and toast
const { isLoggedIn, userId } = useAuth()
const { success, error, warning, info } = useToast()

// Shared composables
const {
  form: editForm,
  originalForm,
  isFormValid: isEditFormValid,
  getValidationErrors,
  populateForm,
  resetForm,
  saveCoffee
} = useCoffeeEdit()

const {
  selectedContainers,
  containerLoadingStates,
  isContainerAssigned,
  toggleContainerAssignment
} = useContainerAssignment()

const {
  shopNameOptions: shopOptions,
  originOptions
} = useCoffeeFormOptions(computed(() => props.coffees))

const {
  isDoubleShotMode,
  hasRecipeData,
  toggleShotMode,
  getRecipeValue,
  getRecipeTime,
  getRecipeTemp,
  getRecipeRatio
} = useRecipeUtils()

// Local state
const editingCoffee = ref(null)
const openMenuId = ref(null)
const showDeleteModal = ref(false)
const coffeeToDelete = ref(null)
const isDeleting = ref(false)
const dropdownPositions = reactive({})

// Computed
const isHighlighted = (coffeeId) => {
  return props.highlightedCoffeeId === coffeeId
}

// Menu handling
const getDropdownPosition = (coffeeId) => {
  return dropdownPositions[coffeeId] || {
    position: 'fixed',
    top: '0px',
    left: '0px',
    zIndex: 1000
  }
}

const toggleMenu = async (coffeeId) => {
  if (openMenuId.value === coffeeId) {
    openMenuId.value = null
    delete dropdownPositions[coffeeId]
  } else {
    openMenuId.value = coffeeId
    
    await nextTick()
    
    const menuButton = document.querySelector(`[data-coffee-id="${coffeeId}"] .coffee-menu-button`)
    if (menuButton) {
      const rect = menuButton.getBoundingClientRect()
      const dropdownWidth = 160
      const dropdownHeight = 120
      
      let top = rect.bottom + 8
      let left = rect.right - dropdownWidth
      
      if (left < 8) left = 8
      if (left + dropdownWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropdownWidth - 8
      }
      if (top + dropdownHeight > window.innerHeight - 8) {
        top = rect.top - dropdownHeight - 8
      }
      
      dropdownPositions[coffeeId] = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 1000
      }
    }
  }
}

const closeMenu = () => {
  openMenuId.value = null
}

const openShopPage = (coffee) => {
  const url = coffee.shops?.url || coffee.bean_url
  if (url) {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    window.open(fullUrl, '_blank', 'noopener,noreferrer')
  } else {
    warning('No shop URL', 'This coffee doesn\'t have a shop URL available')
  }
  closeMenu()
}

const handleMenuAction = (action, coffee) => {
  if (!isLoggedIn.value) {
    showLoginPrompt(action)
    return
  }

  switch (action) {
    case 'edit':
      startEdit(coffee)
      break
    case 'delete':
      confirmDelete(coffee)
      break
    default:
      console.log('Unknown action:', action)
  }
  closeMenu()
}

const showLoginPrompt = (action) => {
  const actionText = action === 'edit' ? 'edit coffee entries' : 'delete coffee entries'
  info('Login required', `Please log in to ${actionText}`)
  closeMenu()
}

// Edit functionality using shared composable
const startEdit = (coffee) => {
  console.log('Starting edit for coffee:', coffee.name, 'ID:', coffee.id)
  
  if (editingCoffee.value) {
    warning('Edit in progress', 'Please save or cancel the current edit first')
    return
  }

  editingCoffee.value = coffee.id
  
  // Force expand the card if not already expanded
  if (!props.expandedCards.has(coffee.id)) {
    emit('card-expand', coffee.id)
  }
  
  // Use shared form population
  populateForm(coffee)
  
  info('Edit mode', 'All fields are now editable. Save with Enter or click Save button')
}

const cancelEdit = () => {
  console.log('Cancelling edit mode')
  editingCoffee.value = null
  resetForm()
  info('Edit cancelled', 'Changes have been discarded')
}

const saveEdit = async () => {
  if (!isEditFormValid.value) {
    const errors = getValidationErrors()
    error('Validation failed', errors[0])
    return
  }

  console.log('Saving edit with form data:', editForm)

  try {
    info('Saving changes...', 'Please wait while we update your coffee')
    
    // Use shared save function
    const result = await saveCoffee(editingCoffee.value, userId.value)
    
    if (result.success) {
      success('Coffee Updated', 'Your changes have been saved successfully')
      emit('coffee-updated', result.data)
      
      // Close edit mode after delay
      setTimeout(() => {
        if (editingCoffee.value === result.data.id) {
          cancelEdit()
        }
      }, 1500)
    }
    
  } catch (err) {
    console.error('Save failed:', err)
    error('Save Failed', `Could not save changes: ${err.message}`)
  }
}

// Delete functionality
const confirmDelete = (coffee) => {
  coffeeToDelete.value = coffee
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  coffeeToDelete.value = null
  isDeleting.value = false
}

const confirmDeleteAction = async () => {
  if (!coffeeToDelete.value || isDeleting.value) return
  
  isDeleting.value = true
  
  try {
    emit('card-action', 'delete', coffeeToDelete.value)
    setTimeout(() => {
      cancelDelete()
    }, 500)
  } catch (err) {
    console.error('Delete action failed:', err)
    error('Delete failed', 'Could not delete coffee entry')
    isDeleting.value = false
  }
}

// Container assignment using shared composable
const handleContainerAssignment = async (coffee, container) => {
  console.log('🔄 CoffeeGrid handleContainerAssignment:', {
    coffeeId: coffee.id,
    containerId: container.id,
    coffeeName: coffee.name
  })

  const loadingKey = `${coffee.id}-${container.id}`
  containerLoadingStates[loadingKey] = true

  try {
    const isCurrentlyAssigned = isContainerAssigned(coffee, container.id)
    
    console.log('📊 Current assignment status:', {
      coffeeId: coffee.id,
      containerId: container.id,
      isCurrentlyAssigned
    })

    // If removing assignment, no conflict check needed
    if (isCurrentlyAssigned) {
      emit('container-assignment-changed', {
        coffee,
        container,
        action: 'remove'
      })

      console.log('✅ Emitted container-assignment-changed (remove):', {
        coffeeId: coffee.id,
        containerId: container.id
      })
      return
    }

    // ADDING ASSIGNMENT - Check for conflicts first
    console.log('🔍 Checking for container conflicts before assignment...')
    
    // Use the shared conflict detection
    const {
      checkContainerConflict,
      showConflictDialog,
      loadCoffeesForConflictDetection
    } = useContainerConflict()

    // Load conflict data
    await loadCoffeesForConflictDetection()

    // Check for conflict
    const conflictingCoffee = checkContainerConflict(container.id, coffee.id)
    
    console.log('🔍 Conflict check result:', {
      containerId: container.id,
      currentCoffeeId: coffee.id,
      conflictingCoffee: conflictingCoffee ? {
        id: conflictingCoffee.id,
        name: conflictingCoffee.name
      } : null
    })

    if (conflictingCoffee) {
      // Show conflict dialog
      console.log('⚠️ Container conflict detected, showing dialog...')
      
      const confirmed = showConflictDialog(container, conflictingCoffee, coffee.name)
      
      if (!confirmed) {
        console.log('❌ User cancelled container assignment due to conflict')
        info('Assignment cancelled', 'Container assignment was cancelled')
        return
      }
      
      console.log('✅ User confirmed conflict resolution')
      info(
        'Container Conflict Resolved',
        `"${conflictingCoffee.name}" will be removed from ${container.name}`
      )
    }

    // Proceed with assignment
    emit('container-assignment-changed', {
      coffee,
      container,
      action: 'assign'
    })

    console.log('✅ Emitted container-assignment-changed (assign):', {
      coffeeId: coffee.id,
      containerId: container.id,
      hadConflict: !!conflictingCoffee
    })

  } catch (error) {
    console.error('❌ Container assignment error:', error)
    error('Assignment failed', 'Could not update container assignment')
  } finally {
    containerLoadingStates[loadingKey] = false
  }
}

// Click outside to close menu
const handleClickOutside = (event) => {
  const menuElements = document.querySelectorAll('.coffee-menu-dropdown-portal, .coffee-menu-button')
  const isClickInside = Array.from(menuElements).some(el => el.contains(event.target))
  
  if (!isClickInside) {
    closeMenu()
  }
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  if (editingCoffee.value) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      saveEdit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit()
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
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

.coffee-card.editing {
  border-left-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  cursor: default;
  transform: none;
  animation: edit-pulse 2s ease-in-out;
}

.coffee-card.highlighted {
  animation: highlight 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
}

@keyframes edit-pulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
  }
}

/* Menu Styles */
.coffee-menu-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.coffee-menu-button {
  background: #f8f9fa;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.coffee-menu-button:hover,
.coffee-menu-button.active {
  background: #e9ecef;
  color: #333;
}

.coffee-menu-dropdown-portal {
  width: 160px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item-enabled {
  color: #374151;
}

.menu-item-enabled:hover {
  background: #f9fafb;
}

.menu-item-disabled {
  color: #9ca3af;
  cursor: not-allowed;
  background: #f9fafb;
}

.menu-item-danger.menu-item-enabled {
  color: #dc2626;
}

.menu-item-danger.menu-item-enabled:hover {
  background: #fee2e2;
}

.menu-icon {
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.menu-disabled-hint {
  margin-left: auto;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Coffee Header */
.coffee-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.coffee-logo {
  width: 48px;
  height: 48px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.coffee-info {
  flex: 1;
  min-width: 0;
}

.coffee-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.coffee-shop {
  color: #666;
  font-size: 1rem;
}

/* Edit Input Styles */
.edit-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  background: white;
  transition: border-color 0.2s;
}

.edit-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.name-input {
  font-size: 1.25rem;
  font-weight: 600;
}

.shop-input {
  font-size: 1rem;
  color: #666;
}

.url-input {
  font-size: 0.875rem;
  color: #888;
  margin-top: 0.25rem;
}

.detail-input {
  font-size: 0.875rem;
  padding: 0.375rem;
}

.recipe-input {
  font-size: 0.875rem;
  padding: 0.5rem;
  text-align: center;
}

.edit-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;
}

.edit-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Container Section */
.container-section {
  margin-bottom: 1rem;
}

.container-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.container-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 16px;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
  min-height: 32px;
}

.container-tag:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.container-tag.active {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
  color: #22c55e;
  font-weight: 500;
}

.container-tag.active:hover {
  background: rgba(34, 197, 94, 0.15);
}

.container-tag:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.container-tag.loading {
  cursor: wait;
}

.container-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.container-tag.active .container-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.container-spinner {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container-spinner svg {
  animation: container-spin 1s linear infinite;
}

@keyframes container-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Expanded Details */
.coffee-details {
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
  margin-top: 1rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

/* Flavor Section */
.flavor-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #22c55e;
}

.flavor-title {
  font-size: 0.875rem;
  color: #22c55e;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.flavor-text {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.4;
}

/* Notes Section */
.notes-section {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #0ea5e9;
  margin-bottom: 1rem;
}

.notes-title {
  font-size: 0.875rem;
  color: #0284c7;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.notes-text {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.4;
}

/* Recipe Section */
.recipe-section {
  background: #fff7ed;
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #f97316;
  margin-bottom: 1rem;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.recipe-title {
  font-size: 0.875rem;
  color: #ea580c;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.shot-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.shot-icon {
  font-size: 1.25rem;
}

.toggle-buttons {
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
}

.toggle-btn {
  padding: 0.25rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
}

.recipe-edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .recipe-edit-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.recipe-item {
  text-align: center;
  background: white;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  border: 1px solid #fed7aa;
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

/* Edit Actions */
.edit-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: #22c55e;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #16a34a;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  position: relative;
}

.btn-save.saving {
  background: #16a34a;
  color: white;
}

.btn-save.saving::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  margin: auto;
  border: 2px solid transparent;
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: button-loading-spinner 1s ease infinite;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

@keyframes button-loading-spinner {
  from {
    transform: rotate(0turn);
  }
  to {
    transform: rotate(1turn);
  }
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-title {
  font-size: 1.25rem;
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
  padding: 0 1.5rem 1.5rem 1.5rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.modal-btn-cancel:hover {
  background: #e5e7eb;
}

.modal-btn-danger {
  background: #dc2626;
  color: white;
}

.modal-btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.modal-btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 640px) {
  .coffee-header {
    gap: 0.75rem;
  }
  
  .coffee-logo {
    width: 40px;
    height: 40px;
  }
  
  .coffee-name {
    font-size: 1.125rem;
  }
  
  .recipe-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .recipe-grid {
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  }
  
  .toggle-buttons {
    width: 100%;
  }
  
  .toggle-btn {
    flex: 1;
    padding: 0.375rem;
  }

  .coffee-menu-dropdown-portal {
    width: 140px;
  }

  .menu-item {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }

  .menu-disabled-hint {
    font-size: 0.6875rem;
  }

  .edit-actions {
    flex-direction: column;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .coffee-card {
    transition: none;
  }
  
  .coffee-card:hover {
    transform: none;
  }
  
  .coffee-card.highlighted {
    animation: none;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
  }
  
  .container-spinner svg {
    animation: none;
  }
}
</style>