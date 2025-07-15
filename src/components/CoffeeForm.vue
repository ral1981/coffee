<template>
  <div>
    <button v-if="!showForm" @click="showForm = true">➕ Add Coffee</button>

      <div
        v-if="showForm"
        class="border-2 border-dashed border-gray-400 p-4 m-4 rounded-lg bg-white dark:bg-gray-100"
      >

      <div class="flex gap-2 mb-2 items-center">
        <img :src="form.shop_logo" alt="shop" width="16" height="16" />
        <input
          v-model="form.name"
          placeholder="Coffee Name"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <input
          v-model="form.shop_url"
          placeholder="SShop URL"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

        <input
          v-model="form.origin"
          placeholder="Origin"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <input
          v-model="form.flavor"
          placeholder="Flavor"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />

      <div class="my-2">
        <strong>Containers:</strong>
        <div class="flex gap-4 mt-1">
          <label class="flex items-center gap-1">
            <input type="checkbox" v-model="form.in_green_container" />
            🟩 Green
          </label>
          <label class="flex items-center gap-1">
            <input type="checkbox" v-model="form.in_grey_container" />
            ⬜ Grey
          </label>
        </div>
      </div>

      <div class="my-2">
        <strong>Recipe:</strong>
        <div class="flex flex-wrap items-center gap-2 mt-1">
          <input type="number" step="0.1" v-model.number="form.recipe_in_grams" placeholder="In (g)" class="input" />
          <span>→</span>
          <input type="number" step="0.1" v-model.number="form.recipe_out_grams" placeholder="Out (g)" class="input" />
          <input type="text" v-model="form.recipe_time_seconds" placeholder="Time (s)" class="input" />
          <input type="number" v-model="form.recipe_temperature_c" placeholder="Temp (°C)" class="input" />
        </div>
      </div>

      <textarea
        v-model="form.notes"
        placeholder="Notes"
        rows="3"
        class="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
      />

      <div class="mt-4 flex gap-2">
        <button
          class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          @click="saveCoffee"
        >💾 Save Coffee</button>
        <button
          class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          @click="cancelForm"
        >❌ Cancel</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const showForm = ref(false)

const coffees = ref([])

const fetchCoffees = async () => {
  const { data } = await supabase.from('coffee_beans').select('*')
  coffees.value = data || []
}

fetchCoffees()

const form = ref({
  name: '',
  origin: '',
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
  })

  if (error) {
    alert('❌ Failed to save coffee: ' + error.message)
  } else {
    alert('✅ Coffee saved!')
    resetForm()
    showForm.value = false
    fetchCoffees()
  }
}

const cancelForm = () => {
  const confirmed = confirm("Are you sure you want to discard this coffee entry?")
  if (!confirmed) return

  resetForm()
  showForm.value = false
}

const calculateRatio = () => {
  const inGrams = parseFloat(form.value.recipe_in_grams)
  const outGrams = parseFloat(form.value.recipe_out_grams)
  if (!inGrams || !outGrams) return ''
  return (outGrams / inGrams).toFixed(2)
}
</script>

<style scoped>

</style>