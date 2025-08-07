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
        <div class="coffee-logo"></div>
        <div class="coffee-info">
          <div class="coffee-name">{{ coffee.name }}</div>
          <div class="coffee-shop">{{ coffee.shop }}</div>
        </div>
        <button class="coffee-menu" @click.stop="$emit('card-action', 'menu', coffee)">
          ⋮
        </button>
      </div>
      
      <!-- Expanded details (placeholder) -->
      <div v-if="expandedCards.has(coffee.id)" class="coffee-details">
        <p>Expanded details for {{ coffee.name }}</p>
        <button @click.stop="$emit('card-expand', coffee.id)">Collapse</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  coffees: { type: Array, default: () => [] },
  expandedCards: { type: Set, default: () => new Set() }
})

defineEmits(['card-expand', 'card-action'])
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
.coffee-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.coffee-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f0f0;
  flex-shrink: 0;
}
.coffee-info { flex: 1; }
.coffee-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
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
}
.coffee-details {
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .coffee-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
</style>