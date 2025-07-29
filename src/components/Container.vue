<template>
  <div class="bg-purple-50 rounded-md p-4 md:p-3 border-l-4 border-purple-300">
    <h4 class="uppercase text-base font-semibold text-purple-700 mb-3">
      Container{{ mode === 'form' ? 's' : '' }}
    </h4>
    <div class="flex justify-center gap-6">
      <div class="container-option">
        <button
          @click="handleContainerClick('green')"
          :class="[
            'container-button',
            { 
              'assigned': isGreenAssigned,
              'clickable': isLoggedIn || mode === 'form',
              'disabled': !isLoggedIn && mode === 'card'
            }
          ]"
        >
          <div class="container-circle green-circle">
            <img src="../assets/icons/bean_01.svg" alt="bean icon" class="bean-icon" />
          </div>
        </button>
        <span class="container-label green-label">Green</span>
      </div>

      <div class="container-option">
        <button
          @click="handleContainerClick('grey')"
          :class="[
            'container-button',
            { 
              'assigned': isGreyAssigned,
              'clickable': isLoggedIn || mode === 'form',
              'disabled': !isLoggedIn && mode === 'card'
            }
          ]"
        >
          <div class="container-circle grey-circle">
            <img src="../assets/icons/bean_01.svg" alt="bean icon" class="bean-icon" />
          </div>
        </button>
        <span class="container-label grey-label">Grey</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // For CoffeeCard mode
  coffee: Object,
  containerStatus: Object,
  isLoggedIn: { type: Boolean, default: true },
  
  // For CoffeeForm mode  
  form: Object,
  coffees: Array,
  
  // Mode: 'card' or 'form'
  mode: { 
    type: String, 
    default: 'card',
    validator: value => ['card', 'form'].includes(value)
  }
})

const emit = defineEmits(['update-container', 'form-container-change'])

// Computed properties for assigned state
const isGreenAssigned = computed(() => {
  if (props.mode === 'form') {
    return props.form?.in_green_container || false
  }
  return props.coffee?.in_green_container || false
})

const isGreyAssigned = computed(() => {
  if (props.mode === 'form') {
    return props.form?.in_grey_container || false
  }
  return props.coffee?.in_grey_container || false
})

const handleContainerClick = (container) => {
  if (props.mode === 'card') {
    handleCardContainerClick(container)
  } else {
    handleFormContainerClick(container)
  }
}

const handleCardContainerClick = (container) => {
  if (!props.isLoggedIn) {
    alert('🔒 Please log in to assign containers.')
    return
  }

  const isAssigned = container === 'green' ? isGreenAssigned.value : isGreyAssigned.value
  const other = props.containerStatus?.[container]

  if (!isAssigned) {
    const msg = other
      ? `Replace "${other.name}" in ${container}?`
      : `Add "${props.coffee.name}" to ${container}?`
    if (!confirm(msg)) return
    emit('update-container', { coffee: props.coffee, container, assign: true })
  } else {
    if (!confirm(`Remove "${props.coffee.name}" from ${container}?`)) return
    emit('update-container', { coffee: props.coffee, container, assign: false })
  }
}

const handleFormContainerClick = (container) => {
  const isCurrentlyAssigned = container === 'green' ? isGreenAssigned.value : isGreyAssigned.value
  
  if (isCurrentlyAssigned) {
    // Remove from container
    if (confirm(`Remove from ${container} container?`)) {
      emit('form-container-change', { container, assign: false })
    }
  } else {
    // Add to container - check if another coffee is using it
    const other = props.coffees?.find(c => 
      container === 'green' ? c.in_green_container : c.in_grey_container
    )
    
    const msg = other 
      ? `Replace "${other.name}" in ${container} container?`
      : `Add to ${container} container?`
      
    if (confirm(msg)) {
      emit('form-container-change', { container, assign: true })
    }
  }
}
</script>

<style scoped>
/* Container Section Styles */
.container-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.container-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: 1;
}

.container-button.clickable {
  cursor: pointer;
}

.container-button.assigned {
  transform: scale(1.05);
  border-radius: 50%;
}

.container-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  /* Don't use pointer-events: none to allow login prompts */
}

.container-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
}

.green-circle {
  background-color: #9fcc97;
  border-color: #7bb96f;
}

.grey-circle {
  background-color: #b8b8b8;
  border-color: #999999;
}

/* Active (assigned) state with glow effect */
.container-button.assigned .green-circle {
  background-color: #8bc382;
  border-color: #5ca952;
  box-shadow: 
    0 0 0 2px #5ca952,
    0 0 15px rgba(92, 169, 82, 0.6),
    0 0 25px rgba(92, 169, 82, 0.3);
}

.container-button.assigned .grey-circle {
  background-color: #a5a5a5;
  border-color: #666666;
  box-shadow: 
    0 0 0 2px #666666,
    0 0 15px rgba(102, 102, 102, 0.6),
    0 0 25px rgba(102, 102, 102, 0.3);
}

/* Icon color matching for active state */
.container-button.assigned .bean-icon {
  filter: brightness(1.5) sepia(0.3) saturate(0.8) hue-rotate(20deg);
}

.bean-icon {
  width: 28px;
  height: 28px;
  filter: brightness(0.7);
  transition: filter 0.3s ease;
}

.container-label {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.green-label {
  color: #2b7a2b;
}

.grey-label {
  color: #666;
}

.container-button:hover:not(.disabled) .container-circle {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
</style>