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
          prepend-icon="mdi-store"
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
        <v-list-subheader>Admin Tools</v-list-subheader>
        <v-list-item
          prepend-icon="mdi-lead-pencil"
          title="Manage Menu"
          @click="openMenuManager"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cash-multiple"
          title="Pricing & Tax"
          @click="openPricingSettings"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-receipt-text"
          title="Receipt Settings"
          @click="openReceiptSettings"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-receipt"
          title="View To-Go Sales"
          @click="openTogoSales"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-chart-line"
          title="Live Sales"
          @click="openLiveSales"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-table-multiple"
          title="Manage Tables"
          @click="openTableManager"
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
        <template v-slot:append>
          <div class="pa-4 text-center">
            <div class="text-caption text-medium-emphasis">v25.11</div>
          </div>
        </template>
      </v-navigation-drawer>

      <v-main :class="['pos-main', priceMode]">
        <div class="pos-shell">
          <header v-if="!isCashierRoute" class="pos-header">
            <div class="pos-header__left">
              <div class="pos-brand">
                <v-btn
                  v-if="isAdmin"
                  icon
                  variant="text"
                  color="accent"
                  @click="drawer = !drawer"
                  class="pos-brand__drawer"
                >
                  <v-icon>mdi-menu</v-icon>
                </v-btn>
                <span class="pos-brand__title">China Buffet</span>
              </div>
              <v-btn-toggle
                v-model="priceMode"
                mandatory
                density="comfortable"
                variant="outlined"
                class="price-toggle"
              >
                <v-btn value="lunch">
                  <v-icon start size="18">mdi-white-balance-sunny</v-icon>
                  {{ getTranslatedLabel('Lunch') }}
                </v-btn>
                <v-btn value="dinner">
                  <v-icon start size="18">mdi-weather-night</v-icon>
                  {{ getTranslatedLabel('Dinner') }}
                </v-btn>
              </v-btn-toggle>
            </div>
            <div class="pos-header__actions">
            </div>
          </header>

          <section class="pos-content">
            <div class="pos-content__primary">
              <!-- Show loading skeleton while initializing -->
              <template v-if="!firebaseReady && $store.state.loadingStates.initializing">
                <div class="d-flex align-center justify-center" style="min-height: 400px">
                  <div class="text-center">
                    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                    <p class="text-body-1 mt-4 text-medium-emphasis">Loading tables and menu...</p>
                  </div>
                </div>
              </template>
              <RouterView v-else-if="firebaseReady" />
            </div>
            <aside v-if="showOrderPanel" class="pos-content__panel">
          <component
            v-if="activeOrderPanelComponent"
            :is="activeOrderPanelComponent"
            v-bind="activeOrderPanelProps"
            @manage-table="handlePanelManageTable"
            @print-table="handlePanelPrintTable"
            @pay-table="handlePanelPayTable"
            @edit="handlePanelEditItems"
            @print="handlePanelPrintTogo"
            @paid="handlePanelTogoPaid"
          />
          <cashier-receipt-panel v-else-if="isCashierRoute" />
          <div v-else class="pos-content__panel-placeholder">
            <v-icon size="42" color="accent">mdi-receipt-outline</v-icon>
            <p class="text-subtitle-1 font-weight-medium mt-3">
              {{ getTranslatedLabel('Orders you open will appear here.') }}
            </p>
            <p class="text-body-2 text-medium-emphasis">
              {{ getTranslatedLabel('Select a table or build a to-go order to review items, actions, and guest details.') }}
            </p>
          </div>
            </aside>
          </section>
        </div>
        <currenttogo-details
          v-if="firebaseReady"
          ref="currentTogoDialog"
          v-model="togoDialogOpen"
          @edit="openTogoEditFromCurrent"
        ></currenttogo-details>
        <togo-edit-items
          v-if="firebaseReady"
          v-model="togoEditDialogOpen"
        ></togo-edit-items>
      </v-main>

      <v-bottom-navigation
        class="pos-bottom-nav"
        grow
        :elevation="6"
        :height="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 84 : 68"
        active-class="pos-bottom-nav__btn--active"
        v-model="bottomNav"
        @update:modelValue="handleBottomNavChange"
      >
        <v-btn
          v-for="item in bottomNavItems"
          :key="item.value"
          :value="item.value"
          :to="item.to"
          :ripple="false"
          :disabled="item.disabled"
        >
          <span class="pos-bottom-nav__icon">
            <v-icon :icon="item.icon"></v-icon>
          </span>
          <span class="pos-bottom-nav__label">{{ getTranslatedLabel(item.label) }}</span>
        </v-btn>
        <v-btn
          key="language"
          value="language"
          :ripple="false"
          @click="toggleLanguage"
          class="pos-bottom-nav__lang-btn"
        >
          <span class="pos-bottom-nav__icon">
            <v-icon icon="mdi-translate"></v-icon>
          </span>
          <span class="pos-bottom-nav__label">{{ currentLanguageLabel }}</span>
        </v-btn>
      </v-bottom-navigation>

      <admin-menu-manager
        v-model="showMenuManager"
        :menu="$store.state.menu"
        @save="handleMenuSave"
      />

      <admin-togo-sales
        v-model="showTogoSales"
        :sales="togoSalesHistory"
        :loading="$store.state.loadingStates.loadingTogoSales"
      />
      <admin-live-sales
        v-model="showLiveSales"
      />
      <admin-table-manager
        v-model="showTableManager"
      />

      <!-- Admin: Receipt Settings -->
      <v-dialog 
        v-model="showReceiptSettings" 
        :max-width="$vuetify.display.xs ? '100%' : ($vuetify.display.tablet ? '1200' : '1200')"
        :fullscreen="$vuetify.display.xs"
        scrollable
      >
        <v-card>
          <v-card-title class="text-h6 d-flex align-center">
            <v-icon class="mr-2">mdi-receipt-text</v-icon>
            Receipt Display Settings
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-4">
            <v-row>
              <v-col cols="12" md="6">
                <!-- Ticket Counter Section -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1 py-3">
                    <v-icon size="20" class="mr-2">mdi-counter</v-icon>
                    Ticket Counter
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                    <div class="mb-3">
                      <v-switch
                        v-model="receiptSettingsForm.showTicketCount"
                        label="Show ticket count on receipts"
                        color="accent"
                        hide-details
                        density="comfortable"
                      ></v-switch>
                    </div>
                    <v-divider class="my-3"></v-divider>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-body-2 text-medium-emphasis mb-1">Current Count</div>
                        <div class="text-h6">{{ $store.state.ticketCount || 0 }}</div>
                      </div>
                      <v-btn
                        color="error"
                        variant="outlined"
                        prepend-icon="mdi-counter-reset"
                        @click="showResetTicketCountConfirm = true"
                      >
                        Reset
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Print Time Section -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1 py-3">
                    <v-icon size="20" class="mr-2">mdi-clock-outline</v-icon>
                    Print Time
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-switch
                      v-model="receiptSettingsForm.showPrintTime"
                      label="Show print time/date on receipts"
                      color="accent"
                      hide-details
                      density="comfortable"
                    ></v-switch>
                  </v-card-text>
                </v-card>

                <!-- Receipt Text Section -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1 py-3">
                    <v-icon size="20" class="mr-2">mdi-text</v-icon>
                    Receipt Text
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-text-field
                      v-model="receiptSettingsForm.headerText"
                      label="Header Text"
                      density="comfortable"
                      class="mb-3"
                      prepend-inner-icon="mdi-format-header-1"
                    ></v-text-field>
                    <v-textarea
                      v-model="receiptSettingsForm.subHeaderText"
                      label="Sub-Header Text (Optional)"
                      density="comfortable"
                      class="mb-3"
                      rows="2"
                      auto-grow
                      prepend-inner-icon="mdi-format-header-2"
                      clearable
                    ></v-textarea>
                    <v-text-field
                      v-model="receiptSettingsForm.footerText"
                      label="Footer Text (Buffet)"
                      density="comfortable"
                      class="mb-3"
                      prepend-inner-icon="mdi-format-footer"
                    ></v-text-field>
                    <v-text-field
                      v-model="receiptSettingsForm.thankYouText"
                      label="Footer Text (To-Go)"
                      density="comfortable"
                      prepend-inner-icon="mdi-format-footer"
                    ></v-text-field>
                  </v-card-text>
                </v-card>

                <!-- Gratuity Section -->
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1 py-3">
                    <v-icon size="20" class="mr-2">mdi-cash-multiple</v-icon>
                    Gratuity
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                    <div class="mb-3">
                      <v-switch
                        v-model="receiptSettingsForm.showGratuity"
                        label="Show gratuity section on receipts"
                        color="accent"
                        hide-details
                        density="comfortable"
                      ></v-switch>
                    </div>
                    <v-divider class="my-3" v-if="receiptSettingsForm.showGratuity"></v-divider>
                    <div v-if="receiptSettingsForm.showGratuity">
                      <div class="mb-3">
                        <div class="text-body-2 mb-2">Gratuity Percentages</div>
                        <div class="d-flex flex-wrap gap-2 align-center">
                          <v-text-field
                            v-for="(percent, index) in receiptSettingsForm.gratuityPercentages"
                            :key="index"
                            v-model.number="receiptSettingsForm.gratuityPercentages[index]"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            suffix="%"
                            density="compact"
                            style="max-width: 100px;"
                            hide-details
                          ></v-text-field>
                          <v-btn
                            v-if="receiptSettingsForm.gratuityPercentages.length < 5"
                            icon="mdi-plus"
                            size="small"
                            variant="outlined"
                            @click="receiptSettingsForm.gratuityPercentages.push(15)"
                          ></v-btn>
                          <v-btn
                            v-if="receiptSettingsForm.gratuityPercentages.length > 1"
                            icon="mdi-minus"
                            size="small"
                            variant="outlined"
                            color="error"
                            @click="receiptSettingsForm.gratuityPercentages.pop()"
                          ></v-btn>
                        </div>
                      </div>
                      <div class="mb-2">
                        <v-switch
                          v-model="receiptSettingsForm.gratuityOnPreTax"
                          label="Calculate gratuity on pre-tax amount"
                          color="accent"
                          hide-details
                          density="comfortable"
                        ></v-switch>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Preview Section - Right Side -->
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="sticky-preview" style="position: sticky; top: 24px;">
                  <v-card-title class="text-subtitle-1 py-3">
                    <v-icon size="20" class="mr-2">mdi-eye</v-icon>
                    Preview
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-card-text class="pa-4" style="background: #fafafa;">
                    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; position: relative;">
                      <div v-if="receiptSettingsForm.showTicketCount" style="position: absolute; top: 0; right: 0; font-size: 18px; font-weight: bold; color: #333;">
                        一
                      </div>
                      <div style="text-align: center; margin-bottom: 4px; font-size: 20px; font-weight: bold; padding-top: 8px;">
                        {{ receiptSettingsForm.headerText || 'China Buffet' }}
                      </div>
                      <div v-if="receiptSettingsForm.subHeaderText" style="text-align: center; margin-top: 4px; margin-bottom: 8px; font-size: 14px; color: #666; font-style: italic; white-space: pre-line;">
                        {{ receiptSettingsForm.subHeaderText }}
                      </div>
                      <div style="text-align: center; margin-top: 0; font-size: 16px; color: #666;">
                        Table 1
                      </div>
                      <div v-if="receiptSettingsForm.showPrintTime" style="text-align: center; margin-top: 8px; font-size: 11px; color: #999;">
                        {{ new Date().toLocaleString() }}
                      </div>
                      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #ddd;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                          <span>Adult (Lunch)</span>
                          <span>$9.99</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                          <span>Water</span>
                          <span>$0.00</span>
                        </div>
                      </div>
                      <div style="margin-top: 16px; padding-top: 8px; border-top: 1px dashed #ccc;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                          <span>Subtotal</span>
                          <span>$9.99</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                          <span>Tax</span>
                          <span>$0.70</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                          <span>Total</span>
                          <span>$10.69</span>
                        </div>
                      </div>
                      <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #777;">
                        {{ receiptSettingsForm.footerText || 'Thank you for dining with us!' }}
                      </div>
                      <div v-if="receiptSettingsForm.showGratuity" style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #ccc;">
                        <div style="text-align: center; font-size: 12px; color: #666; margin-bottom: 8px;">Gratuity Suggestions</div>
                        <div style="display: flex; justify-content: space-around; font-size: 11px; flex-wrap: wrap; gap: 8px;">
                          <div
                            v-for="(percent, index) in receiptSettingsForm.gratuityPercentages"
                            :key="index"
                            style="text-align: center; min-width: 60px;"
                          >
                            <div style="font-weight: bold;">{{ percent }}%</div>
                            <div style="color: #666;">
                              ${{ (receiptSettingsForm.gratuityOnPreTax ? (9.99 * percent / 100) : (10.69 * percent / 100)).toFixed(2) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showReceiptSettings = false">Cancel</v-btn>
            <v-btn color="accent" variant="flat" prepend-icon="mdi-content-save" @click="saveReceiptSettings">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Admin: Pricing & Tax Settings -->
      <v-dialog 
        v-model="showPricingSettings" 
        :max-width="$vuetify.display.xs ? '95%' : '600'"
      >
        <v-card>
          <v-card-title class="text-h6">
            Buffet Pricing & Tax
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Lunch prices</div>
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="pricingForm.adultLunch"
                    label="Adult"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="pricingForm.bigKidLunch"
                    label="Kid (6-9)"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="pricingForm.smallKidLunch"
                    label="Kid (2-5)"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    density="comfortable"
                  />
                </v-col>
              </v-row>
            </div>

            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Dinner prices</div>
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="pricingForm.adultDinner"
                    label="Adult"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="pricingForm.bigKidDinner"
                    label="Kid (6-9)"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="pricingForm.smallKidDinner"
                    label="Kid (2-5)"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    density="comfortable"
                  />
                </v-col>
              </v-row>
            </div>

            <div>
              <div class="text-subtitle-2 mb-2">Tax rate</div>
              <v-text-field
                v-model.number="pricingForm.taxRatePercent"
                label="Tax (%)"
                type="number"
                min="0"
                step="0.01"
                suffix="%"
                density="comfortable"
              />
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showPricingSettings = false">
              Cancel
            </v-btn>
            <v-btn color="accent" variant="flat" @click="savePricingSettings">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Admin: Reset Ticket Count Confirmation -->
      <v-dialog 
        v-model="showResetTicketCountConfirm" 
        :max-width="$vuetify.display.xs ? '95%' : '480'"
        persistent
        role="alertdialog"
        aria-labelledby="reset-ticket-title"
        aria-describedby="reset-ticket-description"
      >
        <v-card>
          <v-card-title class="text-h6" id="reset-ticket-title">
            <v-icon color="error" class="mr-2" aria-hidden="true">mdi-alert-circle</v-icon>
            Reset Ticket Count?
          </v-card-title>
          <v-card-text id="reset-ticket-description">
            <p class="mb-0">Are you sure you want to reset the ticket count to zero?</p>
            <p class="mt-2 text-medium-emphasis" style="font-size: 13px;">
              Current ticket count: <strong>{{ $store.state.ticketCount || 0 }}</strong>
            </p>
            <p class="mt-2 text-medium-emphasis" style="font-size: 13px;">
              This action cannot be undone.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              variant="text" 
              @click="showResetTicketCountConfirm = false"
              @keydown.enter.prevent="showResetTicketCountConfirm = false"
              @keydown.esc="showResetTicketCountConfirm = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              :aria-label="'Confirm reset ticket count'"
              :loading="$store.state.loadingStates.resettingTicketCount"
              :disabled="$store.state.loadingStates.resettingTicketCount"
              @click="performResetTicketCount"
              @keydown.enter.prevent="performResetTicketCount"
            >
              Reset
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Admin: Reset Sales Confirmation -->
      <v-dialog 
        v-model="showResetConfirm" 
        :max-width="$vuetify.display.xs ? '95%' : '480'"
        persistent
        role="alertdialog"
        aria-labelledby="reset-sales-title"
        aria-describedby="reset-sales-description"
      >
        <v-card>
          <v-card-title class="text-h6" id="reset-sales-title">
            <v-icon color="error" class="mr-2" aria-hidden="true">mdi-alert-circle</v-icon>
            Reset Sales Data?
          </v-card-title>
          <v-card-text id="reset-sales-description">
            <p class="mb-0">
              This will clear the sales summary and history. Are you sure you want to continue?
            </p>
            <p class="mt-2 text-medium-emphasis" style="font-size: 13px;">
              This action cannot be undone.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              variant="text" 
              @click="showResetConfirm = false"
              @keydown.enter.prevent="showResetConfirm = false"
              @keydown.esc="showResetConfirm = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              :aria-label="'Confirm reset sales data'"
              :loading="$store.state.loadingStates.resettingSales"
              :disabled="$store.state.loadingStates.resettingSales"
              @click="performResetSales"
              @keydown.enter.prevent="performResetSales"
            >
              Reset
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
        :timeout="snackbarTimeout"
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
import AdminLiveSales from './components/AdminLiveSales.vue'
import AdminTableManager from './components/AdminTableManager.vue'
import TableOrderPanel from './components/panels/TableOrderPanel.vue'
import TogoOrderPanel from './components/panels/TogoOrderPanel.vue'
import TogoEditItems from './components/TogoEditItems.vue'
import CashierReceiptPanel from './components/panels/CashierReceiptPanel.vue'
import { translate } from './utils/translations.js'
import { errorHandler } from './services/errorHandler.js'
import { onSuccessNotification, showSuccess } from './utils/successNotifications.js'

export default {
  components: {
    AdminMenuManager,
    AdminTogoSales,
    AdminLiveSales,
    AdminTableManager,
    TableOrderPanel,
    TogoOrderPanel,
    TogoEditItems,
    CashierReceiptPanel
  },
  props: {
        // adultNo: 
    },
  data: () => ({ 
    drawer: null,
    togoDialogOpen: false,
    togoEditDialogOpen: false,
    bottomNav: null,
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
    showResetTicketCountConfirm: false,
    snackbar: false,
    snackbarMessage: '',
    snackbarColor: 'success',
    snackbarTimeout: 3000,
    successNotificationUnsubscribe: null,
    showTogoSales: false,
    showLiveSales: false,
    showTableManager: false,
    showPricingSettings: false,
    showReceiptSettings: false,
    togoSalesHistory: [],
    receiptSettingsForm: {
      showTicketCount: true,
      showPrintTime: true,
      headerText: 'China Buffet',
      subHeaderText: '',
      footerText: 'Thank you for dining with us!',
      thankYouText: 'Thank you for your order!',
      showGratuity: true,
      gratuityPercentages: [10, 15, 20],
      gratuityOnPreTax: false,
    },
    pricingForm: {
      adultLunch: 0,
      bigKidLunch: 0,
      smallKidLunch: 0,
      adultDinner: 0,
      bigKidDinner: 0,
      smallKidDinner: 0,
      taxRatePercent: 0,
      waterPrice: 0,
      drinkPrice: 0,
    }
  }),
  methods: {
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    openReceiptSettings() {
      // Seed form from current store values
      const state = this.$store.state
      const receiptSettings = state.receiptSettings || {}
      this.receiptSettingsForm.showTicketCount = receiptSettings.showTicketCount !== false
      this.receiptSettingsForm.showPrintTime = receiptSettings.showPrintTime !== false
      this.receiptSettingsForm.headerText = receiptSettings.headerText || 'China Buffet'
      this.receiptSettingsForm.subHeaderText = receiptSettings.subHeaderText || ''
      this.receiptSettingsForm.footerText = receiptSettings.footerText || 'Thank you for dining with us!'
      this.receiptSettingsForm.thankYouText = receiptSettings.thankYouText || 'Thank you for your order!'
      this.receiptSettingsForm.showGratuity = receiptSettings.showGratuity !== false
      this.receiptSettingsForm.gratuityPercentages = Array.isArray(receiptSettings.gratuityPercentages) && receiptSettings.gratuityPercentages.length > 0
        ? [...receiptSettings.gratuityPercentages]
        : [10, 15, 20]
      this.receiptSettingsForm.gratuityOnPreTax = receiptSettings.gratuityOnPreTax === true
      this.showReceiptSettings = true
    },
    async saveReceiptSettings() {
      this.$store.dispatch('updateReceiptSettings', {
        showTicketCount: this.receiptSettingsForm.showTicketCount,
        showPrintTime: this.receiptSettingsForm.showPrintTime,
        headerText: this.receiptSettingsForm.headerText || 'China Buffet',
        subHeaderText: this.receiptSettingsForm.subHeaderText || '',
        footerText: this.receiptSettingsForm.footerText || 'Thank you for dining with us!',
        thankYouText: this.receiptSettingsForm.thankYouText || 'Thank you for your order!',
        showGratuity: this.receiptSettingsForm.showGratuity !== false,
        gratuityPercentages: this.receiptSettingsForm.gratuityPercentages || [10, 15, 20],
        gratuityOnPreTax: this.receiptSettingsForm.gratuityOnPreTax === true,
      })
      
      // Immediately save app state to Firestore to ensure persistence
      if (this.$store.state.useFirebase && this.$store.state.firebaseInitialized) {
        try {
          const snapshot = this.getAppStateSnapshot(this.$store.state)
          snapshot.timestamp = new Date().toISOString()
          await this.$store.dispatch('saveAppStateImmediately', snapshot)
        } catch (error) {
          errorHandler.handleFirestore(error, 'saveReceiptSettings', {
            context: 'saveReceiptSettings',
            showToUser: true
          })
          return // Don't show success message if save failed
        }
      }
      
      this.showReceiptSettings = false
      showSuccess('Receipt settings updated')
    },
    openPricingSettings() {
      // Seed form from current store values
      const state = this.$store.state
      this.pricingForm.adultLunch = state.ADULTPRICE
      this.pricingForm.bigKidLunch = state.BIGKIDPRICE
      this.pricingForm.smallKidLunch = state.SMALLKIDPRICE
      this.pricingForm.adultDinner = state.ADULTDINNERPRICE
      this.pricingForm.bigKidDinner = state.BIGKIDDINNERPRICE
      this.pricingForm.smallKidDinner = state.SMALLKIDDINNERPRICE
      this.pricingForm.taxRatePercent = ((state.TAX_RATE - 1) * 100).toFixed(2)
      this.pricingForm.waterPrice = state.WATERPRICE
      this.pricingForm.drinkPrice = state.DRINKPRICE
      this.showPricingSettings = true
    },
    async savePricingSettings() {
      this.$store.dispatch('updatePricingSettings', {
        adultLunch: this.pricingForm.adultLunch,
        bigKidLunch: this.pricingForm.bigKidLunch,
        smallKidLunch: this.pricingForm.smallKidLunch,
        adultDinner: this.pricingForm.adultDinner,
        bigKidDinner: this.pricingForm.bigKidDinner,
        smallKidDinner: this.pricingForm.smallKidDinner,
        taxRatePercent: this.pricingForm.taxRatePercent,
        waterPrice: this.pricingForm.waterPrice,
        drinkPrice: this.pricingForm.drinkPrice,
      })
      
      // Immediately save app state to Firestore to ensure persistence
      if (this.$store.state.useFirebase && this.$store.state.firebaseInitialized) {
        try {
          const snapshot = this.getAppStateSnapshot(this.$store.state)
          snapshot.timestamp = new Date().toISOString()
          await this.$store.dispatch('saveAppStateImmediately', snapshot)
        } catch (error) {
          errorHandler.handleFirestore(error, 'savePricingSettings', {
            context: 'savePricingSettings',
            showToUser: true
          })
        }
      }
      
      this.showPricingSettings = false
      showSuccess('Pricing & tax updated')
    },
    getAppStateSnapshot(state) {
      // Helper to create app state snapshot (same logic as in store)
      return {
        isDinner: state.isDinner,
        tableNum: state.tableNum,
        catID: state.catID,
        TAX_RATE: state.TAX_RATE,
        ADULTPRICE: state.ADULTPRICE,
        BIGKIDPRICE: state.BIGKIDPRICE,
        SMALLKIDPRICE: state.SMALLKIDPRICE,
        ADULTDINNERPRICE: state.ADULTDINNERPRICE,
        BIGKIDDINNERPRICE: state.BIGKIDDINNERPRICE,
        SMALLKIDDINNERPRICE: state.SMALLKIDDINNERPRICE,
        WATERPRICE: state.WATERPRICE,
        DRINKPRICE: state.DRINKPRICE,
        ticketCount: state.ticketCount || 0,
        receiptSettings: JSON.parse(JSON.stringify(state.receiptSettings || { 
          showTicketCount: true,
          headerText: 'China Buffet',
          subHeaderText: '',
          footerText: 'Thank you for dining with us!',
          thankYouText: 'Thank you for your order!',
          showGratuity: true,
          gratuityPercentages: [10, 15, 20],
          gratuityOnPreTax: false
        })),
        togoLines: JSON.parse(JSON.stringify(state.togoLines)),
        togoCustomizations: JSON.parse(JSON.stringify(state.togoCustomizations || {})),
        totalTogoPrice: state.totalTogoPrice,
        tableOrder: state.tableOrder,
      }
    },
    toggleLanguage() {
      this.$store.dispatch('toggleLanguage')
      // Prevent navigation when clicking language button
      this.syncBottomNavWithRoute()
    },
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
        // Error is already handled by the store action with user-friendly messages
        // Log for debugging purposes only
        errorHandler.handle(error, { context: 'login', showToUser: false })
      }
    },
    async logout() {
      await this.$store.dispatch('signOut')
      this.drawer = false
    },
    openTogoDialog() {
      this.togoDialogOpen = true
    },
    handleBottomNavChange(value) {
      // Don't handle language toggle here, it's handled in toggleLanguage method
      if (value === 'language') {
        return
      }
      const item = this.bottomNavItems.find(entry => entry.value === value)
      if (!item) {
        return
      }
      if (item.action) {
        item.action()
        this.syncBottomNavWithRoute()
        return
      }
      if (item.to && item.to.name && this.$route.name !== item.to.name) {
        this.$router.push(item.to)
      }
    },
    syncBottomNavWithRoute() {
      this.bottomNav = this.resolveNavValue(this.$route.name)
    },
    resolveNavValue(routeName) {
      const match = this.bottomNavItems.find(item => item.to?.name === routeName)
      return match ? match.value : null
    },
    navigateTo(routeName) {
      if (this.$route.name !== routeName) {
        this.$router.push({ name: routeName })
      }
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
      try {
        const history = await this.$store.dispatch('loadTogoSalesHistory')
        this.togoSalesHistory = history
      } catch (error) {
        errorHandler.handle(error, {
          context: 'loadTogoSales',
          showToUser: true
        })
      }
    },
    openLiveSales() {
      if (!this.isAdmin) {
        return
      }
      this.drawer = false
      this.showLiveSales = true
    },
    openTableManager() {
      if (!this.isAdmin) {
        return
      }
      this.drawer = false
      this.showTableManager = true
    },
    async handleMenuSave(menu) {
      try {
        await this.$store.dispatch('updateMenuFromAdmin', menu)
        showSuccess('Menu updated successfully')
        this.showMenuManager = false
      } catch (error) {
        errorHandler.handle(error, {
          context: 'saveMenu',
          showToUser: true
        })
      }
    },
    async performResetSales() {
      try {
        const result = await this.$store.dispatch('resetSalesData')
        if (result?.success) {
          showSuccess('Sales data reset successfully')
          this.showResetConfirm = false
        } else {
          // Handle error from action result
          const error = new Error(result?.error || 'Failed to reset sales data')
          errorHandler.handle(error, {
            context: 'resetSales',
            showToUser: true
          })
          this.showResetConfirm = false
        }
      } catch (error) {
        errorHandler.handle(error, {
          context: 'resetSales',
          showToUser: true
        })
        this.showResetConfirm = false
      } finally {
        this.drawer = false
      }
    },
    async performResetTicketCount() {
      this.$store.commit('setLoadingState', { key: 'resettingTicketCount', value: true })
      try {
        // Reset ticket count in store
        this.$store.dispatch('setTicketCount', 0)
        
        // Immediately save app state to Firestore
        if (this.$store.state.useFirebase && this.$store.state.firebaseInitialized && this.$store.state.authUser) {
          try {
            const state = this.$store.state
            const snapshot = {
              isDinner: state.isDinner,
              tableNum: state.tableNum,
              catID: state.catID,
              TAX_RATE: state.TAX_RATE,
              ADULTPRICE: state.ADULTPRICE,
              BIGKIDPRICE: state.BIGKIDPRICE,
              SMALLKIDPRICE: state.SMALLKIDPRICE,
              ADULTDINNERPRICE: state.ADULTDINNERPRICE,
              BIGKIDDINNERPRICE: state.BIGKIDDINNERPRICE,
              SMALLKIDDINNERPRICE: state.SMALLKIDDINNERPRICE,
              WATERPRICE: state.WATERPRICE,
              DRINKPRICE: state.DRINKPRICE,
              ticketCount: 0,
              togoLines: JSON.parse(JSON.stringify(state.togoLines)),
              togoCustomizations: JSON.parse(JSON.stringify(state.togoCustomizations || {})),
              totalTogoPrice: state.totalTogoPrice,
              tableOrder: state.tableOrder,
            }
            snapshot.timestamp = new Date().toISOString()
            await this.$store.dispatch('saveAppStateImmediately', snapshot)
          } catch (error) {
            // Error will be handled by outer catch block with user-friendly messages
            throw error
          }
        }
        
        showSuccess('Ticket count reset successfully')
        this.showResetTicketCountConfirm = false
      } catch (error) {
        errorHandler.handle(error, {
          context: 'resetTicketCount',
          showToUser: true
        })
      } finally {
        this.drawer = false
        this.$store.commit('setLoadingState', { key: 'resettingTicketCount', value: false })
      }
    },
    ensureRoute(target) {
      if (this.$route.name === target) {
        return Promise.resolve()
      }
      return this.$router.push({ name: target })
    },
    handlePanelManageTable(index) {
      const tableIndex = typeof index === 'number' ? index : this.$store.state.tableNum || 0
      this.$store.dispatch('setOrderPanel', { type: 'table', tableIndex })
      this.ensureRoute('home').finally(() => {
        window.dispatchEvent(
          new CustomEvent('pos-open-table-details', { detail: { tableIndex } })
        )
      })
    },
    handlePanelPrintTable(index) {
      const tableIndex = typeof index === 'number' ? index : this.$store.state.tableNum || 0
      this.$store.dispatch('setOrderPanel', { type: 'table', tableIndex })
      this.ensureRoute('home').finally(() => {
        window.dispatchEvent(
          new CustomEvent('pos-print-table', { detail: { tableIndex } })
        )
      })
    },
    handlePanelPayTable(index) {
      try {
        const tableIndex = typeof index === 'number' ? index : this.$store.state.tableNum || 0
        this.$store.dispatch('setOrderPanel', { type: 'table', tableIndex })
        this.$store.dispatch('payTable')
        const tables = this.$store.state.tables || {}
        const table = Array.isArray(tables) ? tables[tableIndex] : tables[tableIndex]
        const tableName = table?.name || `Table ${table?.number || tableIndex + 1}`
        showSuccess(`${this.getTranslatedLabel('Table')} ${tableName} ${this.getTranslatedLabel('marked as paid')}`)
      } catch (error) {
        errorHandler.handle(error, {
          context: 'payTable',
          showToUser: true
        })
      }
    },
    handlePanelEditItems() {
      this.togoDialogOpen = false
      this.togoEditDialogOpen = true
    },
    handlePanelPrintTogo() {
      const ref = this.$refs.currentTogoDialog
      if (ref && typeof ref.printTogoReceipt === 'function') {
        ref.printTogoReceipt()
        return
      }
      this.$store.dispatch('calculateTogoTotal')
    },
    handlePanelTogoPaid() {
      try {
        this.$store.dispatch('payTogo')
        showSuccess('To-go order marked as paid')
      } catch (error) {
        errorHandler.handle(error, {
          context: 'payTogo',
          showToUser: true
        })
      }
    },
    openTogoEditFromCurrent() {
      this.togoDialogOpen = false;
      this.togoEditDialogOpen = true;
    }
  },
  computed: {
    priceMode: {
      get() {
        return this.$store.state.isDinner ? 'dinner' : 'lunch'
      },
      set(value) {
        this.$store.dispatch('setDinnerMode', value === 'dinner')
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
      // Handle both array (legacy) and object (new format) for tables
      const tables = this.$store.state.tables || {}
      const hasTables = Array.isArray(tables) 
        ? tables.length > 0 
        : Object.keys(tables).length > 0
      if (!hasTables) return false
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
    bottomNavItems() {
      const items = [
        {
          value: 'logout',
          label: 'Log out',
          icon: 'mdi-logout',
          action: () => this.logout()
        },
        {
          value: 'home',
          label: 'Floor plan',
          icon: 'mdi-floor-plan',
          to: { name: 'home' }
        },
        {
          value: 'about',
          label: 'Menu',
          icon: 'mdi-view-grid-outline',
          to: { name: 'about' }
        }
      ]

      // Add Cashier tab for both admin and server users
      items.push({
        value: 'cashier',
        label: 'Cashier',
        icon: 'mdi-receipt',
        to: { name: 'cashier' }
      })

      if (this.isAdmin) {
        // Admin-only tabs
        items.push({
          value: 'admin',
          label: 'Admin',
          icon: 'mdi-dots-horizontal',
          action: () => {
            this.drawer = true
          }
        })
      }

      return items
    },
    showOrderPanel() {
      return !this.showLogin && !this.authLoading
    },
    isCashierRoute() {
      return this.$route.name === 'cashier'
    },
    activeOrderPanel() {
      return this.$store.state.orderPanel || { type: null }
    },
    activeOrderPanelComponent() {
      switch (this.activeOrderPanel.type) {
        case 'table':
          return TableOrderPanel
        case 'togo':
          return TogoOrderPanel
        default:
          return null
      }
    },
    activeOrderPanelProps() {
      if (this.activeOrderPanel.type === 'table') {
        return {
          tableIndex: this.activeOrderPanel.tableIndex ?? this.$store.state.tableNum ?? 0
        }
      }
      return {}
    },
    drawerColor() {
      return 'drawer'
    },
    isChinese() {
      return this.$store.state.language === 'zh'
    },
    currentLanguageLabel() {
      return this.isChinese ? '中文' : 'English'
    }
  },
  mounted() {
    // Set up error handler notification callback
    errorHandler.setNotificationCallback((errorInfo) => {
      // Show user-friendly message (not technical error details)
      this.snackbarMessage = errorInfo.message || errorInfo.title || 'An error occurred'
      this.snackbarColor = 'error'
      this.snackbarTimeout = 4000 // Longer timeout for errors
      this.snackbar = true
      
      // Log technical details for debugging (not shown to user)
      if (errorInfo.error && process.env.NODE_ENV === 'development') {
        console.error('[Error Handler]', errorInfo.context, errorInfo.error)
      }
    })
    
    // Set up success notification listener
    this.successNotificationUnsubscribe = onSuccessNotification((detail) => {
      this.snackbarMessage = detail.message
      this.snackbarColor = detail.type || 'success'
      this.snackbarTimeout = detail.timeout || 3000
      this.snackbar = true
    })
  },
  beforeUnmount() {
    // Clear error handler callback
    errorHandler.setNotificationCallback(null)
    
    // Unsubscribe from success notifications
    if (this.successNotificationUnsubscribe) {
      this.successNotificationUnsubscribe()
      this.successNotificationUnsubscribe = null
    }
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
        this.showLiveSales = false
      }
    },
    '$route.name'() {
      this.syncBottomNavWithRoute()
    }
  }
}
</script>
<style>
* {
    -ms-touch-action: manipulation;
    touch-action: manipulation;
}

