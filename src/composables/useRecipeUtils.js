import { ref, reactive } from 'vue'

export function useRecipeUtils() {
  
  // Track shot mode for each coffee (true = double, false = single)
  const isDoubleShotMode = reactive({})

  // Check if coffee has recipe data
  const hasRecipeData = (coffee) => {
    return coffee.recipe_in_grams ||
      coffee.recipe_out_grams ||
      coffee.recipe_time_seconds ||
      coffee.recipe_temperature_c
  }

  // Toggle between single and double shot display
  const toggleShotMode = (coffeeId, isDouble) => {
    isDoubleShotMode[coffeeId] = isDouble
  }

  // Get recipe value with single/double shot conversion
  const getRecipeValue = (coffee, field) => {
    let originalValue
    
    if (field === 'inGrams' && coffee.recipe_in_grams) {
      originalValue = coffee.recipe_in_grams
    } else if (field === 'outGrams' && coffee.recipe_out_grams) {
      originalValue = coffee.recipe_out_grams
    } else {
      return null
    }
    
    const isDouble = isDoubleShotMode[coffee.id] !== false
    
    if (!isDouble && (field === 'inGrams' || field === 'outGrams')) {
      return Math.round(originalValue / 2)
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
    isDoubleShotMode,
    
    // Recipe checks
    hasRecipeData,
    
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