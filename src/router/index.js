// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

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
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router