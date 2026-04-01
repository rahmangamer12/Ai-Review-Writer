'use client'

import { useEffect, useSyncExternalStore } from 'react'

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => false,
    () => true
  )
}

/**
 * Component to suppress hydration warnings caused by browser extensions
 * that inject attributes like 'bis_skin_checked' into the DOM.
 */
export default function HydrationSuppressor() {
  const hydrated = useHydrated()
  
  useEffect(() => {
    // Remove bis_skin_checked attributes added by browser extensions
    const removeExtensionAttributes = () => {
      const elements = document.querySelectorAll('[bis_skin_checked]')
      elements.forEach((el) => {
        el.removeAttribute('bis_skin_checked')
      })
    }

    // Run immediately
    removeExtensionAttributes()

    // Run multiple times to catch late injections
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(removeExtensionAttributes, delay)
    )

    // Set up a mutation observer to handle dynamically added content
    const observer = new MutationObserver((mutations) => {
      let shouldClean = false
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.hasAttribute('bis_skin_checked')) {
                shouldClean = true
              }
              if (element.querySelector('[bis_skin_checked]')) {
                shouldClean = true
              }
            }
          })
        }
      })
      if (shouldClean) {
        removeExtensionAttributes()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      timeouts.forEach(clearTimeout)
      observer.disconnect()
    }
  }, [])

  // Don't render anything on server
  if (!hydrated) return null

  return null
}
