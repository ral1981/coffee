<template>
  <div v-if="props.coffee" :data-coffee-id="props.coffee.id">
    <div :class="cardClasses">
      <!-- Header - Now clickable for expand/collapse -->
      <div 
        class="relative flex items-start m-4 cursor-pointer"
        @click="toggleCollapse"
      >
        <!-- 1) Favicon (left zone) -->
        <div class="flex-shrink-0">
          <img
            :src="coffee.shop_logo"
            alt="shop logo"
            width="48"
            height="48"
            class="rounded"
          />
        </div>

        <!-- 2) Title & Shop name (middle zone) -->
        <div class="flex-1 min-w-0 ml-4 mr-2">
          <div class="transition-all duration-300 ease-in-out">
            <!-- Coffee name -->
            <div class="flex items-center gap-2">
              <template v-if="isEditing">
                <input
                  v-model="form.name"
                  type="text"
                  class="text-2xl font-bold leading-tight w-full border border-gray-300 rounded px-2 py-1"
                  :placeholder="coffee.name"
                  @click.stop
                />
              </template>
              <template v-else>
                <strong
                  class="block text-2xl font-bold leading-tight transition-all duration-300"
                  :class="[
                    isCollapsed ? 'truncate' : 'break-words'
                  ]"
                  :title="coffee.name"
                >
                  {{ coffee.name }}
                </strong>
              </template>
            </div>

            <!-- Shop name and URL inputs (editing mode) -->
            <div v-if="isEditing" class="space-y-2 mt-2" @click.stop>
              <!-- Shop name input -->
              <input
                v-model="form.shop_name"
                type="text"
                class="text-lg text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                placeholder="Shop Name"
              />
              <!-- Shop URL input -->
              <input
                v-model="form.shop_url"
                @input="deriveShopLogo"
                type="text"
                class="text-sm text-gray-400 border border-gray-300 rounded px-2 py-1 w-full"
                placeholder="Shop URL"
              />
            </div>

            <!-- Shop name display (view mode) -->
            <div v-else>
              <span 
                class="text-lg text-gray-500 block transition-all duration-300"
                :class="isCollapsed ? 'truncate' : 'break-words'"
                :title="coffee.shop_name"
              >
                {{ coffee.shop_name }}
              </span>
            </div>
          </div>
        </div>

        <!-- 3) Actions (right zone) - Reduced margin -->
        <div class="flex flex-col items-center space-y-1 flex-shrink-0 mr-1">
          <button
            ref="menuButton"
            type="button"
            @click.stop="toggleMenu"
            class="p-1 text-gray-600 hover:text-black"
          >
            <EllipsisVertical class="w-6 h-6"/>
          </button>
        </div>

        <!-- menu dropdown -->
        <div
          v-if="showMenu"
          ref="menuPanel"
          class="absolute top-0 right-0 mt-10 w-40 bg-white border border-gray-200 rounded shadow-md overflow-hidden z-10"
          >
          <!-- Shop Page (available to all users) -->
          <button
            v-if="coffee.shop_url"
            type="button"
            @click="openShopPage"
            class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
          >
            <Store class="inline-block mr-2 w-4 h-4" /> Shop Page
          </button>

          <!-- Edit (disabled for guests) -->
          <button
            type="button"
            @click="enterEditMode"
            :disabled="!isLoggedIn"
            :class="[
              'block w-full text-left px-3 py-2 text-sm',
              isLoggedIn ? 'hover:bg-gray-100' : 'text-gray-500 cursor-not-allowed'
            ]"
          >
            <Pencil class="inline-block mr-2 w-4 h-4" /> Edit
          </button>

          <!-- Delete (disabled for guests) -->
          <button
            type="button"
            @click.stop="confirmDelete"
            :disabled="!isLoggedIn"
            :class="[
              'block w-full text-left px-3 py-2 text-sm text-red-600',
              isLoggedIn ? 'hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'
            ]"
          >
            <Trash2 class="inline-block mr-2 w-4 h-4" /> Delete
          </button>
        </div>

        <!-- Edit mode icon -->
        <div v-if="isEditing" class="absolute top-2 right-2">
          <Pencil class="w-5 h-5 text-blue-500" />
        </div>
      </div>

      <div v-show="!isCollapsed" class="space-y-4">
        <!-- Info Grid -->
        <div class="grid rounded-md grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 text-base border-l-4 border-gray-300 pl-3 md:pl-2">
          <div>
            <strong>Origin: </strong>
            <template v-if="isEditing">
              <input v-model="form.origin" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.origin }}</template>
          </div>
          <div>
            <strong>Region: </strong>
            <template v-if="isEditing">
              <input v-model="form.region" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.region }}</template>
          </div>
          <div>
            <strong>Altitude (m): </strong>
            <template v-if="isEditing">
              <input v-model="form.altitude_meters" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.altitude_meters }}</template>
          </div>
          <div>
            <strong>Variety: </strong>
            <template v-if="isEditing">
              <input v-model="form.botanic_variety" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.botanic_variety }}</template>
          </div>
          <div>
            <strong>Farm/Producer: </strong>
            <template v-if="isEditing">
              <input v-model="form.farm_producer" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.farm_producer }}</template>
          </div>
          <div>
            <strong>Processing: </strong>
            <template v-if="isEditing">
              <input v-model="form.processing_method" class="input" @click.stop />
            </template>
            <template v-else>{{ coffee.processing_method }}</template>
          </div>
          <div>
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

        <!-- Flavor Profile -->
        <div class="bg-blue-50 rounded-md p-4 md:p-3 border-l-4 border-blue-300">
          <h4 class="uppercase text-base font-semibold text-blue-700 mb-1">
            Flavor Profile
          </h4>
          <template v-if="isEditing">
            <textarea v-model="form.flavor" class="input w-full resize-none" rows="3" @click.stop></textarea>
          </template>
          <template v-else>
            <p class="text-base">{{ coffee.flavor || '–' }}</p>
          </template>
        </div>

        <!-- Notes -->
        <div class="bg-gray-50 rounded-md p-4 md:p-3 border-l-4 border-gray-300">
          <h4 class="uppercase text-base font-semibold text-gray-700 mb-1">
            Notes
          </h4>
          <template v-if="isEditing">
            <textarea v-model="form.notes" class="input w-full resize-none" rows="3" @click.stop></textarea>
          </template>
          <template v-else>
            <p class="text-base">{{ coffee.notes || 'No notes yet.' }}</p>
          </template>
        </div>

        <!-- Espresso Recipe -->
        <div class="recipe">
          <h4 class="recipe-title">
            Espresso Recipe
          </h4>
          <template v-if="isEditing">
            <div class="grid grid-cols-2 gap-2 text-sm" @click.stop>
              <input
                v-model.number="form.recipe_in_grams"
                type="number"
                step="0.1"
                placeholder="In (g)"
                class="input"
              />
              <input
                v-model.number="form.recipe_out_grams"
                type="number"
                step="0.1"
                placeholder="Out (g)"
                class="input"
              />
              <input
                v-model="form.recipe_time_seconds"
                placeholder="Time (s)"
                class="input"
              />
              <input
                v-model.number="form.recipe_temperature_c"
                type="number"
                step="0.1"
                placeholder="Temp (°C)"
                class="input"
              />
            </div>
          </template>
          <template v-else>
            <div class="recipe-grid">
              <!-- Shot Toggle -->
              <div 
                class="shot-toggle" 
                :data-state="shotState"
                @click.stop="toggleShotSize"
              >
                <img 
                  :src="shotIconSrc" 
                  class="shot-icon" 
                  :alt="shotState === 'single' ? 'Single Shot' : 'Double Shot'"
                />
                <div 
                  class="slide-switch" 
                  :data-state="shotState"
                >
                  <div class="thumb"></div>
                  <span class="label">Single</span>
                  <span class="label">Double</span>
                </div>
              </div>

              <!-- Ratio -->
              <div class="recipe-item">
                <div class="recipe-label">Ratio</div>
                <div class="recipe-value">{{ coffee.recipe_ratio }}</div>
              </div>

              <!-- In (g) -->
              <div class="recipe-item">
                <div class="recipe-label">In (g)</div>
                <div class="recipe-value in-val">{{ displayedIn }}</div>
              </div>

              <!-- Out (g) -->
              <div class="recipe-item">
                <div class="recipe-label">Out (g)</div>
                <div class="recipe-value out-val">{{ displayedOut }}</div>
              </div>

              <!-- Time (s) -->
              <div class="recipe-item">
                <div class="recipe-label">Time (s)</div>
                <div class="recipe-value">{{ coffee.recipe_time_seconds }}</div>
              </div>

              <!-- Temp (°C) -->
              <div class="recipe-item">
                <div class="recipe-label">Temp (°C)</div>
                <div class="recipe-value">{{ coffee.recipe_temperature_c }}</div>
              </div>
            </div>
          </template>
        </div>

        <!-- Container Section -->
        <div class="bg-purple-50 rounded-md p-4 md:p-3 border-l-4 border-purple-300">
          <h4 class="uppercase text-base font-semibold text-purple-700 mb-3">
            Container
          </h4>
          <div class="flex justify-center gap-6">
            <div class="container-option">
              <button
                @click.stop="handleContainerClick('green')"
                :disabled="!isLoggedIn"
                :class="[
                  'container-button',
                  { 
                    'assigned': props.coffee.in_green_container,
                    'clickable': isLoggedIn,
                    'disabled': !isLoggedIn
                  }
                ]"
              >
                <div 
                  class="container-circle"
                  :class="{ 'green-circle': true }"
                >
                  <img src="../assets/icons/bean_01.svg" alt="bean icon" class="bean-icon" />
                </div>
              </button>
              <span class="container-label green-label">Green</span>
            </div>

            <div class="container-option">
              <button
                @click.stop="handleContainerClick('grey')"
                :disabled="!isLoggedIn"
                :class="[
                  'container-button',
                  { 
                    'assigned': props.coffee.in_grey_container,
                    'clickable': isLoggedIn,
                    'disabled': !isLoggedIn
                  }
                ]"
              >
                <div 
                  class="container-circle"
                  :class="{ 'grey-circle': true }"
                >
                  <img src="../assets/icons/bean_01.svg" alt="bean icon" class="bean-icon" />
                </div>
              </button>
              <span class="container-label grey-label">Grey</span>
            </div>
          </div>
        </div>

        <!-- Save/Cancel edit buttons -->      
        <SaveCancelButtons
          v-if="isEditing"
          :disabled="!isFormValid"
          @save="save"
          @cancel="cancel"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '../lib/supabase'
