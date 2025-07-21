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
              placeholder="Coffee Name"
              class="block text-3xl font-bold leading-tight w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none mb-2"
            />
            
            <!-- Shop name input -->
            <input
              v-model="form.shop_url"
              @input="deriveShopInfo"
              placeholder="Shop URL"
              class="text-xl text-gray-500 block w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <!-- 3) Actions (right zone) -->
        <div class="flex flex-col items-center space-y-1 flex-shrink-0">
          <button
            type="button"
            @click="saveCoffee"
            class="p-1 text-green-600 hover:text-green-800"
            title="Save Coffee"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </button>
          <button
            type="button"
            @click="cancelForm"
            class="p-1 text-red-600 hover:text-red-800"
            title="Cancel"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Info Grid -->
        <div class="grid rounded-md grid-cols-1 md:grid-cols-2 gap-3 md:gap-2 text-base border-l-4 border-blue-300 pl-3 md:pl-2">
          <div>
            <strong>Origin: </strong>
            <input v-model="form.origin" placeholder="Origin" class="input" />
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
        <div class="bg-green-50 rounded-md p-4 md:p-3 border-l-4 border-green-400">
          <h4 class="uppercase text-base font-semibold text-green-700 mb-2">
            Containers
          </h4>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="form.in_green_container"
                class="w-4 h-4 text-green-600"
              />
              <span class="text-sm font-medium">🟩 Green Container</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="form.in_grey_container"
                class="w-4 h-4 text-gray-600"
              />
              <span class="text-sm font-medium">⬜ Grey Container</span>
            </label>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            @click="saveCoffee"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Save Coffee
          </button>
          <button
            type="button"
            @click="cancelForm"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { data } from 'autoprefixer'
const emit = defineEmits(['coffee-saved', 'cancel'])

const showForm = ref(true)
const coffees = ref([])

const fetchCoffees = async () => {
  const { data } = await supabase.from('coffee_beans').select('*')
  coffees.value = data || []
}

fetchCoffees()

const form = ref({
  name: '',
  origin: '',
  region: '',
  altitude_meters: '',
  botanic_variety: '',
  farm_producer: '',
  processing_method: '',
  sca: null,
  shop_url: '',
  shop_name: '',
  shop_logo: '',
  in_green_container: false,
  in_grey_container: false,
  flavor: '',
  recipe_in_grams: null,
  recipe_out_grams: null,
  recipe_time_seconds: '',
  recipe_temperature_c: null,
  notes: ''
})

const deriveShopInfo = () => {
  try {
    const url = new URL(form.value.shop_url)
    form.value.shop_name = url.hostname.replace('www.', '').split('.')[0]
    form.value.shop_logo = `https://www.google.com/s2/favicons?domain=${url.hostname}`
  } catch (e) {
    console.warn('Invalid shop URL')
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    origin: '',
    region: '',
    altitude_meters: '',
    botanic_variety: '',
    farm_producer: '',
    processing_method: '',
    sca: null,
    shop_url: '',
    shop_name: '',
    shop_logo: '',
    in_green_container: false,
    in_grey_container: false,
    flavor: '',
    recipe_in_grams: null,
    recipe_out_grams: null,
    recipe_time_seconds: '',
    recipe_temperature_c: null,
    notes: ''
  }
}

const checkContainerConflict = () => {
  const conflicts = []

  if (form.value.in_green_container) {
    const other = coffees.value.find(c => c.in_green_container)
    if (other) conflicts.push({ container: 'green', coffee: other })
  }

  if (form.value.in_grey_container) {
    const other = coffees.value.find(c => c.in_grey_container)
    if (other) conflicts.push({ container: 'grey', coffee: other })
  }

  for (const { container, coffee } of conflicts) {
    const ok = confirm(
      `Container "${container}" is already used by "${coffee.name}". Replace it?`
    )
    if (!ok) return false
  }

  return true
}

const saveCoffee = async () => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    alert('❌ You must be logged in to save coffee.')
    return
  }
  
  if (!checkContainerConflict()) return

  form.value.recipe_ratio = calculateRatio()

  const { error } = await supabase.from('coffee_beans').insert({
    ...form.value,
    user_id: user.id
  }).select()

  if (error) {
    alert('❌ Failed to save coffee: ' + error.message)
  } else {
    alert('✅ Coffee saved!')
    emit('coffee-saved', data`[0]`)
    resetForm()
    showForm.value = false
    fetchCoffees()
  }
}

const cancelForm = () => {
  const confirmed = confirm("Are you sure you want to discard this coffee entry?")
  if (!confirmed) return

  resetForm()
  emit('cancel')
}

const calculateRatio = () => {
  const inGrams = parseFloat(form.value.recipe_in_grams)
  const outGrams = parseFloat(form.value.recipe_out_grams)
  if (!inGrams || !outGrams) return ''
  return (outGrams / inGrams).toFixed(2)
}
</script>

<style scoped>
.input {
  @apply w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500;
}
</style>