import { createRouter, createWebHistory } from 'vue-router'

import CoffeeView from '../views/CoffeeView.vue'
import ContainersView from '../views/ContainersView.vue'
import ShopsView from '../views/ShopsView.vue'

const routes = [
  {
    path: '/',
    redirect: '/coffee'
  },
  {
    path: '/coffee',
    name: 'Coffee',
    component: CoffeeView
  },
  {
    path: '/containers',
    name: 'Containers', 
    component: ContainersView
  },
  {
    path: '/shops',
    name: 'Shops',
    component: ShopsView  // Using real ShopsView now!
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Debug logging
router.beforeEach((to, from, next) => {
  console.log(`🔄 Router navigating from ${from.path} to ${to.path}`)
  next()
})

router.afterEach((to, from) => {
  console.log(`✅ Router navigation completed: ${to.path}`)
})

export default router