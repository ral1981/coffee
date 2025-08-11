<template>
  <div class="coffee-grid">
    <div
      v-for="coffee in coffees"
      :key="coffee.id"
      class="coffee-card"
      :class="{ expanded: expandedCards.has(coffee.id) }"
      @click="$emit('card-expand', coffee.id)"
    >
      <div class="coffee-header">
        <div class="coffee-logo">
          <img v-if="coffee.shopLogo" :src="coffee.shopLogo" :alt="coffee.shop" />
        </div>
        <div class="coffee-info">
          <div class="coffee-name">{{ coffee.name }}</div>
          <div class="coffee-shop">{{ coffee.shop }}</div>
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
              loading: containerLoadingStates[`${coffee.id}-${container.id}`]
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
          <div v-if="coffee.altitude" class="detail-row">
            <span class="detail-label">Altitude (m):</span>
            <span class="detail-value">{{ coffee.altitude }}</span>
          </div>
          <div v-if="coffee.variety" class="detail-row">
            <span class="detail-label">Variety:</span>
            <span class="detail-value">{{ coffee.variety }}</span>
          </div>
          <div v-if="coffee.farmProducer" class="detail-row">
            <span class="detail-label">Farm/Producer:</span>
            <span class="detail-value">{{ coffee.farmProducer }}</span>
          </div>
          <div v-if="coffee.processing" class="detail-row">
            <span class="detail-label">Processing:</span>
            <span class="detail-value">{{ coffee.processing }}</span>
          </div>
          <div v-if="coffee.scaScore" class="detail-row">
            <span class="detail-label">SCA Score:</span>
            <span class="detail-value">{{ coffee.scaScore }}</span>
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
            <div v-if="coffee.recipe?.ratio" class="recipe-item">
              <div class="recipe-label">Ratio</div>
              <div class="recipe-value">{{ coffee.recipe.ratio }}</div>
            </div>
            <div v-if="getRecipeValue(coffee, 'inGrams')" class="recipe-item">
              <div class="recipe-label">In (g)</div>
              <div class="recipe-value">{{ getRecipeValue(coffee, 'inGrams') }}</div>
            </div>
            <div v-if="getRecipeValue(coffee, 'outGrams')" class="recipe-item">
              <div class="recipe-label">Out (g)</div>
              <div class="recipe-value">{{ getRecipeValue(coffee, 'outGrams') }}</div>
            </div>
            <div v-if="coffee.recipe?.timeSeconds" class="recipe-item">
              <div class="recipe-label">Time (s)</div>
              <div class="recipe-value">{{ coffee.recipe.timeSeconds }}</div>
            </div>
            <div v-if="coffee.recipe?.temperatureC" class="recipe-item">
              <div class="recipe-label">Temp (°C)</div>
              <div class="recipe-value">{{ coffee.recipe.temperatureC }}</div>
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

const props = defineProps({
  coffees: { type: Array, default: () => [] },
  expandedCards: { type: Set, default: () => new Set() },
  availableContainers: { type: Array, default: () => [] }
})

const emit = defineEmits(['card-expand', 'card-action', 'container-assignment-changed'])

// Track shot mode for each coffee (true = double, false = single)
const isDoubleShotMode = reactive({})

// Track loading states for container assignments
const containerLoadingStates = reactive({})

// Helper function to check if coffee has recipe data
const hasRecipeData = (coffee) => {
  return coffee.recipe && (
    coffee.recipe.ratio ||
    coffee.recipe.inGrams || 
    coffee.recipe.outGrams || 
    coffee.recipe.timeSeconds ||
    coffee.recipe.temperatureC
  )
}

// Check if a container is assigned to a coffee
const isContainerAssigned = (coffee, containerId) => {
  if (!coffee.containers || !Array.isArray(coffee.containers)) return false
  return coffee.containers.some(container => container.id === containerId)
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

// Get recipe value based on shot mode
const getRecipeValue = (coffee, field) => {
  if (!coffee.recipe || !coffee.recipe[field]) return null
  
  const originalValue = coffee.recipe[field]
  const isDouble = isDoubleShotMode[coffee.id] !== false // Default to double
  
  // Only divide In and Out values for single shots
  if (!isDouble && (field === 'inGrams' || field === 'outGrams')) {
    return Math.round(originalValue / 2)
  }
  
  return originalValue
}
</script>

<style scoped>
.coffee-grid {
  display: grid;
  gap: 1rem;
}

.coffee-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #22c55e;
  cursor: pointer;
  transition: all 0.3s ease;
}

.coffee-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.coffee-card.expanded {
  cursor: default;
}

.coffee-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.coffee-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f0f0;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coffee-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.coffee-info { 
  flex: 1; 
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
  background: #f0f0f0;
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
@media (min-width: 768px) {
  .coffee-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

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
</style>