<template>
  <main class="min-h-screen bg-gray-35 dark:bg-white dark:text-gray-900 p-6">
    <Authentication @user-changed="onUserChanged" />

    <h1 class="text-4xl font-bold mb-6">☕ Coffee Tracker</h1>

    <CoffeeForm v-if="user" />

    <FilterPanel
      :origins="uniqueOrigins"
      :shops="uniqueShops"
      :filtered-count="filteredCoffees.length"
      :total-count="totalCoffees"
      @filter-change="handleFilterChange"
    />

    <div class="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3 items-start">
      <CoffeeCard
        v-for="coffee in filteredCoffees"
        :key="coffee.id"
        :coffee="coffee"
        :isLoggedIn="!!user"
        :containerStatus="containerStatus"
        @update-container="handleContainerUpdate"
        @deleted="loadCoffees"
      />
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from './lib/supabase'
import Authentication from './components/Authentication.vue'
import CoffeeForm from './components/CoffeeForm.vue'
import FilterPanel from './components/FilterPanel.vue'
import CoffeeCard from './components/CoffeeCard.vue'

const user = ref(null)

const onUserChanged = (u) => {
  user.value = u
}

const coffees = ref([])

const loadCoffees = async () => {
  const { data, error } = await supabase
    .from('coffee_beans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error(error)
  else coffees.value = data
}

const filter = ref({ green: false, grey: false, origin: '', shop: '' })

const handleFilterChange = (newFilter) => {
  filter.value = newFilter
}

const filteredCoffees = computed(() => {
  return coffees.value.filter(coffee => {
    const containerMatch =
      (!filter.value.green || coffee.in_green_container) &&
      (!filter.value.grey || coffee.in_grey_container)

    const originMatch = !filter.value.origin || coffee.origin === filter.value.origin
    const shopMatch = !filter.value.shop || coffee.shop_name === filter.value.shop

    return containerMatch && originMatch && shopMatch
  })
})

const totalCoffees = computed(() => coffees.value.length)

const uniqueOrigins = computed(() =>
  [...new Set(coffees.value.map(c => c.origin).filter(Boolean))]
)
const uniqueShops = computed(() =>
  [...new Set(coffees.value.map(c => c.shop_name).filter(Boolean))]
)

loadCoffees()

const handleContainerUpdate = async ({ coffee, container, assign }) => {
  if (assign) {
    const conflicting = coffees.value.find(c =>
      container === 'green' ? c.in_green_container : c.in_grey_container
    )

    if (conflicting && conflicting.id !== coffee.id) {
      const confirmText = `Container "${container}" is already used by "${conflicting.name}". Replace it?`
      if (!confirm(confirmText)) return

      // 🔄 Unassign the container from the previously assigned coffee
      const unassignUpdate = container === 'green'
        ? { in_green_container: false }
        : { in_grey_container: false }

      await supabase
        .from('coffee_beans')
        .update(unassignUpdate)
        .eq('id', conflicting.id)
    }
  }

  const update = {
    in_green_container: container === 'green' ? assign : coffee.in_green_container,
    in_grey_container: container === 'grey' ? assign : coffee.in_grey_container
  }

  await supabase
    .from('coffee_beans')
    .update(update)
    .eq('id', coffee.id)

  await loadCoffees()
}
</script>

<style scoped>

</style>