import SaveCancelButtons from './SaveCancelButtons.vue'
import { useCoffeeForm } from '../composables/useCoffeeForm'
import { EllipsisVertical, Store, Pencil, Trash2 } from 'lucide-vue-next'
import singleShotIcon from '../assets/icons/1shot.svg'
import doubleShotIcon from '../assets/icons/2shot.svg'

// 1) Props & Emits
const props = defineProps({
  coffee: { 
    type: Object, 
    required: true, 
    default: () => ({}) 
  },
  isLoggedIn: Boolean,
  containerStatus: Object,
  initiallyExpanded: { 
    type: Boolean, 
    default: false 
  },
  forceExpandState: { 
    type: String, 
    default: null 
  },
  fetchCoffees: {
    type: Function,
    default: null
  }
})
const emit = defineEmits([
  'update-container',
  'deleted',
  'editing-changed',
  'coffee-updated',
  'cancel'
])

// 2) Local UI state
const isCollapsed = ref(!props.initiallyExpanded)
const shotState = ref('double')   // 'single' | 'double'
const isEditing = ref(false)
const showMenu = ref(false)
const menuButton = ref(null)
const menuPanel = ref(null)

// 3) Coffee form composable (only initialize when editing)
let coffeeForm = null

const getCoffeeForm = () => {
  if (!coffeeForm) {
    coffeeForm = useCoffeeForm({
      initialData: props.coffee,
      mode: 'edit',
      emit,
      onClose: () => {
        isEditing.value = false
      },
      fetchCoffees: props.fetchCoffees
    })
  }
  return coffeeForm
}