.pos-main {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--v-theme-background) 65%, #ffffff 35%),
    color-mix(in srgb, var(--v-theme-surface) 70%, #ffffff 30%)
  );
  color: var(--v-theme-on-background);
  transition: background 300ms ease, color 300ms ease;
  display: flex;
  flex-direction: column;
}

.pos-main.lunch,
.pos-main.dinner {
  background: radial-gradient(circle at top left, rgba(255, 231, 186, 0.6), transparent 45%),
              linear-gradient(180deg, rgba(253, 246, 234, 0.95), rgba(255, 255, 255, 0.92));
}

.pos-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 32px 88px;
  gap: 24px;
}

.pos-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--v-theme-surface) 92%, transparent);
  box-shadow: 0 12px 32px rgba(15, 25, 35, 0.12);
  backdrop-filter: blur(14px);
}

.pos-header__left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.pos-brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-weight: 600;
  font-size: 22px;
}

.pos-brand__title {
  letter-spacing: 0.2px;
}

.pos-brand__mode {
  font-size: 14px;
  font-weight: 500;
  color: color-mix(in srgb, var(--v-theme-primary) 75%, var(--v-theme-on-background) 25%);
}

.pos-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
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

.pos-content {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

@media (min-width: 820px) {
   .pos-content {
     grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
   }
 }

@media (min-width: 768px) and (max-width: 900px) and (orientation: landscape) {
  /* iPad Mini landscape - smaller side panel */
  .pos-content {
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 16px;
  }
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  /* Regular iPad landscape */
  .pos-content {
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 20px;
  }
}

/* Hide side panel on iPhone vertical for cashier view */
@media (max-width: 480px) and (orientation: portrait) {
  .pos-content {
    grid-template-columns: 1fr;
  }
  
  .pos-content__panel {
    display: none;
  }
}

.pos-content__primary {
  min-height: 0;
}

.pos-content__panel {
  background: color-mix(in srgb, var(--v-theme-surface) 92%, transparent);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 16px 38px rgba(15, 25, 35, 0.16);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
  width: 400px;
}

@media (min-width: 768px) and (max-width: 900px) and (orientation: landscape) {
  /* iPad Mini landscape - compact panel */
  .pos-content__panel {
    width: 340px;
    padding: 16px;
    gap: 10px;
  }
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  /* Regular iPad landscape */
  .pos-content__panel {
    width: 380px;
    padding: 18px;
    gap: 12px;
  }
}

@media (min-width: 1024px) and (max-width: 1200px) and (orientation: landscape) {
  /* Larger tablets/small desktops (e.g., 1080x810) */
  .pos-content {
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 20px;
  }
  
  .pos-content__panel {
    width: 360px;
    padding: 20px;
    gap: 12px;
  }
}

.pos-content__panel-placeholder {
  text-align: center;
  padding: 24px 12px;
  border: 1px dashed color-mix(in srgb, var(--v-theme-primary) 40%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--v-theme-surface) 88%, transparent);
}

