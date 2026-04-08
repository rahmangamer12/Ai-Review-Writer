'use client'

import { useEffect } from 'react'

/**
 * Safe hydration fix for browser extension attributes
 * Removes bis_skin_checked and other extension-injected attributes
 * that cause hydration mismatches
 */
export default function HydrationFix() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    let observer: MutationObserver | null = null

    function removeBrowserExtensionAttributes() {
      // Remove bis_skin_checked attribute (Avast, AVG extensions)
      const elements = document.querySelectorAll('[bis_skin_checked]')
      elements.forEach((el) => {
        el.removeAttribute('bis_skin_checked')
      })
    }

    function startObserver() {
      if (observer) observer.disconnect()

      observer = new MutationObserver((mutations) => {
        let needsClean = false

        for (const mutation of mutations) {
          const nodes = mutation.addedNodes
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            if (node.nodeType === 1) {
              const element = node as Element
              if (element.hasAttribute && element.hasAttribute('bis_skin_checked')) {
                needsClean = true
                break
              }
              if (element.querySelector && element.querySelector('[bis_skin_checked]')) {
                needsClean = true
                break
              }
            }
          }
          if (needsClean) break
        }

        if (needsClean) {
          removeBrowserExtensionAttributes()
        }
      })

      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        })
      }
    }

    // Initial cleanup
    removeBrowserExtensionAttributes()

    // Start observing after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserver)
    } else {
      startObserver()
    }

    // Periodic cleanup (every 5 seconds instead of 1 second for better performance)
    const intervalId = setInterval(removeBrowserExtensionAttributes, 5000)

    // Cleanup on unmount
    return () => {
      if (observer) {
        observer.disconnect()
      }
      clearInterval(intervalId)
      document.removeEventListener('DOMContentLoaded', startObserver)
    }
  }, [])

  return null
}
