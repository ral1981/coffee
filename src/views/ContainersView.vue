<template>
  <div class="containers-view">
    <!-- Results Counter -->
    <div class="results-counter">
      <span class="counter-text">
        <strong>{{ containers.length }}</strong> Containers Available
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
      <p class="loading-text">Loading containers...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="containers.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <Package :size="48" />
      </div>
      <h3 class="empty-state-title">No containers found</h3>
      <p class="empty-state-description">
        Container data will be loaded from your coffee database.
      </p>
    </div>

    <!-- Containers Grid -->
    <div v-else class="containers-grid">
      <div
        v-for="container in containers"
        :key="container.id"
        class="container-card"
        :style="{ borderLeftColor: container.color }"
      >
        <div class="container-header">
          <div class="container-icon">
            <div 
              class="container-dot"
              :style="{ background: container.color }"
            ></div>
          </div>
          <div class="container-info">
            <h3 class="container-name">{{ container.name }}</h3>
            <p class="container-description">
              Storage container for coffee beans
            </p>
          </div>
        </div>

        <div class="container-stats">
          <div class="stat-item">
            <div class="stat-label">Created</div>
            <div class="stat-value">{{ formatDate(container.created_at) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Order</div>
            <div class="stat-value">#{{ container.display_order || 1 }}</div>
          </div>
        </div>

        <div class="container-actions">
          <button class="btn btn-secondary" @click="editContainer(container)">
            <Edit :size="16" />
            Edit
          </button>
          <button class="btn btn-primary" @click="viewCoffees(container)">
            <Coffee :size="16" />
            View Coffees
          </button>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="info-card">
        <div class="info-icon">
          <Package :size="24" />
        </div>
        <div class="info-content">
          <h4 class="info-title">Container Management</h4>
          <p class="info-description">
            Organize your coffee collection using labeled containers. 
            Each container can hold different types of beans and helps you 
            keep track of your inventory. Containers are loaded from your database.
          </p>
        </div>
      </div>
    </div>

    <!-- Debug Info (can be removed) -->
    <!-- Removed for production -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Package, Edit, Coffee } from 'lucide-vue-next'
import { useCoffeeData } from '../composables/useCoffeeData'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { success, info, warning } = useToast()

// Use the coffee data composable to get containers
const { containers, loading, fetchContainers } = useCoffeeData()

// Debug toggle
const showDebug = ref(false)

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

const editContainer = (container) => {
  info('Edit Feature', `Edit functionality for "${container.name}" coming soon!`)
  console.log('Edit container:', container)
}

const viewCoffees = (container) => {
  // Navigate to coffee tab with container filter
  router.push({
    path: '/coffee',
    query: { container: container.id }
  })
  success('Filtering coffees', `Showing coffees in ${container.name}`)
}

// Initialize data on mount
onMounted(async () => {
  console.log('ContainersView mounted - fetching containers')
  
  try {
    const result = await fetchContainers()
    
    if (result && !result.success) {
      warning('Data Notice', 'Using fallback container data - database may be unavailable')
    }
  } catch (error) {
    console.error('Error fetching containers:', error)
    warning('Load Error', 'Could not load containers from database')
  }
})
</script>

<style scoped>
.containers-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
}

/* Results Counter */
.results-counter {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.counter-text {
  font-size: 1rem;
  color: #666;
}

/* Loading Section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  color: #22c55e;
  animation: spin 1s linear infinite;
}

.spinner circle {
  stroke-dasharray: 31.416;
  stroke-dashoffset: 31.416;
  animation: spinner-dash 1.5s ease-in-out infinite;
}

.loading-text {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state-icon {
  margin-bottom: 1rem;
  color: #999;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.empty-state-description {
  color: #666;
  margin: 0;
  max-width: 24rem;
  line-height: 1.5;
}

/* Containers Grid */
.containers-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .containers-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.container-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e5e7eb;
  transition: all 0.2s ease;
}

.container-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.container-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.container-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.container-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ccc;
}

.container-info {
  flex: 1;
}

.container-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.container-description {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

.container-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.container-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #22c55e;
  color: white;
}

.btn-primary:hover {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

/* Info Section */
.info-section {
  margin-top: 1rem;
}

.info-card {
  background: #eff6ff;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #3b82f6;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.info-icon {
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
}

.info-description {
  color: #1e40af;
  line-height: 1.5;
  margin: 0;
  opacity: 0.9;
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dashoffset: 31.416;
  }
  50% {
    stroke-dashoffset: 7.854;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 31.416;
    transform: rotate(450deg);
  }
}

/* Debug Section - Removed for production */

/* Responsive Design */
@media (max-width: 640px) {
  .container-card {
    padding: 1rem;
  }
  
  .container-header {
    margin-bottom: 1rem;
  }
  
  .container-icon {
    width: 40px;
    height: 40px;
  }
  
  .container-dot {
    width: 16px;
    height: 16px;
  }
  
  .container-name {
    font-size: 1.125rem;
  }
  
  .container-actions {
    flex-direction: column;
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .debug-section {
    padding: 0.75rem;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
  
  .container-card:hover,
  .btn:hover {
    transform: none;
  }
}
</style>