// Computed properties that conditionally use the form
const form = computed(() => isEditing.value ? getCoffeeForm().form : {})
const isFormValid = computed(() => isEditing.value ? getCoffeeForm().isFormValid : true)
const save = () => isEditing.value && getCoffeeForm().save()
const cancel = () => isEditing.value && getCoffeeForm().cancel()
const deriveShopLogo = () => isEditing.value && getCoffeeForm().deriveShopLogo()

// 4) Mode toggle
function enterEditMode() {
  isEditing.value = true
  showMenu.value = false
  isCollapsed.value = false
  // Reset the form with current coffee data
  Object.assign(getCoffeeForm().form, props.coffee)
}

function toggleShotSize() {
  shotState.value = shotState.value === 'single' ? 'double' : 'single'
}

// 5) Computed display classes / icons
const cardClasses = computed(() => {
  const base = [
    'relative m-4 p-4 rounded-xl border border-gray-200 shadow-sm text-gray-900 space-y-4 flex flex-col h-full border-l-4'
  ]
  if (props.coffee.in_green_container && props.coffee.in_grey_container) {
    base.push('bg-gradient-both border-l-blue-500')
  } else if (props.coffee.in_green_container) {
    base.push('bg-green-50 border-l-green-500')
  } else if (props.coffee.in_grey_container) {
    base.push('bg-gray-100 border-l-gray-500')
  } else {
    base.push('bg-white border-l-black')
  }
  return base
})

