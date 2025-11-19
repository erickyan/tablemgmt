import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
} from 'firebase/firestore'

import { db } from '@/firebase'
import { retryFirestore } from './retry.js'
import logger from './logger.js'
import { debounce } from '../utils/debounce.js'

function assertDb() {
  if (!db) {
    throw new Error('[Firestore] Database is not initialized. Ensure Firebase environment variables are set.')
  }
  return db
}

function normalizeMenuDoc(docSnap) {
  const data = docSnap.data() || {}
  
  // Validate category name
  const categoryName = (typeof data.category === 'string' && data.category.trim())
    ? data.category.trim()
    : (docSnap.id || 'Unknown')
  
  // Validate items array
  const items = Array.isArray(data.items) ? data.items : []
  
  return {
    category: categoryName,
    items: items.map(item => {
      // Validate and sanitize menu item
      if (!item || typeof item !== 'object') {
        return null
      }
      
      const name = (typeof item.name === 'string' && item.name.trim())
        ? item.name.trim()
        : ''
      
      // Validate price (0-1000, default 0)
      let listPrice = 0
      if (typeof item.listPrice === 'number' && Number.isFinite(item.listPrice)) {
        listPrice = Math.max(0, Math.min(1000, item.listPrice))
      } else if (typeof item.listPrice === 'string') {
        const parsed = Number.parseFloat(item.listPrice)
        if (Number.isFinite(parsed)) {
          listPrice = Math.max(0, Math.min(1000, parsed))
        }
      }
      
      // Validate quantity (non-negative integer, default 0)
      let quantity = 0
      if (typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity >= 0) {
        quantity = Math.min(999, item.quantity) // Cap at 999
      } else if (typeof item.quantity === 'string') {
        const parsed = Number.parseInt(item.quantity, 10)
        if (Number.isInteger(parsed) && parsed >= 0) {
          quantity = Math.min(999, parsed)
        }
      }
      
      // Skip invalid items (must have a name)
      if (!name) {
        return null
      }
      
      return {
        name,
        quantity,
        listPrice,
      }
    }).filter(Boolean), // Remove null entries
  }
}

function normalizeTableDoc(docSnap) {
  const data = docSnap.data() || {}
  
  // Validate table number (must be positive integer)
  let tableNumber = 0
  const idNum = Number(docSnap.id)
  if (Number.isInteger(idNum) && idNum > 0 && idNum <= 999) {
    tableNumber = idNum
  } else if (typeof data.number === 'number' && Number.isInteger(data.number) && data.number > 0 && data.number <= 999) {
    tableNumber = data.number
  }
  
  // Validate name (optional, max 100 chars)
  let name = null
  if (typeof data.name === 'string' && data.name.trim()) {
    name = data.name.trim().slice(0, 100) // Limit length
  }
  
  // Validate sitDownTime (string, max 20 chars)
  const sitDownTime = typeof data.sitDownTime === 'string' ? data.sitDownTime.slice(0, 20) : ''
  
  // Validate counts (non-negative integers, max 999)
  const validateCount = (value, defaultVal = 0) => {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
      return Math.min(999, value)
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10)
      if (Number.isInteger(parsed) && parsed >= 0) {
        return Math.min(999, parsed)
      }
    }
    return defaultVal
  }
  
  // Validate drinks array
  const drinks = Array.isArray(data.drinks) 
    ? data.drinks.filter(drink => typeof drink === 'string' && drink.length > 0 && drink.length <= 50)
    : []
  
  // Validate prices (0-10000, default 0)
  const validatePrice = (value, defaultVal = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(10000, value))
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(10000, parsed))
      }
    }
    return defaultVal
  }
  
  // Validate time (non-negative number, default 0)
  const validateTime = (value, defaultVal = 0) => {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed
      }
    }
    return defaultVal
  }
  
  return {
    number: tableNumber,
    name,
    sitDownTime,
    adult: validateCount(data.adult, 0),
    bigKid: validateCount(data.bigKid, 0),
    smlKid: validateCount(data.smlKid, 0),
    drinks,
    time: validateTime(data.time, 0),
    occupied: !!data.occupied,
    drinkPrice: validatePrice(data.drinkPrice, 0),
    totalPrice: validatePrice(data.totalPrice, 0),
    goodPpl: !!data.goodPpl,
    togo: validateCount(data.togo, 0),
    pricingModeDinner: data.pricingModeDinner !== undefined ? !!data.pricingModeDinner : undefined,
    updatedAt: data.updatedAt || null,
  }
}

