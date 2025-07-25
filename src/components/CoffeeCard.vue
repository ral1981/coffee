<template>
  <div v-if="props.coffee" :data-coffee-id="props.coffee.id">
    <div :class="cardClasses">
      <!-- Header -->
      <div class="relative flex items-start m-4">
        <!-- 1) Favicon (left zone) - No link when collapsed -->
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
                  v-model="local.name"
                  type="text"
                  class="text-2xl font-bold leading-tight w-full border border-gray-300 rounded px-2 py-1"
                  :placeholder="coffee.name"
                />
              </template>
              <template v-else>
                <a
                  v-if="coffee.shop_url && !isCollapsed"
                  :href="coffee.shop_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block text-3xl font-bold leading-tight transition-all duration-300"
                  :class="[
                    isCollapsed ? 'truncate' : 'break-words',
                    !isCollapsed && coffee.shop_url ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''
                  ]"
                  :title="coffee.name"
                >
                  {{ coffee.name }}
                </a>
                <strong
                  v-else
                  class="block text-2xl font-bold leading-tight transition-all duration-300"
                  :class="[
                    isCollapsed ? 'truncate' : 'break-words'
                  ]"
                  :title="coffee.name"
                >
                  {{ coffee.name }}
                </strong>
              </template>

              <!-- External link icon -->
              <div v-if="!isCollapsed && coffee.shop_url" class="flex-shrink-0">
                <a
                  :href="coffee.shop_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-shrink-0"
                  :title="`Visit ${coffee.shop_name}`"
                >
                  <ExternalLink
                    class="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-pointer"
                  />
                </a>
              </div>
            </div>

            <!-- Shop name -->
            <div>
              <template v-if="isEditing">
                <input
                  v-model="local.shop_name"
                  type="text"
                  class="text-lg text-gray-500 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                  :placeholder="coffee.shop_name"
                />
              </template>
              <template v-else>
                <span 
                  class="text-lg text-gray-500 block transition-all duration-300"
                  :class="isCollapsed ? 'truncate' : 'break-words'"
                  :title="coffee.shop_name"
                >
                  {{ coffee.shop_name }}
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- 3) Actions (right zone) -->
        <div class="flex flex-col items-center space-y-1 flex-shrink-0">
          <button
            ref="menuButton"
            type="button"
            @click="toggleMenu"
            :class="isLoggedIn ? 'text-gray-600 hover:text-black' : 'text-gray-300 cursor-not-allowed'"
            class="p-1"
          >
            <EllipsisVertical class="w-6 h-6"/>
          </button>
          <button
            type="button"
            @click="toggleCollapse"
            class="p-1 text-gray-500 hover:text-gray-700"
          >
            <ChevronDown v-if="isCollapsed" class="w-6 h-6"/>
            <ChevronUp   v-else         class="w-6 h-6"/>
          </button>
        </div>

        <!-- menu dropdown -->
        <div
          v-if="showMenu"
          ref="menuPanel"
          class="absolute top-0 right-0 mt-10 w-32 bg-white border border-gray-200 rounded shadow-md overflow-hidden z-10"
        >
          <template v-if="isLoggedIn">
            <button type="button" @click="enterEditMode" class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">✏️ Edit</button>
            <button type="button" @click.stop="confirmDelete" class="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-red-600">🗑 Delete</button>
          </template>
          <template v-else>
            <button
              @click="notifyLogin"
              class="block w-full text-left px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            >
              🔒 Login required
            </button>
          </template>
        </div>
      </div>

      <div v-show="!isCollapsed" class="space-y-4">
        <!-- Info Grid -->
        <div class="grid rounded-md grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 text-base border-l-4 border-gray-300 pl-3 md:pl-2">
          <div>
            <strong>Origin: </strong>
            <template v-if="isEditing">
              <input v-model="local.origin" class="input" />
            </template>
            <template v-else>{{ coffee.origin }}</template>
          </div>
          <div>
            <strong>Region: </strong>
            <template v-if="isEditing">
              <input v-model="local.region" class="input" />
            </template>
            <template v-else>{{ coffee.region }}</template>
          </div>
          <div>
            <strong>Altitude (m): </strong>
            <template v-if="isEditing">
              <input v-model="local.altitude_meters" class="input" />
            </template>
            <template v-else>{{ coffee.altitude_meters }}</template>
          </div>
          <div>
            <strong>Variety: </strong>
            <template v-if="isEditing">
              <input v-model="local.botanic_variety" class="input" />
            </template>
            <template v-else>{{ coffee.botanic_variety }}</template>
          </div>
          <div>
            <strong>Farm/Producer: </strong>
            <template v-if="isEditing">
              <input v-model="local.farm_producer" class="input" />
            </template>
            <template v-else>{{ coffee.farm_producer }}</template>
          </div>
          <div>
            <strong>Processing: </strong>
            <template v-if="isEditing">
              <input v-model="local.processing_method" class="input" />
            </template>
            <template v-else>{{ coffee.processing_method }}</template>
          </div>
          <div>
            <strong>SCA Score: </strong>
            <template v-if="isEditing">
              <input v-model.number="local.sca"
                type="number"
                step="0.1"
                placeholder="SCA Score"
                class="input"
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
            <textarea v-model="local.flavor" class="input"></textarea>
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
            <textarea v-model="local.notes" class="input"></textarea>
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
            <div class="grid grid-cols-2 gap-2 text-sm">
              <input
                v-model.number="local.recipe_in_grams"
                type="number"
                step="0.1"
                placeholder="In (g)"
                class="input"
              />
              <input
                v-model.number="local.recipe_out_grams"
                type="number"
                step="0.1"
                placeholder="Out (g)"
                class="input"
              />
              <input
                v-model="local.recipe_time_seconds"
                placeholder="Time (s)"
                class="input"
              />
              <input
                v-model.number="local.recipe_temperature_c"
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
                @click="toggleShotSize"
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
                @click="handleContainerClick('green')"
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
                @click="handleContainerClick('grey')"
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
        <div v-if="isEditing" class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            @click="saveChanges"
            class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1"
          >
            <Check class="w-8 h-8" />
          </button>
          <button
            @click="cancelEdit"
            class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1"
          >
            <X class="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { supabase } from '../lib/supabase'
