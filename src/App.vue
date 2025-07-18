<template>
  <main class="min-h-screen bg-gray-35 dark:bg-white dark:text-gray-900 p-6">
    <Authentication
      @user-changed="onUserChanged"
      @logout="attemptLogout" />

    <h1 class="text-4xl font-bold mb-6">☕ Coffee Tracker</h1>

    <CoffeeForm v-if="isLoggedIn" />

    <FilterPanel
      :origins="uniqueOrigins"
      :shops="uniqueShops"
      :filtered-count="filteredCoffees.length"
      :total-count="totalCoffees"
      @filter-change="handleFilterChange"
    />

    <div class="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start">
      <CoffeeCard
        v-for="coffee in filteredCoffees"
        :key="coffee.id"
        :coffee="coffee"
        :class="{ 'new-item': coffee.id === newlyAddedId }"
        :isLoggedIn="isLoggedIn"
        :containerStatus="containerStatus"
        @editing-changed="onEditingChanged"
        @update-container="handleContainerUpdate"
        @deleted="loadCoffees"
        @saved="loadCoffees"
      />
    </div>
  </main>
  <Transition name="fade">
    <button
      v-if="showBackToTop"
      @click="scrollToTop"
      class="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      title="Back to top"
    >
      <ArrowUp class="w-6 h-6" />
    </button>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { supabase } from './lib/supabase'
import Authentication from './components/Authentication.vue'
import CoffeeForm from './components/CoffeeForm.vue'
import FilterPanel from './components/FilterPanel.vue'
import CoffeeCard from './components/CoffeeCard.vue'
import { ArrowUp } from 'lucide-vue-next'

const user = ref(null)
const coffees = ref([])
const isLoggedIn = ref(false)
const anyEditing = ref(false)
const newlyAddedId = ref(null)
const containerStatus = ref({})

async function attemptLogout() {
  if (anyEditing.value) {
    const ok = confirm(
      'You have unsaved changes. Discard them and log out?'
    )
    if (!ok) {
      // abort logout, stay logged in
      return
    }
  }
  // user confirmed or nothing was editing: proceed
  const { error } = await supabase.auth.signOut()
  if (error) {
    alert('Logout failed: ' + error.message)
  } else {
    isLoggedIn.value = false
    anyEditing.value = false 
    await loadCoffees()
  }
}

function onUserChanged(newUser) {
  user.value = newUser
  isLoggedIn.value = !!newUser

  loadCoffees()
  
  if (!newUser) {
    anyEditing.value = false
  }
}

const loadCoffees = async () => {
  const { data, error } = await supabase
    .from('coffee_beans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error(error)
  else coffees.value = data
}

const handleNewCoffee = async (newCoffee) => {
  // Add to beginning of list for immediate visibility
  coffees.value.unshift(newCoffee)
  
  // Mark as newly added
  newlyAddedId.value = newCoffee.id
  
  // Scroll to new item
  await nextTick()
  const newElement = document.querySelector(`[data-coffee-id="${newCoffee.id}"]`)
  if (newElement) {
    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  // Remove "new" highlight after 3 seconds
  setTimeout(() => {
    newlyAddedId.value = null
  }, 3000)
}

const handleCoffeeDeleted = () => {
  fetchCoffees()
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

function onEditingChanged(isNowEditing) {
  anyEditing.value = anyEditing.value || isNowEditing
}

const showBackToTop = ref(false)

const handleScroll = () => {
  // Show button after scrolling down 300px
  showBackToTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.new-item {
  animation: highlight 3s ease-in-out;
  position: relative;
}

.new-item::before {
  content: "NEW";
  position: absolute;
  top: 10px;
  right: 10px;
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10;
  animation: fade-out 3s ease-in-out forwards;
}

@keyframes highlight {
  0% { 
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
    transform: scale(1.02);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
}

@keyframes fade-out {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

.coffee-list {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}
</style>