<template>
  <div>
    <div v-if="showForm" class="relative m-4 p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-gray-900 space-y-4 flex flex-col h-full">
      <!-- Header -->
      <div class="relative flex items-start m-4">
        <!-- 1) Favicon (left zone) -->
        <div class="flex-shrink-0">
          <img
            :src="form.shop_logo || 'https://www.google.com/s2/favicons?domain=example.com'"
            alt="shop logo"
            width="48"
            height="48"
            class="rounded"
          />
        </div>

        <!-- 2) Title & Shop name (middle zone) -->
        <div class="flex-1 min-w-0 ml-4 mr-2">
          <div class="transition-all duration-300 ease-in-out">
            <!-- Coffee name input -->
            <input
              v-model="form.name"
              placeholder="Coffee Name *" 
              required 
              :class="{ 'border-red-500': !form.name }"
              class="block text-3xl font-bold leading-tight w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none mb-2"
            />
            
            <!-- Shop name input -->
            <input
              v-model="form.shop_name"
              placeholder="Shop Name *" 
              required 
              :class="{ 'border-red-500': !form.shop_name }"
              class="text-xl text-gray-500 block w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
            />

            <!-- Shop URL input -->
            <input
              v-model="form.shop_url"
              @input="deriveShopLogo"
              placeholder="Shop URL *" 
              required 
              :class="{ 'border-red-500': !validUrl(form.shop_url) }"
              class="text-lg text-gray-400 block w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>        
      </div>

      <div class="space-y-4">
        <!-- Info Grid -->
        <div class="grid rounded-md grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 text-base border-l-4 border-blue-300 pl-3 md:pl-2">
          <div>
            <strong>Origin: </strong>
            <input 
              v-model="form.origin" 
              placeholder="Origin *" 
              required 
              :class="{ 'border-red-500': !form.origin }" 
              class="input" 
            />
          </div>
          <div>
            <strong>Region: </strong>
            <input v-model="form.region" placeholder="Region" class="input" />
          </div>
          <div>
            <strong>Altitude (m): </strong>
            <input v-model="form.altitude_meters" placeholder="Altitude" class="input" />
          </div>
          <div>
            <strong>Variety: </strong>
            <input v-model="form.botanic_variety" placeholder="Variety" class="input" />
          </div>
          <div>
            <strong>Farm/Producer: </strong>
            <input v-model="form.farm_producer" placeholder="Farm/Producer" class="input" />
          </div>
          <div>
            <strong>Processing: </strong>
            <input v-model="form.processing_method" placeholder="Processing" class="input" />
          </div>
          <div>
            <strong>SCA Score: </strong>
            <input
              v-model.number="form.sca"
              type="number"
              step="0.1"
              placeholder="SCA Score"
              class="input"
            />
          </div>
        </div>

        <!-- Flavor Profile -->
        <div class="bg-blue-50 rounded-md p-4 md:p-3 border-l-4 border-blue-300">
          <h4 class="uppercase text-base font-semibold text-blue-700 mb-1">
            Flavor Profile
          </h4>
          <textarea 
            v-model="form.flavor" 
            placeholder="Describe the flavor profile..."
            rows="3"
            class="input w-full resize-none"
          ></textarea>
        </div>

        <!-- Notes -->
        <div class="bg-gray-50 rounded-md p-4 md:p-3 border-l-4 border-gray-300">
          <h4 class="uppercase text-base font-semibold text-gray-700 mb-1">
            Notes
          </h4>
          <textarea 
            v-model="form.notes" 
            placeholder="Add your notes here..."
            rows="3"
            class="input w-full resize-none"
          ></textarea>
        </div>

        <!-- Espresso Recipe -->
        <div class="bg-orange-50 rounded-md p-4 md:p-3 border-l-4 border-orange-400">
          <h4 class="uppercase text-base font-semibold text-orange-700 mb-3 md:mb-2">
            Espresso Recipe
          </h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
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
        </div>

        <!-- Containers -->
        <div class="bg-purple-50 rounded-md p-4 md:p-3 border-l-4 border-purple-300">
          <h4 class="uppercase text-base font-semibold text-purple-700 mb-3">
            Containers
          </h4>
          <div class="flex justify-center gap-6">
            <div class="container-option">
              <button
                @click="handleContainerClick('green')"
                :class="[
                  'container-button',
                  { 
                    'assigned': form.in_green_container,
                    'clickable': true
                  }
                ]"
              >
                <div class="container-circle green-circle">
                  <img src="../assets/icons/bean_01.svg" alt="bean icon" class="bean-icon" />
                </div>
              </button>
              <span class="container-label green-label">Green</span>
            </div>

            <div class="container-option">
              <button
                @click="handleContainerClick('grey')"
                :class="[
                  'container-button',
                  { 
                    'assigned': form.in_grey_container,
                    'clickable': true
                  }
                ]"
              >
                <div class="container-circle grey-circle">
                  <img src="../assets/icons/bean_01.svg" alt="bean icon" class="bean-icon" />
                </div>
              </button>
              <span class="container-label grey-label">Grey</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <SaveCancelButtons
          :disabled="!isFormValid"
          @save="save"
          @cancel="cancel"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import SaveCancelButtons from './SaveCancelButtons.vue'
import { useCoffeeForm } from '../composables/useCoffeeForm'

const props = defineProps({
  fetchCoffees: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['coffee-saved', 'cancel'])

const showForm = ref(true)
const coffees = ref([])

const fetchCoffees = async () => {
  const { data } = await supabase.from('coffee_beans').select('*')
  coffees.value = data || []
}

// Initialize composable
const { form, isFormValid, save, cancel, validUrl, deriveShopLogo } = useCoffeeForm({
  initialData: {},   
  mode: 'add', 
  emit,
  onClose: () => showForm.value = false,
  fetchCoffees: props.fetchCoffees || fetchCoffees
})

// Container click handlers
const handleContainerClick = (container) => {
  if (container === 'green') {
    const other = coffees.value.find(c => c.in_green_container)
    if (form.in_green_container) {
      // Remove from green
      if (confirm(`Remove from green container?`)) {
        form.in_green_container = false
      }
    } else {
      // Add to green
      const msg = other 
        ? `Replace "${other.name}" in green container?`
        : `Add to green container?`
      if (confirm(msg)) {
        form.in_green_container = true
      }
    }
  } else if (container === 'grey') {
    const other = coffees.value.find(c => c.in_grey_container)
    if (form.in_grey_container) {
      // Remove from grey
      if (confirm(`Remove from grey container?`)) {
        form.in_grey_container = false
      }
    } else {
      // Add to grey
      const msg = other 
        ? `Replace "${other.name}" in grey container?`
        : `Add to grey container?`
      if (confirm(msg)) {
        form.in_grey_container = true
      }
    }
  }
}

// Initialize
fetchCoffees()
</script>

<style scoped>
.input {
  @apply w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500;
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