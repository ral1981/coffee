<template>
  <header class="header">
    <div class="header-content">
      <!-- Back Button -->
      <button 
        class="back-btn"
        @click="handleBack"
        :class="{ 'hidden': !showBackButton }"
        aria-label="Go back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Header Title -->
      <h1 class="header-title">{{ title }}</h1>

      <!-- Profile Button -->
      <button 
        v-if="showProfileButton"
        class="profile-btn"
        @click="handleProfile"
        :aria-label="`Open profile for ${displayInitial}`"
      >
        <span class="profile-initial">{{ displayInitial }}</span>
      </button>
      
      <!-- Login Button (when not authenticated) -->
      <button
        v-else
        class="login-btn"
        @click="handleProfile"
        aria-label="Login"
      >
        Login
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Coffee Tracker'
  },
  showBackButton: {
    type: Boolean,
    default: true
  },
  userInitial: {
    type: String,
    default: null // Will use auth initials if not provided
  }
})

// Emits
const emit = defineEmits(['profile-click', 'back-click'])

const route = useRoute()
const { userInitials, isLoggedIn, initializing } = useAuth()

// Computed properties
const isRootRoute = computed(() => {
  const rootRoutes = ['/', '/coffee', '/containers', '/shops']
  return rootRoutes.includes(route.path)
})

// Auto-hide back button on root routes if not explicitly set
const showBackButton = computed(() => {
  if (props.showBackButton !== undefined) {
    return props.showBackButton && !isRootRoute.value
  }
  return !isRootRoute.value
})

// Use provided initial or fall back to auth initials
const displayInitial = computed(() => {
  if (props.userInitial) return props.userInitial
  if (userInitials.value) return userInitials.value
  return 'R' // Final fallback
})

// Show profile button if logged in or still initializing
const showProfileButton = computed(() => {
  return isLoggedIn.value || initializing.value
})

// Event handlers
const handleBack = () => {
  emit('back-click')
}

const handleProfile = () => {
  emit('profile-click')
}
</script>

<style scoped>
/* CSS Custom Properties for theming */
.header {
  background: var(--header-background, #ffffff);
  padding: var(--header-padding, 1rem);
  box-shadow: var(--header-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  position: sticky;
  top: 0;
  z-index: var(--header-z-index, 100);
  border-bottom: 1px solid var(--border-light, #f0f0f0);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--max-content-width, 1200px);
  margin: 0 auto;
  height: var(--header-height, 60px);
}

/* Back Button */
.back-btn {
  background: var(--button-secondary-bg, #f0f0f0);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--button-secondary-color, #666);
}

.back-btn:hover {
  background: var(--button-secondary-hover, #e0e0e0);
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(-2px) scale(0.95);
}

.back-btn.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Header Title */
.header-title {
  font-size: var(--header-title-size, 1.5rem);
  font-weight: var(--header-title-weight, 600);
  color: var(--text-primary, #333);
  margin: 0;
  text-align: center;
  flex: 1;
  
  /* Ensure title doesn't overflow */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 1rem;
}

/* Profile Button */
.profile-btn {
  background: var(--primary-green, #22c55e);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.profile-btn:hover {
  background: var(--primary-green-hover, #16a34a);
  transform: scale(1.05);
}

.profile-btn:active {
  transform: scale(0.95);
}

.profile-initial {
  font-size: 1rem;
  line-height: 1;
  user-select: none;
}

/* Login Button */
.login-btn {
  background: transparent;
  border: 2px solid var(--primary-green, #22c55e);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  color: var(--primary-green, #22c55e);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.login-btn:hover {
  background: var(--primary-green, #22c55e);
  color: white;
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0);
}

/* Focus states for accessibility */
.back-btn:focus-visible,
.profile-btn:focus-visible {
  outline: 2px solid var(--focus-color, #22c55e);
  outline-offset: 2px;
}

/* Responsive Design */
@media (max-width: 640px) {
  .header {
    padding: var(--header-padding-mobile, 0.75rem 1rem);
  }
  
  .header-content {
    height: var(--header-height-mobile, 56px);
  }
  
  .header-title {
    font-size: var(--header-title-size-mobile, 1.25rem);
    padding: 0 0.75rem;
  }
  
  .back-btn,
  .profile-btn {
    width: 36px;
    height: 36px;
  }
  
  .profile-initial {
    font-size: 0.875rem;
  }
}

@media (min-width: 768px) {
  .header-content {
    padding: 0 2rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .header {
    background: var(--header-background-dark, #1f2937);
    border-bottom-color: var(--border-dark, #374151);
  }
  
  .header-title {
    color: var(--text-primary-dark, #f9fafb);
  }
  
  .back-btn {
    background: var(--button-secondary-bg-dark, #374151);
    color: var(--button-secondary-color-dark, #d1d5db);
  }
  
  .back-btn:hover {
    background: var(--button-secondary-hover-dark, #4b5563);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .header {
    border-bottom: 2px solid;
  }
  
  .back-btn,
  .profile-btn {
    border: 2px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .back-btn,
  .profile-btn {
    transition: none;
  }
  
  .back-btn:hover,
  .profile-btn:hover {
    transform: none;
  }
}
</style>