import Container from './Container.vue'
import { Pencil, Trash2, Check, X, ChevronDown, ChevronUp, EllipsisVertical, ExternalLink } from 'lucide-vue-next'
import singleShotIcon from '../assets/icons/1shot.svg'
import doubleShotIcon from '../assets/icons/2shot.svg'

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
    default: null // 'expand', 'collapse', or null
  }
})

const emit = defineEmits(['update-container', 'deleted', 'editing-changed', 'saved'])

const isCollapsed = ref(!props.initiallyExpanded)
const shotState = ref('double') // 'single' or 'double'
const isEditing = ref(false)
const showMenu = ref(false)
const menuButton = ref(null)
const menuPanel  = ref(null)

const local = ref({ ...props.coffee })

const cardClasses = computed(() => {
  const baseClasses = [
    'relative m-4 p-4 rounded-xl border border-gray-200 shadow-sm text-gray-900 space-y-4 flex flex-col h-full border-l-4'
  ]
  
  // Determine background based on container assignments
  if (props.coffee.in_green_container && props.coffee.in_grey_container) {
    // Both containers assigned - gradient background
    baseClasses.push('bg-gradient-both border-l-blue-500')
  } else if (props.coffee.in_green_container) {
    // Only green container assigned
    baseClasses.push('bg-green-50 border-l-green-500')
  } else if (props.coffee.in_grey_container) {
    // Only grey container assigned  
    baseClasses.push('bg-gray-100 border-l-gray-500')
  } else {
    // No containers assigned
    baseClasses.push('bg-white border-l-black')
  }
  
  return baseClasses
})

const shotIconSrc = computed(() => {
  return shotState.value === 'single' ? singleShotIcon : doubleShotIcon
})

const toggleShotSize = () => {
  shotState.value = shotState.value === 'single' ? 'double' : 'single'
}