.pos-main .v-card,
.pos-main .v-sheet,
.pos-main .v-dialog .v-card {
  background-color: color-mix(in srgb, var(--v-theme-surface) 90%, transparent);
  backdrop-filter: blur(12px);
  transition: background-color 300ms ease, color 300ms ease;
  border-radius: 18px;
}

.pos-main.lunch .v-card,
.pos-main.lunch .v-sheet,
.pos-main.lunch .v-dialog .v-card,
.pos-main.dinner .v-card,
.pos-main.dinner .v-sheet,
.pos-main.dinner .v-dialog .v-card {
  box-shadow: 0 10px 20px rgba(255, 192, 203, 0.18);
}

.pos-main .v-divider {
  border-color: color-mix(in srgb, var(--v-theme-primary) 35%, transparent);
}

.pos-bottom-nav {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: min(960px, calc(100% - 32px));
  border-radius: 32px;
  background: color-mix(in srgb, var(--v-theme-surface) 96%, transparent);
  box-shadow: 0 16px 36px rgba(15, 25, 35, 0.22);
  backdrop-filter: blur(16px);
  padding-inline: 12px;
}

.pos-bottom-nav__btn--active {
  background: color-mix(in srgb, var(--v-theme-primary-soft) 80%, transparent) !important;
  color: var(--v-theme-primary) !important;
}

