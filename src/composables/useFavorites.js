// composables/useFavorites.js
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'
import { useAuth } from './useAuth'

// Global state for favorites
const userFavorites = ref(new Map()) // Map of coffee_id -> favorite_record
const loading = ref(false)

export function useFavorites() {
  const { success, error } = useToast()
  const { user } = useAuth()

  // Computed properties
  const favoriteIds = computed(() => Array.from(userFavorites.value.keys()))
  const favoritesCount = computed(() => userFavorites.value.size)
  
  // Check if a coffee is favorited
  const isFavorited = (coffeeId) => {
    return userFavorites.value.has(String(coffeeId))
  }

  // Get favorite record for a coffee
  const getFavoriteRecord = (coffeeId) => {
    return userFavorites.value.get(String(coffeeId))
  }

  // Fetch user's favorites from database
  const fetchFavorites = async () => {
    if (!user.value?.id) {
      console.warn('No authenticated user for fetching favorites')
      return
    }

    loading.value = true
    try {
      const { data, error: fetchError } = await supabase
        .from('user_coffee_favorites')
        .select(`
          id,
          coffee_id,
          favorited_at,
          notes,
          coffee_beans!inner (
            id,
            name,
            shop_id,
            shops (
              id,
              name,
              url,
              logo
            )
          )
        `)
        .eq('user_id', user.value.id)
        .order('favorited_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Update the favorites map
      userFavorites.value.clear()
      if (data) {
        data.forEach(favorite => {
          userFavorites.value.set(String(favorite.coffee_id), {
            id: favorite.id,
            coffeeId: favorite.coffee_id,
            favoritedAt: favorite.favorited_at,
            notes: favorite.notes,
            coffee: favorite.coffee_beans
          })
        })
      }

      console.log(`✅ Loaded ${data?.length || 0} favorites`)
      return { success: true, data }

    } catch (err) {
      console.error('Error fetching favorites:', err)
      error('Failed to load favorites', err.message)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Add coffee to favorites
  const addToFavorites = async (coffeeId, notes = null) => {
    if (!user.value?.id) {
      error('Authentication required', 'Please log in to add favorites')
      return { success: false, error: 'Not authenticated' }
    }

    if (isFavorited(coffeeId)) {
      console.log('Coffee already favorited')
      return { success: true, alreadyFavorited: true }
    }

    try {
      const { data, error: insertError } = await supabase
        .from('user_coffee_favorites')
        .insert({
          user_id: user.value.id,
          coffee_id: coffeeId,
          notes: notes
        })
        .select(`
          id,
          coffee_id,
          favorited_at,
          notes
        `)
        .single()

      if (insertError) {
        throw insertError
      }

      // Update local state
      userFavorites.value.set(String(coffeeId), {
        id: data.id,
        coffeeId: data.coffee_id,
        favoritedAt: data.favorited_at,
        notes: data.notes
      })

      success('Added to Favorites', 'Coffee has been added to your favorites')
      return { success: true, data }

    } catch (err) {
      console.error('Error adding to favorites:', err)
      if (err.code === '23505') { // Unique constraint violation
        error('Already Favorited', 'This coffee is already in your favorites')
      } else {
        error('Failed to add favorite', err.message)
      }
      return { success: false, error: err.message }
    }
  }

  // Remove coffee from favorites
  const removeFromFavorites = async (coffeeId) => {
    if (!user.value?.id) {
      error('Authentication required', 'Please log in to manage favorites')
      return { success: false, error: 'Not authenticated' }
    }

    const favoriteRecord = getFavoriteRecord(coffeeId)
    if (!favoriteRecord) {
      console.log('Coffee not in favorites')
      return { success: true, notFavorited: true }
    }

    try {
      const { error: deleteError } = await supabase
        .from('user_coffee_favorites')
        .delete()
        .eq('id', favoriteRecord.id)
        .eq('user_id', user.value.id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      userFavorites.value.delete(String(coffeeId))

      success('Removed from Favorites', 'Coffee has been removed from your favorites')
      return { success: true }

    } catch (err) {
      console.error('Error removing from favorites:', err)
      error('Failed to remove favorite', err.message)
      return { success: false, error: err.message }
    }
  }

  // Toggle favorite status
  const toggleFavorite = async (coffeeId, notes = null) => {
    if (isFavorited(coffeeId)) {
      return await removeFromFavorites(coffeeId)
    } else {
      return await addToFavorites(coffeeId, notes)
    }
  }

  // Update favorite notes
  const updateFavoriteNotes = async (coffeeId, notes) => {
    if (!user.value?.id) {
      error('Authentication required', 'Please log in to update favorites')
      return { success: false, error: 'Not authenticated' }
    }

    const favoriteRecord = getFavoriteRecord(coffeeId)
    if (!favoriteRecord) {
      error('Not favorited', 'This coffee is not in your favorites')
      return { success: false, error: 'Not favorited' }
    }

    try {
      const { data, error: updateError } = await supabase
        .from('user_coffee_favorites')
        .update({ notes })
        .eq('id', favoriteRecord.id)
        .eq('user_id', user.value.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update local state
      const updatedRecord = { ...favoriteRecord, notes }
      userFavorites.value.set(String(coffeeId), updatedRecord)

      success('Notes Updated', 'Favorite notes have been updated')
      return { success: true, data }

    } catch (err) {
      console.error('Error updating favorite notes:', err)
      error('Failed to update notes', err.message)
      return { success: false, error: err.message }
    }
  }

  // Clear all favorites (for user logout, etc.)
  const clearFavorites = () => {
    userFavorites.value.clear()
  }

  return {
    // State
    userFavorites,
    loading,
    
    // Computed
    favoriteIds,
    favoritesCount,
    
    // Query methods
    isFavorited,
    getFavoriteRecord,
    
    // CRUD operations
    fetchFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    updateFavoriteNotes,
    
    // Utility
    clearFavorites
  }
}