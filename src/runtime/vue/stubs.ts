import { ref } from 'vue'
import type { Ref, Plugin as VuePlugin } from 'vue'

import appConfig from '#build/app.config'
import type { NuxtApp } from '#app'
import { useColorMode as useColorModeVueUse } from '@vueuse/core'

export { useHead } from '@unhead/vue'

// Create stub implementations for vue-router
export const useRouteStub = () => ({
  path: '',
  name: null,
  params: {},
  query: {},
  hash: '',
  fullPath: '',
  matched: [],
  meta: {},
  redirectedFrom: undefined
})

export const useRouterStub = () => ({
  push: () => Promise.resolve(),
  replace: () => Promise.resolve(),
  go: () => Promise.resolve(),
  back: () => Promise.resolve(),
  forward: () => Promise.resolve(),
  beforeEach: () => () => {},
  afterEach: () => () => {},
  getRoutes: () => [],
  hasRoute: () => false,
  currentRoute: ref({})
})

// Create a module-level cache for the imported modules
const moduleCache: Record<string, any> = {}

// Function to dynamically import a module and cache the result
function lazyImport(moduleName: string) {
  return () => {
    if (!moduleCache[moduleName]) {
      moduleCache[moduleName] = import(/* @vite-ignore */ moduleName).catch(() => ({}))
    }
    return moduleCache[moduleName]
  }
}

// Lazy import vue-router
const importVueRouter = lazyImport('vue-router')

// Create wrapper functions that will dynamically import or use stubs
export function useRoute() {
  // Try to get the real implementation
  const vueRouterModule = moduleCache['vue-router']
  if (vueRouterModule && vueRouterModule.useRoute) {
    return vueRouterModule.useRoute()
  }

  // If not available yet, try to import it
  importVueRouter().then((module: any) => {
    if (module && module.useRoute) {
      // Module loaded successfully, but it's too late for this call
      // Future calls will use the cached module
    }
  })

  // Fall back to stub for this call
  return useRouteStub()
}

export function useRouter() {
  // Try to get the real implementation
  const vueRouterModule = moduleCache['vue-router']
  if (vueRouterModule && vueRouterModule.useRouter) {
    return vueRouterModule.useRouter()
  }

  // If not available yet, try to import it
  importVueRouter().then((module: any) => {
    if (module && module.useRouter) {
      // Module loaded successfully, but it's too late for this call
      // Future calls will use the cached module
    }
  })

  // Fall back to stub for this call
  return useRouterStub()
}

export { defineShortcuts } from '../composables/defineShortcuts'
export { useLocale } from '../composables/useLocale'

export const useColorMode = () => {
  if (!appConfig.colorMode) {
    return {
      forced: true
    }
  }

  const { store, system } = useColorModeVueUse()

  return {
    get preference() { return store.value === 'auto' ? 'system' : store.value },
    set preference(value) { store.value = value === 'system' ? 'auto' : value },
    get value() { return store.value === 'auto' ? system.value : store.value },
    forced: false
  }
}

export const useAppConfig = () => appConfig

export const useCookie = <T = string>(
  _name: string,
  _options: Record<string, any> = {}
) => {
  const value = ref(null) as Ref<T>

  return {
    value,
    get: () => value.value,
    set: () => {},
    update: () => {},
    refresh: () => Promise.resolve(value.value),
    remove: () => {}
  }
}

const state: Record<string, any> = {}

export const useState = <T>(key: string, init: () => T): Ref<T> => {
  if (state[key]) {
    return state[key] as Ref<T>
  }
  const value = ref(init())
  state[key] = value
  return value as Ref<T>
}

export function useNuxtApp() {
  return {
    isHydrating: true,
    payload: { serverRendered: false }
  }
}

export function defineNuxtPlugin(plugin: (nuxtApp: NuxtApp) => void) {
  return {
    install(app) {
      plugin({ vueApp: app } as NuxtApp)
    }
  } satisfies VuePlugin
}
