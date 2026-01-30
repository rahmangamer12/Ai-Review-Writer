'use client'

import { useState, useEffect, useCallback } from 'react'

interface LocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  altitude: number | null
  heading: number | null
  speed: number | null
  timestamp: number | null
}

interface AddressInfo {
  city: string | null
  country: string | null
  region: string | null
  postalCode: string | null
  street: string | null
  fullAddress: string | null
}

interface UseLocationReturn {
  // Location data
  location: LocationState
  address: AddressInfo | null
  
  // Permission state
  permission: 'granted' | 'denied' | 'prompt' | 'checking'
  supported: boolean
  
  // Loading states
  loading: boolean
  error: string | null
  
  // Actions
  requestLocation: () => Promise<boolean>
  refreshLocation: () => Promise<boolean>
  clearLocation: () => void
  
  // Utilities
  getDistanceFrom: (lat: number, lon: number) => number | null
  isNearLocation: (lat: number, lon: number, radiusKm: number) => boolean
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null
  })
  
  const [address, setAddress] = useState<AddressInfo | null>(null)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking')
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check support and load saved location
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 'geolocation' in navigator
      setSupported(isSupported)
      
      if (!isSupported) {
        setPermission('denied')
        setError('Geolocation is not supported by your browser')
      }
    }

    checkSupport()
    loadSavedLocation()
    checkPermission()
  }, [])

  // Check current permission status
  const checkPermission = async () => {
    if (!('geolocation' in navigator)) return

    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        setPermission(result.state as 'granted' | 'denied' | 'prompt')
        
        result.addEventListener('change', () => {
          setPermission(result.state as 'granted' | 'denied' | 'prompt')
        })
      }
    } catch (err) {
      console.error('Error checking permission:', err)
    }
  }

  // Load saved location from localStorage
  const loadSavedLocation = () => {
    try {
      const saved = localStorage.getItem('user-location')
      if (saved) {
        const parsed = JSON.parse(saved)
        setLocation({
          latitude: parsed.latitude || null,
          longitude: parsed.longitude || null,
          accuracy: parsed.accuracy || null,
          altitude: parsed.altitude || null,
          heading: parsed.heading || null,
          speed: parsed.speed || null,
          timestamp: parsed.timestamp || null
        })
        
        if (parsed.city || parsed.country) {
          setAddress({
            city: parsed.city || null,
            country: parsed.country || null,
            region: parsed.region || null,
            postalCode: parsed.postalCode || null,
            street: parsed.street || null,
            fullAddress: parsed.address || null
          })
        }
      }
    } catch (err) {
      console.error('Error loading saved location:', err)
    }
  }

  // Save location to localStorage
  const saveLocation = (loc: LocationState, addr?: AddressInfo) => {
    try {
      const data = {
        ...loc,
        city: addr?.city,
        country: addr?.country,
        region: addr?.region,
        postalCode: addr?.postalCode,
        street: addr?.street,
        address: addr?.fullAddress,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('user-location', JSON.stringify(data))
    } catch (err) {
      console.error('Error saving location:', err)
    }
  }

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lon: number): Promise<AddressInfo | null> => {
    try {
      // Using OpenStreetMap Nominatim (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { 
          headers: { 
            'Accept-Language': 'en-US,en',
            'User-Agent': 'AutoReviewAI/1.0'
          } 
        }
      )
      
      if (!response.ok) throw new Error('Geocoding failed')
      
      const data = await response.json()
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village || null,
        country: data.address?.country || null,
        region: data.address?.state || data.address?.region || null,
        postalCode: data.address?.postcode || null,
        street: data.address?.road || data.address?.street || null,
        fullAddress: data.display_name || null
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err)
      return null
    }
  }

  // Request current location
  const requestLocation = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      setError('Geolocation is not supported by your browser')
      return false
    }

    setLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation: LocationState = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          }
          
          setLocation(newLocation)
          setPermission('granted')
          
          // Get address from coordinates
          const addr = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          )
          
          if (addr) {
            setAddress(addr)
          }
          
          // Save to localStorage
          saveLocation(newLocation, addr || undefined)
          
          setLoading(false)
          resolve(true)
        },
        (err) => {
          console.error('Geolocation error:', err)
          
          let errorMessage = 'Unable to retrieve your location'
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              setPermission('denied')
              break
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case err.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          
          setError(errorMessage)
          setLoading(false)
          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }, [supported])

  // Refresh location (same as request but with better semantics)
  const refreshLocation = useCallback(async (): Promise<boolean> => {
    return requestLocation()
  }, [requestLocation])

  // Clear saved location
  const clearLocation = useCallback(() => {
    localStorage.removeItem('user-location')
    setLocation({
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      heading: null,
      speed: null,
      timestamp: null
    })
    setAddress(null)
    setPermission('prompt')
  }, [])

  // Calculate distance from current location to given coordinates (Haversine formula)
  const getDistanceFrom = useCallback((lat: number, lon: number): number | null => {
    if (!location.latitude || !location.longitude) return null

    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat - location.latitude) * (Math.PI / 180)
    const dLon = (lon - location.longitude) * (Math.PI / 180)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location.latitude * (Math.PI / 180)) * 
      Math.cos(lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    return distance
  }, [location.latitude, location.longitude])

  // Check if given coordinates are within radius
  const isNearLocation = useCallback((lat: number, lon: number, radiusKm: number): boolean => {
    const distance = getDistanceFrom(lat, lon)
    if (distance === null) return false
    return distance <= radiusKm
  }, [getDistanceFrom])

  return {
    location,
    address,
    permission,
    supported,
    loading,
    error,
    requestLocation,
    refreshLocation,
    clearLocation,
    getDistanceFrom,
    isNearLocation
  }
}

export default useLocation

// Utility functions
export const formatCoordinates = (lat: number, lon: number, precision: number = 4): string => {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`
}

export const formatAddress = (address: AddressInfo | null): string => {
  if (!address) return 'Unknown location'
  
  const parts = []
  if (address.city) parts.push(address.city)
  if (address.region) parts.push(address.region)
  if (address.country) parts.push(address.country)
  
  return parts.join(', ') || address.fullAddress || 'Unknown location'
}

export const getLocationAccuracyText = (accuracy: number | null): string => {
  if (!accuracy) return 'Unknown accuracy'
  if (accuracy < 10) return 'Very accurate'
  if (accuracy < 50) return 'Good accuracy'
  if (accuracy < 100) return 'Moderate accuracy'
  return 'Low accuracy'
}
