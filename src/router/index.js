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


import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import CoffeeView from '../views/CoffeeView.vue'
import ContainersView from '../views/ContainersView.vue'
import ShopsView from '../views/ShopsView.vue'

const routes = [
  // Main app layout with nested routes
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
      },
      {
        path: 'containers', 
        name: 'Containers',
        component: ContainersView
      },
      {
        path: 'shops',
        name: 'Shops', 
        component: ShopsView
      }
    ]
  },
  // Legacy redirects for backward compatibility
  {
    path: '/coffee/index.html',
    redirect: (to) => {
      // Preserve query parameters when redirecting
      return {
        path: '/coffee',
        query: to.query
      }
    }
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})