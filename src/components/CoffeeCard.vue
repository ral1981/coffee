<template>
  <div v-if="props.coffee">
    <div
      class="relative m-4 p-4 pr-14 rounded-lg border border-gray-300 shadow hover:shadow-md group bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
    >

      <!-- Top-right hover icons -->
      <div
        class="absolute top-2 right-2 hidden gap-1 z-10 group-hover:flex"
        v-if="isLoggedIn && !isEditing"
      >
        <button @click="enterEditMode" class="btn text-blue-500 hover:text-blue-600">
          <Pencil class="w-6 h-6" />
        </button>
        <button @click="confirmDelete" class="btn text-red-500 hover:text-red-600">
          <Trash2 class="w-6 h-6" />
        </button>
      </div>

      <!-- Containers -->
      <div class="mt-2 flex gap-2">
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

      <!-- Header -->
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <template v-if="isEditing">
          <input
            v-model="local.name"
            placeholder="Coffee Name"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
          <input
          v-model="local.shop_url"
          placeholder="Shop URL"
          @blur="deriveShopInfo"
          class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm" />
        </template>
        <template v-else>
          <a
            :href="coffee.shop_url"
            target="_blank"
            rel="noopener noreferrer"
            style="display: flex; align-items: center; gap: 0.5rem;"
          >
            <img :src="coffee.shop_logo" alt="shop logo" width="16" height="16" />
            <strong>{{ coffee.name }}</strong>
            <span style="color: gray">({{ coffee.shop_name }})</span>
          </a>
        </template>
      </div>

      <!-- Info -->
      <p>
        <strong>Origin: </strong>
        <template v-if="isEditing">
          <input
            v-model="local.origin"
            placeholder="Origin"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.origin }}</template>
      </p>

      <p>
        <strong>Region: </strong>
        <template v-if="isEditing">
          <input
            v-model="local.region"
            placeholder="Region"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.region }}</template>
      </p>

      <p>
        <strong>Altitude (m): </strong>
        <template v-if="isEditing">
          <input
            v-model="local.altitude_meters"
            placeholder="Altitude (m)"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.altitude_meters }}</template>
      </p>

      <p>
        <strong>Botanic Variety: </strong>
        <template v-if="isEditing">
          <input
            v-model="local.buttonic_variety"
            placeholder="Botanic Variety"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.botanic_variety }}</template>
      </p>

      <p>
        <strong>Producer / Farm: </strong>
        <template v-if="isEditing">
          <input
            v-model="local.farm_producer"
            placeholder="Producer / Farm">"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.farm_producer }}</template>
      </p>

      <p>
        <strong>Processing: </strong>
        <template v-if="isEditing">
          <input
            v-model="local.processing_method"
            placeholder="Peocessing Method"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.processing_method }}</template>
      </p>

      <p>
        <strong>SCA Score: </strong>
        <template v-if="isEditing">
          <input
            v-model="local.sca"
            placeholder="SCA Score"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.sca }}</template>
      </p>

      <p>
        <strong>Flavor: </strong>
        <template v-if="isEditing">
          <input
            v-model="local.flavor"
            placeholder="Flavor notes"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>{{ coffee.flavor || '–' }}</template>
      </p>

      <!-- Recipe -->
      <div style="margin-top: 0.5rem;">
        <p>
          <strong>Recipe Ratio: </strong>
          <template v-if="isEditing">
          <input
            v-model="local.recipe_ratio"
            placeholder="Recipe Ratio"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
          </template>
          <template v-else>{{ coffee.recipe_ratio }}</template>
        </p>
        <p><strong>Espresso ({{ isSingleShot ? 'Single' : 'Double' }}):</strong></p>
        <template v-if="isEditing">
          <input
            v-model="local.recipe_in_grams"
            placeholder="In (g)"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
          →
          <input
            v-model="local.recipe_out_grams"
            placeholder="Out (g)"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
          <input
            v-model="local.recipe_time_seconds"
            placeholder="Time (s)"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
          <input
            v-model="local.recipe_temperature_c"
            placeholder="Temp (°C)"
            class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
          >
        </template>
        <template v-else>
          <p>{{ displayedIn }}g → {{ displayedOut }}g</p>
          <p v-if="coffee.recipe_time_seconds || coffee.recipe_temperature_c">
            {{ coffee.recipe_time_seconds || '⏱' }} sec at {{ coffee.recipe_temperature_c || '?' }}°C
          </p>
        </template>

        <button
          class="bg-white border border-gray-300 rounded px-2 py-1 text-sm shadow-sm hover:shadow transition"
          @click="toggleShotSize"
        >
          Toggle Shot Size
        </button>
      </div>

      <!-- Notes -->
      <div v-if="isEditing">
        <textarea
          v-model="local.notes"
          placeholder="Notes"
          class="w-full px-2 py-1 border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring focus:border-blue-300 rounded text-sm"
        ></textarea>
      </div>
      <p v-else-if="coffee.notes"><strong>Notes:</strong> {{ coffee.notes }}</p>
    
      <!-- Save/Cancel edit buttons -->
      <div v-if="isEditing" class="mt-4 flex justify-end gap-2">
        <button @click="saveChanges" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1">
          <Check class="w-8 h-8" />
        </button>
        <button @click="cancelEdit" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1">
          <X class="w-8 h-8" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import Container from './Container.vue'
import { X } from 'lucide-vue-next'

const emit = defineEmits(['update-container', 'deleted'])

const isSingleShot = ref(false)
const isEditing = ref(false)

const props = defineProps({
  coffee: {
    type: Object,
    required: true,
    default: () => ({})
  },
  isLoggedIn: Boolean,
  containerStatus: Object
})

const local = ref({ ...props.coffee })

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

const enterEditMode = () => {
  local.value = { ...props.coffee }
  isEditing.value = true
}

const cancelEdit = () => {
  if (confirm('Discard all changes?')) {
    isEditing.value = false
  }
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
  if (!confirm(`Are you sure you want to delete "${props.coffee.name}"?`)) return

  const { error } = await supabase
    .from('coffee_beans')
    .delete()
    .eq('id', props.coffee.id)

  if (error) {
    alert('❌ Failed to delete: ' + error.message)
  } else {
    emit('deleted')
  }
}
</script>

<style scoped>

</style>