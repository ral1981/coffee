<template>
  <div class="coffee-grid">
    <div
      v-for="coffee in coffees"
      :key="coffee.id"
      class="coffee-card"
      :class="{
        'highlighted': isHighlighted(coffee.id),
        'expanded': expandedCards.has(coffee.id)
      }"
      @click="$emit('card-expand', coffee.id)"
    >
      <div class="coffee-header">
        <div class="coffee-logo">
          <!-- Fixed: Use LogoImage component with proper data structure -->
          <LogoImage
            :url="coffee.shops?.url || coffee.bean_url"
            :custom-logo="coffee.shops?.logo"
            :size="48"
            alt="shop logo"
            class-name="rounded-lg"
          />
        </div>
        <div class="coffee-info">
          <div class="coffee-name">{{ coffee.name }}</div>
          <!-- Fixed: Use proper shop name from relationship -->
          <div class="coffee-shop">{{ coffee.shops?.name || coffee.shop_name || 'Unknown Shop' }}</div>
        </div>
        <button class="coffee-menu" @click.stop="$emit('card-action', 'menu', coffee)">
          ⋮
        </button>
      </div>
      
      <!-- Container Tags - Interactive Assignment -->
      <div class="container-section">
        <div class="container-tags">
          <button
            v-for="container in availableContainers"
            :key="container.id"
            class="container-tag"
            :class="{ 
              active: isContainerAssigned(coffee, container.id),
              loading: containerLoadingStates[`${coffee.id}-${container.id}`],
              highlighted: isHighlighted(coffee.id)
            }"
            @click.stop="toggleContainerAssignment(coffee, container)"
            :disabled="containerLoadingStates[`${coffee.id}-${container.id}`]"
          >
            <!-- Loading spinner -->
            <div 
              v-if="containerLoadingStates[`${coffee.id}-${container.id}`]"
              class="container-spinner"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            
            <!-- Container dot -->
            <div 
              v-else
              class="container-dot" 
              :style="{ background: container.color }"
            ></div>
            
            {{ container.name }}
          </button>
        </div>
      </div>

      
      <!-- Expanded details -->
      <div v-if="expandedCards.has(coffee.id)" class="coffee-details">
        <!-- Coffee Details List -->
        <div class="details-list">
          <div v-if="coffee.origin" class="detail-row">
            <span class="detail-label">Origin:</span>
            <span class="detail-value">{{ coffee.origin }}</span>
          </div>
          <div v-if="coffee.region" class="detail-row">
            <span class="detail-label">Region:</span>
            <span class="detail-value">{{ coffee.region }}</span>
          </div>
          <div v-if="coffee.altitude || coffee.altitude_meters" class="detail-row">
            <span class="detail-label">Altitude (m):</span>
            <span class="detail-value">{{ coffee.altitude || coffee.altitude_meters }}</span>
          </div>
          <div v-if="coffee.variety || coffee.botanic_variety" class="detail-row">
            <span class="detail-label">Variety:</span>
            <span class="detail-value">{{ coffee.variety || coffee.botanic_variety }}</span>
          </div>
          <div v-if="coffee.farmProducer || coffee.farm_producer" class="detail-row">
            <span class="detail-label">Farm/Producer:</span>
            <span class="detail-value">{{ coffee.farmProducer || coffee.farm_producer }}</span>
          </div>
          <div v-if="coffee.processing || coffee.processing_method" class="detail-row">
            <span class="detail-label">Processing:</span>
            <span class="detail-value">{{ coffee.processing || coffee.processing_method }}</span>
          </div>
          <div v-if="coffee.scaScore || coffee.sca" class="detail-row">
            <span class="detail-label">SCA Score:</span>
            <span class="detail-value">{{ coffee.scaScore || coffee.sca }}</span>
          </div>
        </div>
        
        <!-- Flavor Section -->
        <div v-if="coffee.flavor" class="flavor-section">
          <div class="flavor-title">Flavor Profile</div>
          <div class="flavor-text">{{ coffee.flavor }}</div>
        </div>
        
        <!-- Recipe Section -->
        <div v-if="hasRecipeData(coffee)" class="recipe-section">
          <div class="recipe-header">
            <div class="recipe-title">Espresso Recipe</div>
            
            <!-- Single/Double Toggle -->
            <div class="shot-toggle">
              <div class="shot-icon">☕</div>
              <div class="toggle-buttons">
                <button 
                  class="toggle-btn"
                  :class="{ active: !isDoubleShotMode[coffee.id] }"
                  @click.stop="toggleShotMode(coffee.id, false)"
                >
                  Single
                </button>
                <button 
                  class="toggle-btn"
                  :class="{ active: isDoubleShotMode[coffee.id] !== false }"
                  @click.stop="toggleShotMode(coffee.id, true)"
                >
                  Double
                </button>
              </div>
            </div>
          </div>
          
          <div class="recipe-grid">
            <div v-if="getRecipeRatio(coffee)" class="recipe-item">
              <div class="recipe-label">Ratio</div>
              <div class="recipe-value">1:{{ getRecipeRatio(coffee) }}</div>
            </div>
            <div v-if="getRecipeValue(coffee, 'inGrams')" class="recipe-item">
              <div class="recipe-label">In (g)</div>
              <div class="recipe-value">{{ getRecipeValue(coffee, 'inGrams') }}</div>
            </div>
            <div v-if="getRecipeValue(coffee, 'outGrams')" class="recipe-item">
              <div class="recipe-label">Out (g)</div>
              <div class="recipe-value">{{ getRecipeValue(coffee, 'outGrams') }}</div>
            </div>
            <div v-if="getRecipeTime(coffee)" class="recipe-item">
              <div class="recipe-label">Time</div>
              <div class="recipe-value">{{ getRecipeTime(coffee) }}</div>
            </div>
            <div v-if="getRecipeTemp(coffee)" class="recipe-item">
              <div class="recipe-label">Temp (°C)</div>
              <div class="recipe-value">{{ getRecipeTemp(coffee) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Notes Section -->
        <div v-if="coffee.notes" class="notes-section">
          <div class="notes-title">Notes</div>
          <div class="notes-text">{{ coffee.notes }}</div>
        </div>
        
        <button class="collapse-btn" @click.stop="$emit('card-expand', coffee.id)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18,15 12,9 6,15"/>
          </svg>
          Collapse
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import LogoImage from '../shared/LogoImage.vue'

const props = defineProps({
  coffees: { type: Array, default: () => [] },
  expandedCards: { type: Set, default: () => new Set() },
  availableContainers: { type: Array, default: () => [] },
  highlightedCoffeeId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['card-expand', 'card-action', 'container-assignment-changed'])

// Track shot mode for each coffee (true = double, false = single)
const isDoubleShotMode = reactive({})

// Track loading states for container assignments
const containerLoadingStates = reactive({})

// Helper functions
const isHighlighted = (coffeeId) => {
  return props.highlightedCoffeeId === coffeeId
}

// Helper function to check if coffee has recipe data
const hasRecipeData = (coffee) => {
  // Check both old and new data structure formats
  return (coffee.recipe && (
    coffee.recipe.ratio ||
    coffee.recipe.inGrams || 
    coffee.recipe.outGrams || 
    coffee.recipe.timeSeconds ||
    coffee.recipe.temperatureC
  )) || (
    coffee.recipe_in_grams ||
    coffee.recipe_out_grams ||
    coffee.recipe_time_seconds ||
    coffee.recipe_temperature_c
  )
}

// Check if a container is assigned to a coffee
const isContainerAssigned = (coffee, containerId) => {
  // Check both old boolean format and new containers relationship
  if (coffee.containers && Array.isArray(coffee.containers)) {
    return coffee.containers.some(container => container.id === containerId)
  }
  
  // Fallback to old boolean format for green/grey containers
  if (containerId === 'green' || containerId === 1) {
    return coffee.in_green_container
  }
  if (containerId === 'grey' || containerId === 2) {
    return coffee.in_grey_container
  }
  
  return false
}

// Toggle container assignment
const toggleContainerAssignment = async (coffee, container) => {
  const loadingKey = `${coffee.id}-${container.id}`
  containerLoadingStates[loadingKey] = true
  
  try {
    const isAssigned = isContainerAssigned(coffee, container.id)
    
    // Emit event to parent component to handle the actual assignment
    emit('container-assignment-changed', {
      coffee,
      container,
      action: isAssigned ? 'unassign' : 'assign'
    })
    
    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
  } catch (error) {
    console.error('Failed to toggle container assignment:', error)
  } finally {
    containerLoadingStates[loadingKey] = false
  }
}

// Toggle between single/double shot
const toggleShotMode = (coffeeId, isDouble) => {
  isDoubleShotMode[coffeeId] = isDouble
}

// Get recipe value based on shot mode - support both data formats
const getRecipeValue = (coffee, field) => {
  let originalValue
  
  // Handle both old and new data structures
  if (coffee.recipe && coffee.recipe[field]) {
    originalValue = coffee.recipe[field]
  } else if (field === 'inGrams' && coffee.recipe_in_grams) {
    originalValue = coffee.recipe_in_grams
  } else if (field === 'outGrams' && coffee.recipe_out_grams) {
    originalValue = coffee.recipe_out_grams
  } else {
    return null
  }
  
  const isDouble = isDoubleShotMode[coffee.id] !== false // Default to double
  
  // Only divide In and Out values for single shots
  if (!isDouble && (field === 'inGrams' || field === 'outGrams')) {
    return Math.round(originalValue / 2)
  }
  
  return originalValue
}

// Get recipe time with proper formatting
const getRecipeTime = (coffee) => {
  let timeValue
  
  if (coffee.recipe?.timeSeconds) {
    timeValue = coffee.recipe.timeSeconds
  } else if (coffee.recipe_time_seconds) {
    timeValue = coffee.recipe_time_seconds
  } else {
    return null
  }
  
  // Format time properly
  if (typeof timeValue === 'string' && timeValue.includes(':')) {
    return timeValue
  }
  
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
  if (coffee.recipe?.temperatureC) {
    return coffee.recipe.temperatureC
  } else if (coffee.recipe_temperature_c) {
    return coffee.recipe_temperature_c
  }
  return null
}

// Calculate recipe ratio
const getRecipeRatio = (coffee) => {
  let inGrams, outGrams
  
  // Handle both data formats
  if (coffee.recipe) {
    inGrams = coffee.recipe.inGrams
    outGrams = coffee.recipe.outGrams
  } else {
    inGrams = coffee.recipe_in_grams
    outGrams = coffee.recipe_out_grams
  }
  
  if (inGrams && outGrams) {
    return (outGrams / inGrams).toFixed(2)
  }
  
  return null
}
</script>

<style scoped>
.coffee-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .coffee-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.coffee-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.coffee-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.coffee-card.expanded {
  cursor: default;
  transform: none;
}

.coffee-card.highlighted {
  animation: highlight 2s ease-in-out;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
}

@keyframes highlight {
  0%, 100% { 
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); 
  }
  25% { 
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
    transform: scale(1.02);
  }
  75% { 
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
    transform: scale(1.01);
  }
}

.coffee-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.coffee-logo {
  width: 48px;
  height: 48px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.coffee-info {
  flex: 1;
  min-width: 0;
}

.coffee-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.coffee-shop {
  color: #666;
  font-size: 1rem;
}

.coffee-menu {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.coffee-menu:hover {
  background: #f3f4f6;
}

/* Container Section */
.container-section {
  margin-bottom: 1rem;
}

.container-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.container-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 16px;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
  min-height: 32px;
}

.container-tag:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.container-tag.active {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
  color: #22c55e;
  font-weight: 500;
}

.container-tag.active:hover {
  background: rgba(34, 197, 94, 0.15);
}

.container-tag:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.container-tag.loading {
  cursor: wait;
}

.container-tag.highlighted {
  animation: container-highlight 1s ease-in-out;
}

@keyframes container-highlight {
  0%, 100% { 
    background: #f8f9fa;
  }
  50% { 
    background: rgba(34, 197, 94, 0.1);
    transform: scale(1.05);
  }
}

.container-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.container-tag.active .container-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.container-spinner {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container-spinner svg {
  animation: container-spin 1s linear infinite;
}

@keyframes container-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Expanded Details */
.coffee-details {
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
  margin-top: 1rem;
}

/* Details List - Same line layout */
.details-list {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
}

.detail-value {
  color: #666;
  font-size: 0.875rem;
  text-align: right;
  flex-shrink: 0;
}

/* Flavor Section */
.flavor-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #22c55e;
}

.flavor-title {
  font-size: 0.875rem;
  color: #22c55e;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.flavor-text {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.4;
}

/* Recipe Section */
.recipe-section {
  background: #fff7ed;
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #f97316;
  margin-bottom: 1rem;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.recipe-title {
  font-size: 0.875rem;
  color: #ea580c;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.shot-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.shot-icon {
  font-size: 1.25rem;
}

.toggle-buttons {
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
}

.toggle-btn {
  padding: 0.25rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
}

.recipe-item {
  text-align: center;
  background: white;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  border: 1px solid #fed7aa;
}

.recipe-label {
  font-size: 0.625rem;
  color: #9a3412;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.recipe-value {
  font-size: 1rem;
  font-weight: 600;
  color: #ea580c;
}

/* Notes Section */
.notes-section {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #0ea5e9;
  margin-bottom: 1rem;
}

.notes-title {
  font-size: 0.875rem;
  color: #0284c7;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.notes-text {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.4;
}

/* Collapse Button */
.collapse-btn {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.collapse-btn:hover {
  background: #e9ecef;
}

/* Responsive Design */
@media (max-width: 640px) {
  .coffee-header {
    gap: 0.75rem;
  }
  
  .coffee-logo {
    width: 40px;
    height: 40px;
  }
  
  .coffee-name {
    font-size: 1.125rem;
  }
  
  .recipe-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .recipe-grid {
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  }
  
  .toggle-buttons {
    width: 100%;
  }
  
  .toggle-btn {
    flex: 1;
    padding: 0.375rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .coffee-card {
    transition: none;
  }
  
  .coffee-card:hover {
    transform: none;
  }
  
  .coffee-card.highlighted {
    animation: none;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
  }
  
  .container-tag.highlighted {
    animation: none;
    background: rgba(34, 197, 94, 0.1);
  }
  
  .container-spinner svg {
    animation: none;
  }
}
</style>