.pos-bottom-nav__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .pos-bottom-nav__icon {
    margin-bottom: 6px;
  }
  
  .pos-bottom-nav__icon .v-icon {
    font-size: 32px !important;
    width: 32px !important;
    height: 32px !important;
  }
}

.pos-bottom-nav__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  line-height: 1.4;
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .pos-bottom-nav__label {
    font-size: 16px;
    letter-spacing: 0.6px;
  }
}

.v-navigation-drawer {
  backdrop-filter: blur(18px);
  border-right: 1px solid color-mix(in srgb, var(--v-theme-primary) 12%, transparent) !important;
}

/* Mobile responsive styles for dialogs */
@media (max-width: 600px) {
  /* Confirmation dialogs */
  .v-dialog .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .v-dialog .v-card-actions .v-btn {
    width: 100%;
    margin: 0;
  }
  
  .v-dialog .v-card-actions .v-spacer {
    display: none;
  }
  
  /* Settings dialogs */
  .v-dialog .v-card-title {
    font-size: 18px;
    padding: 16px;
  }
  
  .v-dialog .v-card-text {
    padding: 16px;
  }
  
  /* Receipt settings dialog */
  .v-dialog .v-row {
    margin: 0;
  }
  
  .v-dialog .v-col {
    padding: 8px;
  }
  
  .sticky-preview {
    position: static !important;
  }
  
  /* Pricing settings dialog */
  .v-dialog .v-row.dense {
    margin: 0;
  }
  
  .v-dialog .v-col {
    padding: 8px;
  }
}
</style>