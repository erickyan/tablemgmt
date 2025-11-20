/**
 * Time Utility Functions
 * Provides consistent time handling using dayjs
 * Stores and works with ISO 8601 timestamps for reliability
 */

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import logger from '../services/logger.js'

// Extend dayjs with plugins
dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Get current timestamp in ISO 8601 format (UTC, but represents current time in EST)
 * @returns {string} ISO 8601 timestamp string
 */
export function getCurrentTimestamp() {
  try {
    // Get current time in EST timezone
    // dayjs().tz() interprets the current local time as if it were in the specified timezone
    const now = new Date()
    if (!isFinite(now.getTime())) {
      logger.warn('[timeUtils] Invalid current date, using fallback')
      return new Date().toISOString()
    }
    
    // Get current UTC time and convert to EST for display/storage
    const dateInEST = dayjs(now).tz('America/New_York')
    if (!dateInEST.isValid()) {
      logger.warn('[timeUtils] Failed to get current timestamp in EST, using UTC')
      return now.toISOString()
    }
    // Return as UTC ISO string (standard format for storage)
    return dateInEST.toISOString()
  } catch (error) {
    logger.warn('[timeUtils] Error getting EST timestamp:', error)
    // Fallback to native Date
    try {
      return new Date().toISOString()
    } catch (e) {
      logger.error('[timeUtils] Complete failure to get timestamp')
      return ''
    }
  }
}

/**
 * Format timestamp as "HH:MM" for display (in EST timezone)
 * @param {string|Date|dayjs.Dayjs} timestamp - ISO 8601 timestamp or Date object
 * @returns {string} Formatted time string (e.g., "14:30")
 */
export function formatTime(timestamp) {
  if (!timestamp) return ''
  
  try {
    // Parse as UTC first to ensure correct interpretation
    // If it's an ISO string with 'Z', it's UTC. Otherwise, treat as UTC.
    let date = dayjs.utc(timestamp)
    
    // If UTC parsing fails, try regular parsing
    if (!date.isValid()) {
      date = dayjs(timestamp)
    }
    
    // If it's still not valid, try to handle it gracefully
    if (!date.isValid()) {
      logger.warn('[timeUtils] Invalid timestamp:', timestamp)
      return ''
    }
    
    // Convert UTC to EST timezone for display
    const dateInEST = date.tz('America/New_York')
    
    if (!dateInEST.isValid()) {
      logger.warn('[timeUtils] Failed to convert to EST:', timestamp)
      // Fallback to UTC formatting
      return date.format('HH:mm')
    }
    
    return dateInEST.format('HH:mm')
  } catch (error) {
    logger.warn('[timeUtils] Invalid timestamp format:', timestamp, error)
    return ''
  }
}

/**
 * Format timestamp as localized date/time string (in EST timezone)
 * @param {string|Date|dayjs.Dayjs} timestamp - ISO 8601 timestamp or Date object
 * @param {string} format - Dayjs format string (default: locale string)
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(timestamp, format = null) {
  if (!timestamp) return ''
  
  try {
    // Parse as UTC first to ensure correct interpretation
    let date = dayjs.utc(timestamp)
    
    // If UTC parsing fails, try regular parsing
    if (!date.isValid()) {
      date = dayjs(timestamp)
    }
    
    // If it's not valid, return empty string
    if (!date.isValid()) {
      logger.warn('[timeUtils] Invalid timestamp:', timestamp)
      return ''
    }
    
    // Convert UTC to EST timezone for display
    const dateInEST = date.tz('America/New_York')
    
    if (!dateInEST.isValid()) {
      logger.warn('[timeUtils] Failed to convert to EST:', timestamp)
      // Fallback to UTC formatting
      return format ? date.format(format) : date.format('YYYY-MM-DD HH:mm:ss')
    }
    
    // Use dayjs format instead of toLocaleString to avoid DateTimeFormat errors
    return format ? dateInEST.format(format) : dateInEST.format('YYYY-MM-DD HH:mm:ss')
  } catch (error) {
    logger.warn('[timeUtils] Invalid timestamp format:', timestamp, error)
    return ''
  }
}

/**
 * Parse "HH:MM" string to ISO 8601 timestamp (today at that time in EST)
 * Used for backward compatibility with legacy "HH:MM" format
 * @param {string} timeStr - Time string in "HH:MM" format
 * @returns {string|null} ISO 8601 timestamp or null if invalid
 */