function defaultTable(number) {
  return {
    number,
    name: null,
    sitDownTime: '',
    adult: 0,
    bigKid: 0,
    smlKid: 0,
    drinks: [],
    time: 0,
    occupied: false,
    drinkPrice: 0,
    totalPrice: 0,
    goodPpl: false,
    togo: 0,
    updatedAt: null,
  }
}

export async function loadMenu() {
  return retryFirestore(async () => {
    const snapshot = await getDocs(collection(assertDb(), 'menu'))
    return snapshot.docs.map(normalizeMenuDoc)
  }, 'loadMenu')
}

export function watchMenu(callback, options = {}) {
  const { debounceMs = 300 } = options
  const debouncedCallback = debounceMs > 0 ? debounce(callback, debounceMs) : callback
  
  return onSnapshot(
    collection(assertDb(), 'menu'),
    snapshot => {
      const menu = snapshot.docs.map(normalizeMenuDoc)
      debouncedCallback(menu)
    },
    { includeMetadataChanges: false }
  )
}

export async function saveMenuCategory(categoryId, data) {
  return retryFirestore(async () => {
    await setDoc(doc(assertDb(), 'menu', categoryId), {
      category: data.category || categoryId,
      items: Array.isArray(data.items) ? data.items : [],
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }, `saveMenuCategory(${categoryId})`)
}

export async function deleteMenuCategory(categoryId) {
  return retryFirestore(async () => {
    await deleteDoc(doc(assertDb(), 'menu', categoryId))
  }, `deleteMenuCategory(${categoryId})`).catch(error => {
    logger.firestore.error(`Failed to delete menu category ${categoryId}:`, error)
    throw error
  })
}

export async function getAllMenuCategoryIds() {
  const snapshot = await getDocs(collection(assertDb(), 'menu'))
  return snapshot.docs.map(doc => doc.id)
}

export async function loadTables() {
  return retryFirestore(async () => {
    const snapshot = await getDocs(collection(assertDb(), 'tables'))
    return normalizeTablesSnapshot(snapshot)
  }, 'loadTables')
}

export function watchTables(callback, options = {}) {
  const { debounceMs = 300 } = options
  const debouncedCallback = debounceMs > 0 ? debounce(callback, debounceMs) : callback
  
  return onSnapshot(
    collection(assertDb(), 'tables'),
    snapshot => {
      debouncedCallback(normalizeTablesSnapshot(snapshot))
    },
    { includeMetadataChanges: false }
  )
}

function normalizeTablesSnapshot(snapshot) {
  // Build object of tables from Firestore, keyed by table number
  // Structure: { [tableNumber]: Table }
  const tables = {}
  snapshot.docs.forEach(docSnap => {
    const table = normalizeTableDoc(docSnap)
    if (table.number > 0) {
      tables[table.number] = table
    }
  })
  
  // Return object (no need to sort - object keys are accessible directly)
  return tables
}

export async function saveTable(tableNumber, data) {
  return retryFirestore(async () => {
    const ref = doc(assertDb(), 'tables', String(tableNumber))
    // Filter out undefined values (Firestore doesn't support undefined)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )
    await setDoc(ref, {
      ...cleanData,
      number: tableNumber,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }, `saveTable(${tableNumber})`)
}

export async function deleteTable(tableNumber) {
  return retryFirestore(async () => {
    const ref = doc(assertDb(), 'tables', String(tableNumber))
    await deleteDoc(ref)
  }, `deleteTable(${tableNumber})`)
}

export async function loadSalesSummary() {
  return retryFirestore(async () => {
    const snapshot = await getDoc(doc(assertDb(), 'salesSummary', 'stats'))
    return snapshot.exists() ? snapshot.data() : null
  }, 'loadSalesSummary')
}

export function watchSalesSummary(callback, options = {}) {
  const { debounceMs = 500 } = options // Slightly longer debounce for sales data
  const debouncedCallback = debounceMs > 0 ? debounce(callback, debounceMs) : callback
  
  return onSnapshot(
    doc(assertDb(), 'salesSummary', 'stats'),
    snapshot => {
      if (snapshot.exists()) {
        debouncedCallback(snapshot.data())
      }
    },
    { includeMetadataChanges: false }
  )
}

export async function saveSalesSummary(data) {
  return retryFirestore(async () => {
    await setDoc(doc(assertDb(), 'salesSummary', 'stats'), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }, 'saveSalesSummary')
}

export async function addSalesRecord(record) {
  return retryFirestore(async () => {
    await addDoc(collection(assertDb(), 'sales'), {
      ...record,
      timestamp: serverTimestamp(),
    })
  }, 'addSalesRecord')
}

export async function addTogoSalesRecord(record = {}) {
  return retryFirestore(async () => {
    const database = assertDb()
    const items = Array.isArray(record.items) ? record.items.map(item => ({
      name: item?.name || '',
      quantity: Number(item?.quantity ?? 0),
      price: Number(item?.price ?? 0),
      basePrice: Number(item?.basePrice ?? item?.price ?? 0),
      extraCharge: Number(item?.extraCharge ?? item?.extraPrice ?? 0),
      note: item?.note || ''
    })) : []

    const payload = {
      orderType: 'togo',
      createdAt: Number(record.createdAt || Date.now()),
      subtotal: Number(record.subtotal ?? 0),
      total: Number(record.total ?? record.subtotal ?? 0),
      taxRate: Number(record.taxRate ?? 0),
      items,
      timestamp: serverTimestamp()
    }

    await addDoc(collection(database, 'sales'), payload)
  }, 'addTogoSalesRecord')
}

export async function loadAppState() {
  return retryFirestore(async () => {
    const snapshot = await getDoc(doc(assertDb(), 'appState', 'current'))
    if (!snapshot.exists()) return null
    return snapshot.data()
  }, 'loadAppState')
}

export function watchAppState(callback, options = {}) {
  const { debounceMs = 500 } = options // Slightly longer debounce for app state
  const debouncedCallback = debounceMs > 0 ? debounce(callback, debounceMs) : callback
  
  return onSnapshot(
    doc(assertDb(), 'appState', 'current'),
    snapshot => {
      if (snapshot.exists()) {
        debouncedCallback(snapshot.data())
      }
    },
    { includeMetadataChanges: false }
  )
}

export async function saveAppState(stateSnapshot) {
  return retryFirestore(async () => {
    await setDoc(doc(assertDb(), 'appState', 'current'), {
      ...stateSnapshot,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return { success: true }
  }, 'saveAppState')
}

export async function clearSalesData() {
  return retryFirestore(async () => {
    const database = assertDb()
    const zeroSummary = {
      revenue: 0,
      totalCount: 0,
      adultCount: 0,
      bigKidCount: 0,
      smlKidCount: 0,
      totalTogoRevenue: 0
    }
    await setDoc(doc(database, 'salesSummary', 'stats'), {
      ...zeroSummary,
      updatedAt: serverTimestamp()
    }, { merge: true })

    const salesSnapshot = await getDocs(collection(database, 'sales'))
    const deletions = salesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref))
    if (deletions.length > 0) {
      await Promise.all(deletions)
    }
  }, 'clearSalesData')
}

/**
 * Load to-go sales history with optional pagination
 * @param {Object} options - Pagination options
 * @param {number} options.pageSize - Number of records per page (default: 50, max: 100)
 * @param {Object} options.lastDoc - Last document from previous page (for pagination)
 * @returns {Promise<{records: Array, lastDoc: Object|null, hasMore: boolean}>}
 */
export async function loadTogoSalesHistory(options = {}) {
  return retryFirestore(async () => {
    const database = assertDb()
    const { pageSize = 50, lastDoc = null } = options
    const limitSize = Math.min(Math.max(1, pageSize), 100) // Clamp between 1 and 100
    
    let salesQuery = query(
      collection(database, 'sales'),
      where('orderType', '==', 'togo'),
      orderBy('createdAt', 'desc'),
      limit(limitSize)
    )
    
    // Add pagination cursor if provided
    if (lastDoc) {
      salesQuery = query(
        collection(database, 'sales'),
        where('orderType', '==', 'togo'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitSize)
      )
    }
    
    const snapshot = await getDocs(salesQuery)
    const records = snapshot.docs.map(docSnap => {
      const record = docSnap.data()
      const parsedItems = Array.isArray(record.items)
        ? record.items.map(item => ({
            name: item?.name || '',
            quantity: Number(item?.quantity ?? 0),
            price: Number(item?.price ?? 0),
            note: item?.note || '',
            extraCharge: Number(item?.extraCharge ?? (item?.price ?? 0) - Number(item?.basePrice ?? item?.price ?? 0)) || 0
          }))
        : []
      const notes = record.notes && typeof record.notes === 'object' ? record.notes : {}
      return {
        ...record,
        revenue: Number(record.revenue ?? record.total ?? 0),
        adultCount: Number(record.adultCount ?? 0),
        bigKidCount: Number(record.bigKidCount ?? 0),
        smlKidCount: Number(record.smlKidCount ?? 0),
        items: parsedItems,
        notes,
        timestamp: record.timestamp || null
      }
    })
    
    // Get last document for pagination
    const lastDocument = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    const hasMore = snapshot.docs.length === limitSize
    
    return {
      records,
      lastDoc: lastDocument,
      hasMore
    }
  }, 'loadTogoSalesHistory')
}

