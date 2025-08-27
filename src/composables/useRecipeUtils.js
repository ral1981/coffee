import { ref, reactive } from 'vue'

export function useRecipeUtils() {
  
  // Track shot mode for each coffee (true = double, false = single)
  const doubleShotModes = reactive({})

  // Check if coffee has recipe data
  const hasRecipeData = (coffee) => {
    return coffee.recipe_in_grams ||
      coffee.recipe_out_grams ||
      coffee.recipe_time_seconds ||
      coffee.recipe_temperature_c
  }

  // Toggle between single and double shot display
  const toggleShotMode = (coffeeId, isDouble) => {
    if (isDouble === undefined) {
      // Toggle current state
      doubleShotModes[coffeeId] = !doubleShotModes[coffeeId]
    } else {
      doubleShotModes[coffeeId] = isDouble
    }
  }

  // Check if coffee is in double shot mode
  const isDoubleShotMode = (coffeeId) => {
    return doubleShotModes[coffeeId] !== false // Default to double shot
  }

  // Get recipe value with single/double shot conversion
  const getRecipeValue = (coffee, field) => {
    let originalValue
    
    // Handle all recipe field types
    switch (field) {
      case 'recipe_in_grams':
      case 'inGrams':
        originalValue = coffee.recipe_in_grams
        break
      case 'recipe_out_grams':
      case 'outGrams':
        originalValue = coffee.recipe_out_grams
        break
      case 'recipe_time_seconds':
      case 'timeSeconds':
        return getRecipeTime(coffee)
      case 'recipe_temperature_c':
      case 'temperatureC':
        return coffee.recipe_temperature_c
      default:
        return null
    }
    
    // Return null if no value
    if (!originalValue) return null
    
    // Apply double/single shot conversion only for weight values
    if (field.includes('grams') || field === 'inGrams' || field === 'outGrams') {
      const isDouble = isDoubleShotMode(coffee.id) // Use the function
      
      if (!isDouble) {
        return Math.round(originalValue / 2)
      }
    }
    
    return originalValue
  }

  // Format recipe time for display
  const getRecipeTime = (coffee) => {
    let timeValue = coffee.recipe_time_seconds
    if (!timeValue) return null
    
    // If already formatted (contains colon), return as is
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      return timeValue
    }
    
    // Convert seconds to formatted string
    const seconds = parseInt(timeValue)
    if (isNaN(seconds)) return null
    
    if (seconds < 60) {
      return `${seconds}s`
    }
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Get recipe temperature
  const getRecipeTemp = (coffee) => {
    return coffee.recipe_temperature_c || null
  }

  // Calculate recipe ratio
  const getRecipeRatio = (coffee) => {
    const inGrams = coffee.recipe_in_grams
    const outGrams = coffee.recipe_out_grams
    
    if (inGrams && outGrams && inGrams > 0) {
      return (outGrams / inGrams).toFixed(1)
    }
    
    return null
  }

  // Calculate ratio from form values
  const calculateRatio = (inGrams, outGrams) => {
    if (inGrams && outGrams && inGrams > 0) {
      return (outGrams / inGrams).toFixed(1)
    }
    return null
  }

  // Parse time string to seconds (for form input)
  const parseTimeToSeconds = (timeString) => {
    if (!timeString) return null
    
    // If it's already a number, return it
    if (typeof timeString === 'number') return timeString
    
    const str = timeString.toString().trim()
    
    // Handle formats like "28s", "30", "2:30"
    if (str.includes(':')) {
      const [minutes, seconds] = str.split(':').map(Number)
      return (minutes * 60) + seconds
    }
    
    // Remove 's' suffix if present
    const cleaned = str.replace(/s$/i, '')
    const parsed = parseInt(cleaned)
    
    return isNaN(parsed) ? null : parsed
  }

  // Format seconds for form display
  const formatTimeForForm = (seconds) => {
    if (!seconds) return ''
    
    if (seconds < 60) {
      return `${seconds}s`
    }
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return {
    // State
    doubleShotModes,
    
    // Recipe checks
    hasRecipeData,
    isDoubleShotMode,
    
    // Display utilities
    toggleShotMode,
    getRecipeValue,
    getRecipeTime,
    getRecipeTemp,
    getRecipeRatio,
    
    // Form utilities
    calculateRatio,
    parseTimeToSeconds,
    formatTimeForForm
  }
}