/* import App from '../App.vue'

const routes = [
  {
    path: '/coffee',
    name: 'Coffee',
    component: App
  },
  {
    path: '/',
    redirect: '/coffee'  // Redirect root to /coffee
  },
  {
    path: '/coffee/index.html?container=green',
    redirect: '/coffee/?container=green'  // Redirect deprecated url for green container
  },
  {
    path: '/coffee/index.html?container=grey',
    redirect: '/coffee/?container=grey'  // Redirect deprecated url for grey container
  }
] */


/* import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import CoffeeView from '../views/CoffeeView.vue'
import ContainersView from '../views/ContainersView.vue'
import ShopsView from '../views/ShopsView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuth } from '../composables/useAuth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/coffee'
      },
      {
        path: 'coffee',
        name: 'Coffee',
        component: CoffeeView,
        meta: { requiresAuth: true }
      },
      {
        path: 'containers', 
        name: 'Containers',
        component: ContainersView,
        meta: { requiresAuth: true }
      },
      {
        path: 'shops',
        name: 'Shops', 
        component: ShopsView,
        meta: { requiresAuth: true }
      }
    ]
  },
  // Legacy redirects for backward compatibility
  {
    path: '/coffee/index.html',
    redirect: '/coffee'
  },
  {
    path: '/coffee/index.html?container=green',
    redirect: '/coffee?container=green'
  },
  {
    path: '/coffee/index.html?container=grey', 
    redirect: '/coffee?container=grey'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Add route guard AFTER router is created
router.beforeEach((to, from, next) => {
  const { isLoggedIn, initializing } = useAuth()
  
  // If auth is still initializing, wait for it
  if (initializing.value) {
    const unwatch = watch(initializing, (isInit) => {
      if (!isInit) {
        unwatch()
        checkAuth()
      }
    })
  } else {
    checkAuth()
  }
  
  function checkAuth() {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    
    if (requiresAuth && !isLoggedIn.value) {
      // Redirect to login if route requires auth and user is not logged in
      next('/login')
    } else if (to.path === '/login' && isLoggedIn.value) {
      // Redirect to coffee if user is already logged in and trying to access login
      next('/coffee')
    } else {
      // Allow navigation
      next()
    }
  }
})

// Add navigation debugging
router.afterEach((to, from) => {
  console.log('Navigation completed:', { to: to.path, from: from.path })
})

export default router */

// Temporary simple router for testing
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import CoffeeView from '../views/CoffeeView.vue'
import LoginView from '../views/LoginView.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/coffee'
      },
      {
        path: 'coffee',
        name: 'Coffee',
        component: CoffeeView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

console.log('Router created:', router)

export default router