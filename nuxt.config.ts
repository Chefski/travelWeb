export default defineNuxtConfig({
  ssr: false,

  nitro: {
    preset: 'github-pages'
  },

  app: {
    baseURL: '/travelWeb/'
  },

  pages: true,

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/eslint'
  ],

  colorMode: {
    classSuffix: '',
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },

  experimental: {
    appManifest: false
  },

  compatibilityDate: '2026-02-21'
});
