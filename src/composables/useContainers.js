// composables/useContainers.js - Dedicated Container Management
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToast } from './useToast'
import { useAuth } from './useAuth'

// GLOBAL STATE - shared across all components that use this composable
const containers = ref([])
const loading = ref(false)
const highlightedContainerId = ref(null)

// Only initialize once
let isInitialized = false

export function useContainers() {
  const { success, error, info } = useToast()
  const { user } = useAuth()
  
  const fetchContainers = async () => {
    loading.value = true
    try {
      console.log('🔄 Fetching containers from database...')
      
      // Check if user is authenticated
      if (!user.value?.id) {
        console.warn('No authenticated user, using fallback containers')
        containers.value = getFallbackContainers()
        return {
          success: false,
          error: 'User not authenticated',
          data: containers.value
        }
      }
      
      const { data, error: fetchError } = await supabase
        .from('containers')
        .select('*')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        console.warn('Database fetch failed, using fallback:', fetchError.message)
        containers.value = getFallbackContainers()
        return {
          success: false,
          error: fetchError.message,
          data: containers.value
        }
      }
      
      console.log(`✅ Fetched ${data?.length || 0} containers from database`)
      containers.value = data || []
      
      return {
        success: true,
        data: containers.value,
        error: null
      }
      
    } catch (err) {
      console.error('Error fetching containers:', err)
      containers.value = getFallbackContainers()
      
      return {
        success: false,
        error: err.message,
        data: containers.value
      }
    } finally {
      loading.value = false
    }
  }

  const addContainer = async (containerData) => {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    try {
      const { data, error: insertError } = await supabase
        .from('containers')
        .insert([{
          ...containerData,
          user_id: user.value.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) throw insertError

      console.log('✅ Container created:', data)
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error creating container:', err)
      throw new Error(err.message || 'Failed to create container')
    }
  }

  const updateContainer = async (containerId, containerData) => {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    try {
      const { data, error: updateError } = await supabase
        .from('containers')
        .update({
          ...containerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', containerId)
        .eq('user_id', user.value.id)
        .select()
        .single()

      if (updateError) throw updateError

      console.log('✅ Container updated:', data)
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error updating container:', err)
      throw new Error(err.message || 'Failed to update container')
    }
  }

  const deleteContainer = async (containerId) => {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    try {
      const { error: deleteError } = await supabase
        .from('containers')
        .delete()
        .eq('id', containerId)
        .eq('user_id', user.value.id)

      if (deleteError) throw deleteError

      console.log('✅ Container deleted:', containerId)
      return { success: true }

    } catch (err) {
      console.error('❌ Error deleting container:', err)
      throw new Error(err.message || 'Failed to delete container')
    }
  }

  const addContainerToList = (newContainer) => {
    console.log('🔥 addContainerToList called with:', newContainer)
    
    if (!newContainer || !newContainer.id) {
      console.error('❌ Invalid container data provided')
      return false
    }
    
    // Check if container already exists
    const existingIndex = containers.value.findIndex(c => c.id === newContainer.id)
    
    if (existingIndex >= 0) {
      // Update existing container
      containers.value[existingIndex] = { ...newContainer }
      console.log('✅ Updated existing container in list')
    } else {
      // Add new container to the beginning of the list
      containers.value.unshift(newContainer)
      console.log('✅ Added new container to list, total containers:', containers.value.length)
    }
    
    return true
  }

  const removeContainerFromList = (containerId) => {
    const index = containers.value.findIndex(c => c.id === containerId)
    if (index >= 0) {
      containers.value.splice(index, 1)
      console.log('✅ Removed container from list')
      return true
    }
    return false
  }

  const highlightContainer = (containerId) => {
    console.log('✨ Highlighting container:', containerId)
    highlightedContainerId.value = containerId
    
    // Auto-clear highlight after 5 seconds
    setTimeout(() => {
      if (highlightedContainerId.value === containerId) {
        highlightedContainerId.value = null
        console.log('🧹 Auto-cleared container highlight')
      }
    }, 5000)
  }

  const clearHighlight = () => {
    highlightedContainerId.value = null
  }

  // Fallback data when database is unavailable
  const getFallbackContainers = () => {
    return [
      {
        id: 'fallback-green',
        user_id: 'fallback-user',
        name: 'Green Container', 
        color: '#22c55e',
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-blue',
        user_id: 'fallback-user',
        name: 'Blue Container', 
        color: '#3b82f6',
        display_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-purple',
        user_id: 'fallback-user',
        name: 'Purple Container',
        color: '#8b5cf6',
        display_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  // Computed properties
  const totalContainers = computed(() => containers.value.length)
  
  const availableContainers = computed(() => 
    containers.value.filter(container => container.id && container.name)
  )

  const containerOptions = computed(() => 
    containers.value.map(container => ({
      id: container.id,
      name: container.name,
      color: container.color,
      label: container.name,
      value: container.id
    }))
  )

  // Preset colors for container creation
  const presetColors = [
    { hex: '#3b82f6', name: 'Blue' },
    { hex: '#10b981', name: 'Green' },
    { hex: '#8b5cf6', name: 'Purple' },
    { hex: '#f59e0b', name: 'Yellow' },
    { hex: '#ef4444', name: 'Red' },
    { hex: '#f97316', name: 'Orange' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#84cc16', name: 'Lime' },
    { hex: '#ec4899', name: 'Pink' },
    { hex: '#22c55e', name: 'Emerald' },
    { hex: '#6366f1', name: 'Indigo' },
    { hex: '#a855f7', name: 'Violet' },
    { hex: '#0ea5e9', name: 'Sky' },
    { hex: '#64748b', name: 'Slate' }
  ]

  // Color validation helper
  const isValidHexColor = (color) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color)
  }

  // Get container by ID
  const getContainerById = (id) => {
    return containers.value.find(container => container.id === id)
  }

  // Get containers by IDs
  const getContainersByIds = (ids) => {
    return containers.value.filter(container => ids.includes(container.id))
  }

  return {
    // State
    containers,
    loading,
    highlightedContainerId,
    
    // CRUD Operations
    fetchContainers,
    addContainer,
    updateContainer,
    deleteContainer,
    
    // List Management
    addContainerToList,
    removeContainerFromList,
    
    // Highlighting
    highlightContainer,
    clearHighlight,
    
    // Computed Properties
    totalContainers,
    availableContainers,
    containerOptions,
    
    // Utilities
    presetColors,
    isValidHexColor,
    getContainerById,
    getContainersByIds
  }
}