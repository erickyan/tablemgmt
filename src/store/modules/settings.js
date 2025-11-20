/**
 * Settings Module
 * Handles pricing settings, receipt settings, language, and dinner/lunch mode
 */

export default {
  namespaced: true,
  
  state: {
    // Pricing + tax settings (editable from admin panel)
    TAX_RATE: 1.07,            // stored as multiplier, e.g. 1.07 = 7% tax
    ADULTPRICE: 9.99,          // lunch prices
    BIGKIDPRICE: 5.99,
    SMALLKIDPRICE: 4.99,
    ADULTDINNERPRICE: 12.25,   // dinner prices
    BIGKIDDINNERPRICE: 6.99,
    SMALLKIDDINNERPRICE: 5.99,
    WATERPRICE: 0.25,
    DRINKPRICE: 1.99,
    
    // Receipt display settings (editable from admin panel)
    receiptSettings: {
      showTicketCount: true,  // Show ticket counter on receipts
      showPrintTime: true,  // Show print time/date on receipts
      headerText: 'China Buffet',  // Header text on receipts
      subHeaderText: '',  // Sub-header text on receipts (optional)
      footerText: 'Thank you for dining with us!',  // Footer text on receipts
      thankYouText: 'Thank you for your order!',  // Thank you text for to-go orders
      showGratuity: true,  // Show gratuity section on receipts
      gratuityPercentages: [10, 15, 20],  // Gratuity percentage options
      gratuityOnPreTax: false,  // Calculate gratuity on pre-tax amount (true) or after-tax (false)
    },
    
    // App settings
    isDinner: false,
    language: 'en', // 'en' for English, 'zh' for Chinese
    
    // Cashier preferences
    cashierAutoClear: false, // Auto-clear cashier form after successful print (for experienced users)
  },

  getters: {
    isLunchMode(state) {
      return !state.isDinner
    },
    isDinnerMode(state) {
      return state.isDinner
    },
    currentLanguage(state) {
      return state.language
    },
    taxRate(state) {
      return state.TAX_RATE
    },
    receiptSettings(state) {
      return state.receiptSettings
    },
    cashierAutoClear(state) {
      return state.cashierAutoClear || false
    }
  },

  mutations: {
    /**
     * Update pricing settings
     */
    updatePricingSettings(state, payload = {}) {
      const toNumberOr = (value, fallback) => {
        const num = Number(value)
        return Number.isFinite(num) && num >= 0 ? num : fallback
      }

      const nextAdultLunch = toNumberOr(payload.adultLunch, state.ADULTPRICE)
      const nextBigKidLunch = toNumberOr(payload.bigKidLunch, state.BIGKIDPRICE)
      const nextSmallKidLunch = toNumberOr(payload.smallKidLunch, state.SMALLKIDPRICE)
      const nextAdultDinner = toNumberOr(payload.adultDinner, state.ADULTDINNERPRICE)
      const nextBigKidDinner = toNumberOr(payload.bigKidDinner, state.BIGKIDDINNERPRICE)
      const nextSmallKidDinner = toNumberOr(payload.smallKidDinner, state.SMALLKIDDINNERPRICE)

      state.ADULTPRICE = nextAdultLunch
      state.BIGKIDPRICE = nextBigKidLunch
      state.SMALLKIDPRICE = nextSmallKidLunch
      state.ADULTDINNERPRICE = nextAdultDinner
      state.BIGKIDDINNERPRICE = nextBigKidDinner
      state.SMALLKIDDINNERPRICE = nextSmallKidDinner

      if (payload.taxRatePercent !== undefined) {
        const currentPercent = (state.TAX_RATE - 1) * 100
        const percent = toNumberOr(payload.taxRatePercent, currentPercent)
        const multiplier = 1 + Math.max(0, percent) / 100
        state.TAX_RATE = Number(multiplier.toFixed(4))
      }
      
      // Also update water and drink prices if provided
      if (payload.waterPrice !== undefined) {
        const waterPrice = toNumberOr(payload.waterPrice, state.WATERPRICE)
        if (waterPrice >= 0) {
          state.WATERPRICE = waterPrice
        }
      }
      if (payload.drinkPrice !== undefined) {
        const drinkPrice = toNumberOr(payload.drinkPrice, state.DRINKPRICE)
        if (drinkPrice >= 0) {
          state.DRINKPRICE = drinkPrice
        }
      }
    },

    /**
     * Update receipt settings
     */
    updateReceiptSettings(state, payload = {}) {
      if (typeof payload.showTicketCount === 'boolean') {
        state.receiptSettings.showTicketCount = payload.showTicketCount
      }
      if (typeof payload.showPrintTime === 'boolean') {
        state.receiptSettings.showPrintTime = payload.showPrintTime
      }
      if (typeof payload.headerText === 'string') {
        state.receiptSettings.headerText = payload.headerText
      }
      if (typeof payload.subHeaderText === 'string') {
        state.receiptSettings.subHeaderText = payload.subHeaderText
      }
      if (typeof payload.footerText === 'string') {
        state.receiptSettings.footerText = payload.footerText
      }
      if (typeof payload.thankYouText === 'string') {
        state.receiptSettings.thankYouText = payload.thankYouText
      }
      if (typeof payload.showGratuity === 'boolean') {
        state.receiptSettings.showGratuity = payload.showGratuity
      }
      if (Array.isArray(payload.gratuityPercentages) && payload.gratuityPercentages.length > 0) {
        // Validate percentages are numbers between 0 and 100
        const validPercentages = payload.gratuityPercentages
          .filter(p => typeof p === 'number' && p >= 0 && p <= 100)
          .slice(0, 5) // Limit to 5 percentages max
        if (validPercentages.length > 0) {
          state.receiptSettings.gratuityPercentages = validPercentages
        }
      }
      if (typeof payload.gratuityOnPreTax === 'boolean') {
        state.receiptSettings.gratuityOnPreTax = payload.gratuityOnPreTax
      }
    },

    /**
     * Set dinner/lunch mode
     */
    setDinnerMode(state, value) {
      const isDinner = !!value
      if (state.isDinner === isDinner) {
        return
      }
      state.isDinner = isDinner
    },

    /**
     * Toggle dinner/lunch mode
     */
    toggleDinnerMode(state) {
      state.isDinner = !state.isDinner
    },

    /**
     * Set language
     */
    setLanguage(state, lang) {
      state.language = lang === 'zh' ? 'zh' : 'en'
    },

    /**
     * Toggle language
     */
    toggleLanguage(state) {
      state.language = state.language === 'zh' ? 'en' : 'zh'
    },

    /**
     * Set drink price
     */
    setDrinkPrice(state, price) {
      if (typeof price === 'number' && price >= 0) {
        state.DRINKPRICE = price
      }
    }
  },

  actions: {
    // Actions can be added here if needed for async operations
  }
}