export function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null
  
  try {
    // Try to parse as "HH:MM" format
    const [hours, minutes] = timeStr.split(':').map(Number)
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null
    }
    
    // Create timestamp for today at the specified time in EST
    // Get current time in EST, then set to today at the specified hour:minute
    const nowInEST = dayjs().tz('America/New_York')
    if (!nowInEST.isValid()) {
      logger.warn('[timeUtils] Failed to get EST time, using UTC')
      const todayUTC = dayjs().startOf('day')
      return todayUTC.hour(hours).minute(minutes).second(0).millisecond(0).toISOString()
    }
    
    const todayInEST = nowInEST.startOf('day')
    const timestampInEST = todayInEST.hour(hours).minute(minutes).second(0).millisecond(0)
    
    if (!timestampInEST.isValid()) {
      logger.warn('[timeUtils] Failed to create timestamp in EST')
      return null
    }
    
    // Return as UTC ISO string (standard format for storage)
    return timestampInEST.toISOString()
  } catch (error) {
    logger.warn('[timeUtils] Failed to parse time string:', timeStr, error)
    return null
  }
}

/**
 * Check if a timestamp is more than a specified duration ago
 * @param {string|Date|dayjs.Dayjs} timestamp - ISO 8601 timestamp or Date object
 * @param {number} minutes - Number of minutes to check (default: 60)
 * @returns {boolean} True if timestamp is more than the specified duration ago
 */
export function isOlderThan(timestamp, minutes = 60) {
  if (!timestamp) return false
  
  try {
    const timestampDate = dayjs(timestamp)
    const now = dayjs()
    const diffMinutes = now.diff(timestampDate, 'minute')
    return diffMinutes > minutes
  } catch (error) {
    logger.warn('[timeUtils] Failed to check if timestamp is older:', timestamp, error)
    return false
  }
}

/**
 * Get duration between two timestamps in minutes
 * @param {string|Date|dayjs.Dayjs} startTimestamp - Start timestamp
 * @param {string|Date|dayjs.Dayjs} endTimestamp - End timestamp (default: now)
 * @returns {number} Duration in minutes
 */
export function getDurationMinutes(startTimestamp, endTimestamp = null) {
  if (!startTimestamp) return 0
  
  try {
    const start = dayjs(startTimestamp)
    const end = endTimestamp ? dayjs(endTimestamp) : dayjs()
    return end.diff(start, 'minute')
  } catch (error) {
    logger.warn('[timeUtils] Failed to calculate duration:', startTimestamp, endTimestamp, error)
    return 0
  }
}

/**
 * Get human-readable relative time (e.g., "2 hours ago")
 * @param {string|Date|dayjs.Dayjs} timestamp - ISO 8601 timestamp or Date object
 * @returns {string} Relative time string
 */
export function getRelativeTime(timestamp) {
  if (!timestamp) return ''
  
  try {
    const date = dayjs(timestamp)
    if (!date.isValid()) {
      logger.warn('[timeUtils] Invalid timestamp for relative time:', timestamp)
      return ''
    }
    return date.fromNow()
  } catch (error) {
    logger.warn('[timeUtils] Failed to get relative time:', timestamp, error)
    return ''
  }
}

/**
 * Normalize timestamp - converts legacy "HH:MM" format to ISO 8601
 * @param {string} timestamp - Either ISO 8601 timestamp or "HH:MM" string
 * @returns {string|null} ISO 8601 timestamp or null if invalid
 */
export function normalizeTimestamp(timestamp) {
  if (!timestamp) return null
  
  // If it's already an ISO 8601 timestamp, validate and return
  if (dayjs(timestamp).isValid()) {
    return dayjs(timestamp).toISOString()
  }
  
  // Try to parse as "HH:MM" format (legacy)
  return parseTimeString(timestamp)
}

/**
 * Check if timestamp is in ISO 8601 format
 * @param {string} timestamp - Timestamp to check
 * @returns {boolean} True if valid ISO 8601 format
 */
export function isISO8601(timestamp) {
  if (!timestamp || typeof timestamp !== 'string') return false
  return dayjs(timestamp).isValid() && timestamp.includes('T')
}

