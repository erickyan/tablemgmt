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
} from 'firebase/firestore'

import { db } from '@/firebase'

function assertDb() {
  if (!db) {
    throw new Error('[Firestore] Database is not initialized. Ensure Firebase environment variables are set.')
  }
  return db
}

function normalizeMenuDoc(docSnap) {
  const data = docSnap.data() || {}
  const items = Array.isArray(data.items) ? data.items : []
  return {
    category: data.category || docSnap.id,
    items: items.map(item => ({
      name: item.name || '',
      quantity: item.quantity ?? 0,
      listPrice: item.listPrice ?? 0,
    })),
  }
}

function normalizeTableDoc(docSnap) {
  const data = docSnap.data() || {}
  const number = Number(docSnap.id)
  return {
    number: Number.isFinite(number) ? number : data.number ?? 0,
    sitDownTime: data.sitDownTime || '',
    adult: data.adult ?? 0,
    bigKid: data.bigKid ?? 0,
    smlKid: data.smlKid ?? 0,
    drinks: Array.isArray(data.drinks) ? data.drinks : [],
    time: data.time ?? 0,
    occupied: !!data.occupied,
    drinkPrice: data.drinkPrice ?? 0,
    totalPrice: data.totalPrice ?? 0,
    goodPpl: !!data.goodPpl,
    togo: data.togo ?? 0,
    pricingModeDinner: data.pricingModeDinner !== undefined ? !!data.pricingModeDinner : undefined,
    updatedAt: data.updatedAt || null,
  }
}

function defaultTable(number) {
  return {
    number,
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
  const snapshot = await getDocs(collection(assertDb(), 'menu'))
  return snapshot.docs.map(normalizeMenuDoc)
}

export function watchMenu(callback) {
  return onSnapshot(collection(assertDb(), 'menu'), snapshot => {
    const menu = snapshot.docs.map(normalizeMenuDoc)
    callback(menu)
  })
}

export async function saveMenuCategory(categoryId, data) {
  await setDoc(doc(assertDb(), 'menu', categoryId), {
    category: data.category || categoryId,
    items: Array.isArray(data.items) ? data.items : [],
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function loadTables() {
  const snapshot = await getDocs(collection(assertDb(), 'tables'))
  return normalizeTablesSnapshot(snapshot)
}

export function watchTables(callback) {
  return onSnapshot(collection(assertDb(), 'tables'), snapshot => {
    callback(normalizeTablesSnapshot(snapshot))
  })
}

function normalizeTablesSnapshot(snapshot) {
  const tables = Array.from({ length: 10 }, (_, i) => defaultTable(i + 1))
  snapshot.docs.forEach(docSnap => {
    const table = normalizeTableDoc(docSnap)
    const index = table.number - 1
    if (index >= 0 && index < tables.length) {
      tables[index] = { ...tables[index], ...table }
    }
  })
  return tables
}

export async function saveTable(tableNumber, data) {
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
}

export async function loadSalesSummary() {
  const snapshot = await getDoc(doc(assertDb(), 'salesSummary', 'stats'))
  return snapshot.exists() ? snapshot.data() : null
}

export function watchSalesSummary(callback) {
  return onSnapshot(doc(assertDb(), 'salesSummary', 'stats'), snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data())
    }
  })
}

export async function saveSalesSummary(data) {
  await setDoc(doc(assertDb(), 'salesSummary', 'stats'), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function addSalesRecord(record) {
  await addDoc(collection(assertDb(), 'sales'), {
    ...record,
    timestamp: serverTimestamp(),
  })
}

export async function addTogoSalesRecord(record = {}) {
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
}

export async function loadAppState() {
  const snapshot = await getDoc(doc(assertDb(), 'appState', 'current'))
  if (!snapshot.exists()) return null
  return snapshot.data()
}

export function watchAppState(callback) {
  return onSnapshot(doc(assertDb(), 'appState', 'current'), snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data())
    }
  })
}

export async function saveAppState(stateSnapshot) {
  await setDoc(doc(assertDb(), 'appState', 'current'), {
    ...stateSnapshot,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  return { success: true }
}

export async function clearSalesData() {
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
}

export async function loadTogoSalesHistory() {
  const database = assertDb()
  const salesQuery = query(
    collection(database, 'sales'),
    where('orderType', '==', 'togo')
  )
  const snapshot = await getDocs(salesQuery)
  return snapshot.docs.map(docSnap => {
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
      revenue: Number(record.revenue ?? 0),
      adultCount: Number(record.adultCount ?? 0),
      bigKidCount: Number(record.bigKidCount ?? 0),
      smlKidCount: Number(record.smlKidCount ?? 0),
      items: parsedItems,
      notes,
      timestamp: record.timestamp || null
    }
  })
}

