import { ref } from 'vue'

export function useCoffeeData() {
  const coffees = ref([
    // Sample data for testing
    {
      id: 1,
      name: 'Ethiopia Sidamo',
      shop: 'Blue Bottle Coffee',
      origin: 'Ethiopia',
      container: { id: 'green', name: 'Green Container', color: '#22c55e' }
    },
    {
      id: 2,
      name: 'Guatemala Huehuetenango',
      shop: 'Stumptown Coffee',
      origin: 'Guatemala',
      container: { id: 'grey', name: 'Grey Container', color: '#6b7280' }
    },
    {
      id: 3,
      name: 'Kenya Kiambu',
      shop: 'Intelligentsia',
      origin: 'Kenya',
      container: { id: 'blue', name: 'Blue Container', color: '#3b82f6' }
    }
  ])

  const loading = ref(false)
  const loadingMore = ref(false)
  const expandedCards = ref(new Set())

  const toggleCardExpansion = (coffeeId) => {
    const newExpanded = new Set(expandedCards.value)
    if (newExpanded.has(coffeeId)) {
      newExpanded.delete(coffeeId)
    } else {
      newExpanded.add(coffeeId)
    }
    expandedCards.value = newExpanded
  }

  const fetchCoffees = async () => {
    loading.value = true
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    loading.value = false
  }

  const refreshCoffees = async () => {
    console.log('Refreshing coffees...')
    await fetchCoffees()
  }

  return {
    coffees,
    loading,
    loadingMore,
    expandedCards,
    toggleCardExpansion,
    fetchCoffees,
    refreshCoffees
  }
}