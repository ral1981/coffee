<template>
  <div v-if="props.coffee">
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
            <!-- Coffee name - clickable when expanded -->
            <div class="flex items-center gap-2">
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
                class="block text-3xl font-bold leading-tight transition-all duration-300"
                :class="[
                  isCollapsed ? 'truncate' : 'break-words'
                ]"
                :title="coffee.name"
              >
                {{ coffee.name }}
              </strong>              
              <!-- External link icon - only show when expanded -->
              <div v-if="!isCollapsed && coffee.shop_url" class="flex-shrink-0">
                <a
                  v-if="coffee.shop_url && !isCollapsed"
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
            
            <span 
              class="text-xl text-gray-500 block transition-all duration-300"
              :class="isCollapsed ? 'truncate' : 'break-words'"
              :title="coffee.shop_name"
            >
              {{ coffee.shop_name }}
            </span>
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
        <div class="grid rounded-md grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 text-base md:text-sm border-l-4 border-gray-300 pl-3 md:pl-2">
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
              <input v-model="local.sca" class="input" />
            </template>
            <template v-else>{{ coffee.sca }}</template>
          </div>
        </div>

        <!-- Flavor Profile -->
        <div class="bg-blue-50 rounded-md p-4 md:p-3 border-l-4 border-blue-300">
          <h4 class="uppercase text-xs font-semibold text-blue-700 mb-1">
            Flavor Profile
          </h4>
          <template v-if="isEditing">
            <textarea v-model="local.flavor" class="input"></textarea>
          </template>
          <template v-else>
            <p class="text-sm">{{ coffee.flavor || '–' }}</p>
          </template>
        </div>

        <!-- Notes -->
        <div class="bg-gray-50 rounded-md p-4 md:p-3 border-l-4 border-gray-300">
          <h4 class="uppercase text-xs font-semibold text-gray-700 mb-1">
            Notes
          </h4>
          <template v-if="isEditing">
            <textarea v-model="local.notes" class="input"></textarea>
          </template>
          <template v-else>
            <p class="text-sm">{{ coffee.notes || 'No notes yet.' }}</p>
          </template>
        </div>

        <!-- Espresso Recipe -->
        <div class="bg-orange-50 rounded-md p-4 md:p-3 border-l-4 border-orange-400">
          <h4 class="uppercase text-sm md:text-xs font-semibold text-orange-700 mb-3 md:mb-2">
            Espresso Recipe
          </h4>
          <template v-if="isEditing">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <input
                v-model="local.recipe_in_grams"
                placeholder="In (g)"
                class="input"
              />
              <input
                v-model="local.recipe_out_grams"
                placeholder="Out (g)"
                class="input"
              />
              <input
                v-model="local.recipe_time_seconds"
                placeholder="Time (s)"
                class="input"
              />
              <input
                v-model="local.recipe_temperature_c"
                placeholder="Temp (°C)"
                class="input"
              />
            </div>
          </template>
          <template v-else>
            <div class="grid grid-cols-2 gap-3 md:gap-2">
              <!-- Ratio -->
              <div class="bg-white rounded-lg p-4 md:p-3 shadow text-center">
                <div class="text-sm md:text-xs font-medium text-gray-500">Ratio</div>
                <div class="mt-2 md:mt-1 text-2xl md:text-lg font-semibold text-orange-600">
                  {{ coffee.recipe_ratio }}
                </div>
              </div>
              <!-- In (g) -->
              <div class="bg-white rounded-lg p-4 md:p-3 shadow text-center">
                <div class="text-sm md:text-xs font-medium text-gray-500">In (g)</div>
                <div class="mt-2 md:mt-1 text-2xl md:text-lg font-semibold text-orange-600">
                  {{ displayedIn }}
                </div>
              </div>
              <!-- Out (g) -->
              <div class="bg-white rounded-lg p-4 md:p-3 shadow text-center">
                <div class="text-sm md:text-xs font-medium text-gray-500">Out (g)</div>
                <div class="mt-2 md:mt-1 text-2xl md:text-lg font-semibold text-orange-600">
                  {{ displayedOut }}
                </div>
              </div>
              <!-- Time (s) -->
              <div class="bg-white rounded-lg p-4 md:p-3 shadow text-center">
                <div class="text-sm md:text-xs font-medium text-gray-500">Time (s)</div>
                <div class="mt-2 md:mt-1 text-2xl md:text-lg font-semibold text-orange-600">
                  {{ coffee.recipe_time_seconds }}
                </div>
              </div>
              <!-- Temp (°C) -->
              <div class="bg-white rounded-lg p-4 md:p-3 shadow text-center">
                <div class="text-sm md:text-xs font-medium text-gray-500">Temp (°C)</div>
                <div class="mt-2 md:mt-1 text-2xl md:text-lg font-semibold text-orange-600">
                  {{ coffee.recipe_temperature_c }}
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Containers -->
        <div class="flex justify-center gap-4 mt-4">
          <Container
            color="green"
            :assigned="props.coffee.in_green_container"
            :activeCoffee="props.containerStatus?.green"
            :coffee="props.coffee"
            :isLoggedIn="props.isLoggedIn"
            @update-container="handleContainerUpdate"
          />
          <Container
            color="grey"
            :assigned="props.coffee.in_grey_container"
            :activeCoffee="props.containerStatus?.grey"
            :coffee="props.coffee"
            :isLoggedIn="props.isLoggedIn"
            @update-container="handleContainerUpdate"
          />
        </div>

        <!-- Save/Cancel edit buttons -->
        <div v-if="isEditing" class="mt-4 flex justify-end gap-2">
          <button
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

const props = defineProps({
  coffee: {
    type: Object,
    required: true,
    default: () => ({})
  },
  isLoggedIn: Boolean,
  containerStatus: Object
})

const emit = defineEmits(['update-container', 'deleted', 'editing-changed'])

const isCollapsed = ref(true)
const isSingleShot = ref(false)
const isEditing = ref(false)
const showMenu = ref(false)
const menuButton = ref(null)
const menuPanel  = ref(null)

const local = ref({ ...props.coffee })

const cardClasses = computed(() => [
  // common
  'relative m-4 p-4 rounded-xl border border-gray-200 shadow-sm text-gray-900 space-y-4 flex flex-col h-full border-l-4',
  // container‐specific
  props.coffee.in_green_container
    ? 'bg-green-50 border-l-green-500'
    : props.coffee.in_grey_container
      ? 'bg-gray-100 border-l-gray-500'
      : 'bg-white border-l-black'
])

const toggleShotSize = () => {
  isSingleShot.value = !isSingleShot.value
}

const displayedIn = computed(() => {
  const val = props.coffee.recipe_in_grams
  return isSingleShot.value ? (val / 2).toFixed(1) : val
})

const displayedOut = computed(() => {
  const val = props.coffee.recipe_out_grams
  return isSingleShot.value ? (val / 2).toFixed(1) : val
})

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
