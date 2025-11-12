<script setup>
import { RouterView } from 'vue-router'

</script>

<template>
  <v-app>
    <template v-if="requiresAuth && (authLoading || (isAuthenticated && !firebaseReady))">
      <v-main class="d-flex align-center justify-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      </v-main>
    </template>

    <template v-else-if="showLogin">
      <v-main class="d-flex align-center justify-center">
        <v-container class="d-flex justify-center">
          <v-card width="420" elevation="4">
            <v-card-title class="text-h5 font-weight-bold">
              China Buffet POS Login
            </v-card-title>
            <v-card-subtitle>
              Please sign in with your staff account to continue.
            </v-card-subtitle>
            <v-card-text>
              <v-alert
                v-if="displayAuthError"
                type="error"
                variant="tonal"
                class="mb-4"
              >
                {{ displayAuthError }}
              </v-alert>
              <v-text-field
                v-model="loginEmail"
                type="email"
                label="Email"
                autocomplete="username"
                prepend-icon="mdi-email-outline"
                @keyup.enter="login"
              ></v-text-field>
              <v-text-field
                v-model="loginPassword"
                type="password"
                label="Password"
                autocomplete="current-password"
                prepend-icon="mdi-lock-outline"
                @keyup.enter="login"
              ></v-text-field>
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
              <v-btn
                color="accent"
                block
                :loading="authLoading"
                @click="login"
              >
                Sign In
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-container>
      </v-main>
    </template>

    <template v-else>
      <v-navigation-drawer 
        v-if="isAdmin"
        v-model="drawer"
        temporary
        :color="drawerColor"
        border="0"
        :elevation="0"
      >
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/78.jpg"
          title="China Buffet"
        />

        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-store"
          title="Home"
          to="/"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-food-takeout-box"
          title="Order"
          to="about"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-receipt"
          title="Cashier"
          to="cashier"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-currency-usd">
          Total ${{ totalRevenue }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-silverware-fork-knife">
          Buffet ${{ buffetRevenue }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-account-multiple">
          {{ $store.state.sales.totalCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-account">
          {{ $store.state.sales.adultCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-nintendo-game-boy">
          {{ $store.state.sales.bigKidCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-teddy-bear">
          {{ $store.state.sales.smlKidCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-food-takeout-box-outline">
          Togo ${{ togoRevenue }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-subheader>Admin Tools</v-list-subheader>
        <v-list-item
          prepend-icon="mdi-lead-pencil"
          title="Manage Menu"
          @click="openMenuManager"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-receipt"
          title="View To-Go Sales"
          @click="openTogoSales"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-trash-can-outline"
          title="Reset Sales Data"
          @click="showResetConfirm = true"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item>
          <v-btn color="accent" variant="outlined" block @click="logout">
            <v-icon start>mdi-logout</v-icon>
            Sign Out
          </v-btn>
        </v-list-item>
      </v-navigation-drawer>

      <v-app-bar :elevation="2" :color="toolbarColor" density="comfortable" class="app-bar">
        <v-app-bar-nav-icon v-if="isAdmin" @click="drawer = !drawer" />
        <v-app-bar-title>China Buffet</v-app-bar-title>
        <v-btn-toggle
          v-model="priceMode"
          mandatory
          density="comfortable"
          variant="outlined"
          class="ml-4 price-toggle"
        >
          <v-btn value="lunch">
            <v-icon start size="18">mdi-white-balance-sunny</v-icon>
            Lunch
          </v-btn>
          <v-btn value="dinner">
            <v-icon start size="18">mdi-weather-night</v-icon>
            Dinner
          </v-btn>
        </v-btn-toggle>
        <div class="d-flex align-center ml-4">
          <v-btn
            variant="outlined"
            color="accent"
            :to="{ name: 'home' }"
            class="mr-2"
          >
            <v-icon start>mdi-store</v-icon>
            Home
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            :to="{ name: 'about' }"
            class="mr-2"
          >
            <v-icon start>mdi-food-fork-drink</v-icon>
            Order
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            :to="{ name: 'cashier' }"
            class="mr-2"
          >
            <v-icon start>mdi-receipt</v-icon>
            Cashier
          </v-btn>
          <v-btn
            variant="tonal"
            color="accent"
            @click="openTogoDialog"
          >
            <v-icon start>mdi-printer</v-icon>
            Print Togo
          </v-btn>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          v-if="requiresAuth"
          icon
          variant="text"
          color="accent"
          @click="logout"
          :title="'Sign Out'"
        >
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </v-app-bar>

      <v-main :class="['app-main', priceMode]">
        <RouterView v-if="firebaseReady" />
        <currenttogo-details v-if="firebaseReady" v-model="togoDialogOpen"></currenttogo-details>
      </v-main>

      <admin-menu-manager
        v-model="showMenuManager"
        :menu="$store.state.menu"
        :saving="menuSaving"
        @save="handleMenuSave"
      />

      <admin-togo-sales
        v-model="showTogoSales"
        :sales="togoSalesHistory"
        :loading="togoSalesLoading"
      />

      <v-dialog v-model="showResetConfirm" max-width="420">
        <v-card>
          <v-card-title class="text-h6">Reset Sales Data</v-card-title>
          <v-card-text>
            This will clear the sales summary and history. This action cannot be undone.
            Are you sure you want to continue?
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showResetConfirm = false">Cancel</v-btn>
            <v-btn
              color="red"
              variant="flat"
              :loading="resetLoading"
              @click="performResetSales"
            >
              Reset
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
        timeout="3000"
      >
        {{ snackbarMessage }}
        <template #actions>
          <v-btn variant="text" @click="snackbar = false">Dismiss</v-btn>
        </template>
      </v-snackbar>
    </template>
  </v-app>
</template>

<script>
import AdminMenuManager from './components/AdminMenuManager.vue'
import AdminTogoSales from './components/AdminTogoSales.vue'

export default {
  components: {
    AdminMenuManager,
    AdminTogoSales
  },
  props: {
        // adultNo: 
    },
  data: () => ({ 
    drawer: null,
    togoDialogOpen: false,
    loginEmail: '',
    loginPassword: '',
    localAuthError: '',
    // detailCompose: false,
    sideBarList: [
      {title: 'Home', icon: 'mdi-view-dashboard', to:'/'},
      {title: 'About', icon: 'mdi-forum', to:'/about'}
    ],
    showMenuManager: false,
    showResetConfirm: false,
    menuSaving: false,
    resetLoading: false,
    snackbar: false,
    snackbarMessage: '',
    snackbarColor: 'success',
    showTogoSales: false,
    togoSalesLoading: false,
    togoSalesHistory: []
  }),
  methods: {
    async login() {
      this.localAuthError = ''
      if (!this.loginEmail || !this.loginPassword) {
        this.localAuthError = 'Email and password are required.'
        return
      }
      try {
        await this.$store.dispatch('signIn', {
          email: this.loginEmail.trim(),
          password: this.loginPassword
        })
        this.loginPassword = ''
      } catch (error) {
        console.error('Login failed:', error)
      }
    },
    async logout() {
      await this.$store.dispatch('signOut')
      this.drawer = false
    },
    openTogoDialog() {
      this.togoDialogOpen = true
    },
    applyTheme(mode) {
      const themeName = mode === 'dinner' ? 'dinnerTheme' : 'lunchTheme'
      const theme = this.$vuetify && this.$vuetify.theme
      if (theme && theme.global && typeof theme.global.name === 'object' && 'value' in theme.global.name) {
        if (theme.global.name.value !== themeName) {
          theme.global.name.value = themeName
        }
      } else if (theme && theme.global && 'name' in theme.global) {
        theme.global.name = themeName
      }
    },
    openMenuManager() {
      if (!this.isAdmin) {
        return
      }
      this.drawer = false
      this.showMenuManager = true
    },
    async openTogoSales() {
      if (!this.isAdmin) {
        return
      }
      this.drawer = false
      this.showTogoSales = true
      this.togoSalesLoading = true
      try {
        const history = await this.$store.dispatch('loadTogoSalesHistory')
        this.togoSalesHistory = history
      } catch (error) {
        console.error('Failed to load togo sales history:', error)
        this.snackbarMessage = 'Failed to load to-go sales history'
        this.snackbarColor = 'error'
        this.snackbar = true
      } finally {
        this.togoSalesLoading = false
      }
    },
    async handleMenuSave(menu) {
      this.menuSaving = true
      try {
        await this.$store.dispatch('updateMenuFromAdmin', menu)
        this.snackbarMessage = 'Menu updated successfully'
        this.snackbarColor = 'success'
        this.snackbar = true
        this.showMenuManager = false
      } catch (error) {
        console.error('Failed to update menu:', error)
        this.snackbarMessage = 'Failed to update menu'
        this.snackbarColor = 'error'
        this.snackbar = true
      } finally {
        this.menuSaving = false
      }
    },
    async performResetSales() {
      this.resetLoading = true
      try {
        const result = await this.$store.dispatch('resetSalesData')
        if (result?.success) {
          this.snackbarMessage = 'Sales data reset successfully'
          this.snackbarColor = 'success'
        } else {
          this.snackbarMessage = result?.error || 'Failed to reset sales data'
          this.snackbarColor = 'error'
        }
        this.snackbar = true
        this.showResetConfirm = false
      } catch (error) {
        console.error('Failed to reset sales data:', error)
        this.snackbarMessage = 'Failed to reset sales data'
        this.snackbarColor = 'error'
        this.snackbar = true
      } finally {
        this.drawer = false
        this.resetLoading = false
      }
    }
  },
  computed: {
    priceMode: {
      get() {
        return this.$store.state.isDinner ? 'dinner' : 'lunch'
      },
      set(value) {
        this.$store.commit('setDinnerMode', value === 'dinner')
        this.applyTheme(value)
        if (this.$route.name !== 'home') {
          this.$router.push({ name: 'home' })
        }
      }
    },
    requiresAuth() {
      return this.$store.state.useFirebase
    },
    authLoading() {
      return this.$store.state.authLoading
    },
    isAuthenticated() {
      if (!this.requiresAuth) return true
      return !!this.$store.state.authUser
    },
    firebaseReady() {
      if (!this.requiresAuth) return true
      if (!this.$store.state.firebaseInitialized) return false
      if (!Array.isArray(this.$store.state.menu) || this.$store.state.menu.length === 0) return false
      if (!Array.isArray(this.$store.state.tables) || this.$store.state.tables.length === 0) return false
      return true
    },
    showLogin() {
      return this.requiresAuth && !this.authLoading && !this.isAuthenticated
    },
    displayAuthError() {
      return this.localAuthError || this.$store.state.authError
    },
    userEmail() {
      return this.$store.state.authUser?.email || ''
    },
    isAdmin() {
      return this.$store.getters.isAdmin
    },
    totalRevenue() {
      const revenue = parseFloat(this.$store.state.sales.revenue || 0)
      return revenue.toFixed(2)
    },
    togoRevenue() {
      const togo = parseFloat(this.$store.state.sales.totalTogoRevenue || 0)
      return togo.toFixed(2)
    },
    buffetRevenue() {
      const revenue = parseFloat(this.$store.state.sales.revenue || 0)
      const togo = parseFloat(this.$store.state.sales.totalTogoRevenue || 0)
      const buffet = Math.max(0, revenue - togo)
      return buffet.toFixed(2)
    },
    drawerColor() {
      return 'drawer'
    },
    toolbarColor() {
      return 'toolbar'
    },
  },
  mounted() {
    this.applyTheme(this.priceMode)
  },
  watch: {
    loginEmail() {
      if (this.localAuthError) {
        this.localAuthError = ''
      }
      if (this.requiresAuth && this.$store.state.authError) {
        this.$store.commit('setAuthError', null)
      }
    },
    loginPassword() {
      if (this.localAuthError) {
        this.localAuthError = ''
      }
      if (this.requiresAuth && this.$store.state.authError) {
        this.$store.commit('setAuthError', null)
      }
    },
    '$store.state.authUser'(user) {
      if (user) {
        this.drawer = false
      }
    },
    '$store.state.isDinner'(value) {
      this.applyTheme(value ? 'dinner' : 'lunch')
    },
    isAdmin(value) {
      if (!value) {
        this.drawer = false
        this.showMenuManager = false
        this.showResetConfirm = false
        this.showTogoSales = false
      }
    }
  }
}
</script>
<style>
* {
    -ms-touch-action: manipulation;
    touch-action: manipulation;
}

.app-main {
  min-height: calc(100vh - 64px);
  padding-bottom: 32px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--v-theme-background) 70%, #ffffff 30%),
    color-mix(in srgb, var(--v-theme-surface) 65%, #ffffff 35%)
  );
  color: var(--v-theme-on-background);
  transition: background 300ms ease, color 300ms ease;
}

.app-main.dinner {
  background: radial-gradient(circle at top left, rgba(44, 156, 219, 0.25), transparent 45%),
              linear-gradient(190deg, rgba(21, 28, 40, 0.9), rgba(33, 41, 52, 0.9));
  color: #f7f9ff;
}

.app-main.lunch {
  background: radial-gradient(circle at top left, rgba(255, 231, 186, 0.6), transparent 45%),
              linear-gradient(180deg, rgba(253, 246, 234, 0.95), rgba(255, 255, 255, 0.92));
}

.app-main .v-container {
  transition: color 300ms ease;
}

.app-main .v-card,
.app-main .v-sheet,
.app-main .v-dialog .v-card {
  background-color: color-mix(in srgb, var(--v-theme-surface) 90%, transparent);
  backdrop-filter: blur(12px);
  transition: background-color 300ms ease, color 300ms ease;
  border-radius: 18px;
}

.app-main.dinner .v-card,
.app-main.dinner .v-sheet,
.app-main.dinner .v-dialog .v-card {
  background-color: rgba(248, 250, 255, 0.92);
  color: #1f2733;
  box-shadow: 0 10px 22px rgba(15, 25, 35, 0.35);
}

.app-main.lunch .v-card,
.app-main.lunch .v-sheet,
.app-main.lunch .v-dialog .v-card {
  box-shadow: 0 10px 20px rgba(255, 192, 203, 0.18);
}

.app-main .v-divider {
  border-color: color-mix(in srgb, var(--v-theme-primary) 35%, transparent);
}

.app-bar {
  backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--v-theme-primary) 12%, transparent);
}

.price-toggle .v-btn {
  border-radius: 999px;
  transition: background-color 200ms ease, color 200ms ease, box-shadow 200ms ease;
  border: none;
}

.price-toggle .v-btn.v-btn--active {
  background-color: var(--v-theme-primary-soft);
  color: var(--v-theme-primary) !important;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

.price-toggle .v-btn:not(.v-btn--active) {
  color: var(--v-theme-primary);
}

.v-navigation-drawer {
  backdrop-filter: blur(18px);
  border-right: 1px solid color-mix(in srgb, var(--v-theme-primary) 12%, transparent) !important;
}
</style>