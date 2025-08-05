import { ref, computed } from 'vue'

// Global state for tracking which menu is currently open
const openMenuId = ref(null)

export function useSharedMenuState(menuId) {
  const isOpen = computed(() => openMenuId.value === menuId)
  
  const openMenu = () => {
    openMenuId.value = menuId
  }
  
  const closeMenu = () => {
    if (openMenuId.value === menuId) {
      openMenuId.value = null
    }
  }
  
  const toggleMenu = () => {
    if (isOpen.value) {
      closeMenu()
    } else {
      openMenu()
    }
  }
  
  return {
    isOpen,
    openMenu,
    closeMenu,
    toggleMenu
  }
}