const shotIconSrc = computed(() =>
  shotState.value === 'single' ? singleShotIcon : doubleShotIcon
)

const displayedIn = computed(() => {
  const v = props.coffee.recipe_in_grams
  return shotState.value === 'single' ? (v/2).toFixed(1) : v
})
const displayedOut = computed(() => {
  const v = props.coffee.recipe_out_grams
  return shotState.value === 'single' ? (v/2).toFixed(1) : v
})

// 6) Container click handlers
function handleContainerClick(color) {
  if (!props.isLoggedIn) return
  const isAssigned = color === 'green'
    ? props.coffee.in_green_container
    : props.coffee.in_grey_container
  const other = props.containerStatus?.[color]

  if (!isAssigned) {
    const msg = other
      ? `Replace "${other.name}" in ${color}?`
      : `Add "${props.coffee.name}" to ${color}?`
    if (!confirm(msg)) return
    emit('update-container', { coffee: props.coffee, container: color, assign: true })
  } else {
    if (!confirm(`Remove "${props.coffee.name}" from ${color}?`)) return
    emit('update-container', { coffee: props.coffee, container: color, assign: false })
  }
}

// 7) Other handlers
async function confirmDelete() {
  showMenu.value = false
  if (!confirm(`Delete "${props.coffee.name}"?`)) return
  const { error } = await supabase.from('coffee_beans').delete().eq('id', props.coffee.id)
  if (error) alert('❌ Delete failed: ' + error.message)
  else emit('deleted')
}

function notifyLogin() {
  alert('🔒 Please log in to perform this action.')
}

function    toggleMenu() {
  showMenu.value = !showMenu.value;
}

function openShopPage() {
  showMenu.value = false
  if (props.coffee.shop_url) {
    window.open(props.coffee.shop_url, '_blank', 'noopener,noreferrer')
  }
}

function onClickOutside(e) {
  if (
    showMenu.value &&
    menuButton.value && !menuButton.value.contains(e.target) &&
    menuPanel.value && !menuPanel.value.contains(e.target)
  ) {
    showMenu.value = false
  }
}

function toggleCollapse() {
  // Don't toggle if we're in editing mode
  if (isEditing.value) return
  isCollapsed.value = !isCollapsed.value
}

// 8) Watches
watch(isEditing, now => emit('editing-changed', now))

watch(() => props.isLoggedIn, loggedIn => {
  if (!loggedIn && isEditing.value) {
    isEditing.value = false
    showMenu.value = false
  }
})

watch(() => props.initiallyExpanded, v => {
  if (v && isCollapsed.value) isCollapsed.value = false
})

watch(() => props.forceExpandState, state => {
  if (state === 'expand') isCollapsed.value = false
  else if (state === 'collapse') isCollapsed.value = true
})

// 9) Lifecycle hooks
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.input {
  @apply w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500;
}

.recipe {
  background: #fff7ed;
  padding: 20px;
  border-radius: 12px;
  border-left: 3px solid #ea580c;
}

.recipe-title {
  color: #c2410c;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.8rem;
  font-weight: 700;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.shot-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  grid-column: 1 / -1;
  order: -1;
  cursor: pointer;
}

.shot-icon {
  width: 32px;
  height: 32px;
  transition: opacity 0.3s ease;
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
  padding: 0 10px;
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
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: left 0.3s ease;
  left: 50%;
}

.slide-switch[data-state="single"] .thumb {
  left: 0;
}

.slide-switch[data-state="single"] .label:first-child {
  color: #c2410c;
  font-weight: 600;
}

.slide-switch[data-state="double"] .label:last-child {
  color: #c2410c;
  font-weight: 600;
}

.recipe-item {
  background: white;
  padding: 16px 12px;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.recipe-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recipe-label {
  font-size: 0.7rem;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.recipe-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #c2410c;
  line-height: 1.2;
}

.bg-gradient-both {
  background: linear-gradient(90deg, #dcfce7 0%, #dcfce7 25%, #ffffff 50%, #f3f4f6 75%, #f3f4f6 100%);
}

/* Container Section Styles */
.container-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.container-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: 1;
}

.container-button.clickable {
  cursor: pointer;
}

.container-button.assigned {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px #2196f3;
  border-radius: 50%;
}

.container-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.container-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.green-circle {
  background-color: #a8d5a2;
}

.grey-circle {
  background-color: #ccc;
}

.bean-icon {
  width: 28px;
  height: 28px;
  filter: brightness(0.7);
}

.container-label {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.green-label {
  color: #2b7a2b;
}

.grey-label {
  color: #666;
}

.container-button:hover:not(.disabled) .container-circle {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
</style>