const displayedIn = computed(() => {
  const val = props.coffee.recipe_in_grams
  return shotState.value === 'single' ? (val / 2).toFixed(1) : val
})

const displayedOut = computed(() => {
  const val = props.coffee.recipe_out_grams
  return shotState.value === 'single' ? (val / 2).toFixed(1) : val
})

const handleContainerClick = (color) => {
  if (!props.isLoggedIn) return;

  const isAssigned = color === 'green' ? props.coffee.in_green_container : props.coffee.in_grey_container;
  const otherCoffee = props.containerStatus?.[color];

  if (!isAssigned) {
    if (otherCoffee) {
      const msg = `Container "${color}" is already used by "${otherCoffee.name}". Replace it?`;
      if (!confirm(msg)) return;
    } else {
      const msg = `Add "${props.coffee.name}" to "${color}" container?`;
      if (!confirm(msg)) return;
    }

    emit('update-container', {
      coffee: props.coffee,
      container: color,
      assign: true
    });
  } else {
    const msg = `Remove "${props.coffee.name}" from "${color}" container?`;
    if (!confirm(msg)) return;

    emit('update-container', {
      coffee: props.coffee,
      container: color,
      assign: false
    });
  }
}

const handleContainerUpdate = (payload) => {
  emit('update-container', payload)
}

watch(isEditing, (now) => {
  emit('editing-changed', now)
})

watch(() => props.isLoggedIn, (newLoggedIn) => {
  // If user logged out while editing, exit edit mode
  if (!newLoggedIn && isEditing.value) {
    isEditing.value = false
    showMenu.value = false
  }
})

// Optional: Watch for changes to initiallyExpanded prop
watch(() => props.initiallyExpanded, (newValue) => {
  if (newValue && isCollapsed.value) {
    isCollapsed.value = false
  }
})

watch(() => props.forceExpandState, (newState) => {
  if (newState === 'expand') {
    isCollapsed.value = false
  } else if (newState === 'collapse') {
    isCollapsed.value = true
  }
})

function enterEditMode() {
  isEditing.value = true
  local.value = { ...props.coffee }
  isEditing.value = true
  showMenu.value = false
  isCollapsed.value = false
}

const saveChanges = async () => {
  const { error } = await supabase
    .from('coffee_beans')
    .update({ ...local.value })
    .eq('id', props.coffee.id)

  if (error) {
    alert('❌ Failed to save changes: ' + error.message)
  } else {
    alert('✅ Changes saved!')
    isEditing.value = false
    emit('saved')
  }
}

const deriveShopInfo = () => {
  try {
    const url = new URL(local.value.shop_url)
    local.value.shop_name = url.hostname.replace('www.', '').split('.')[0]
    local.value.shop_logo = `https://www.google.com/s2/favicons?domain=${url.hostname}`
  } catch (e) {
    console.warn('Invalid URL')
  }
}

const confirmDelete = async () => {
  showMenu.value = false
  const ok = confirm(`Delete "${props.coffee.name}"?`)
  if (!ok) return
  const { error } = await supabase.from('coffee_beans').delete().eq('id', props.coffee.id)
  if (error) alert('❌ Delete failed: ' + error.message)
  else emit('deleted')
}

const notifyLogin = () => { alert('Please log in to edit or delete.')
}

function toggleMenu () {
  if (!props.isLoggedIn) {
    alert('You must be logged in to perform this action.')
    return
  }
  showMenu.value = !showMenu.value
}

function onClickOutside(e) {
  // if menu is open, and click is not in button or panel, close it
  if (
    showMenu.value &&
    menuButton.value  && !menuButton.value.contains(e.target) &&
    menuPanel.value   && !menuPanel.value.contains(e.target)
  ) {
    showMenu.value = false
  }
}

function cancelEdit() {
   if (confirm('Discard all changes?')) {
     isEditing.value = false
   }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
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
  background: linear-gradient(135deg, #dcfce7 0%, #dcfce7 45%, #e8f4e8 50%, #f3f4f6 55%, #f3f4f6 100%);
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