'use client'

import { motion } from 'framer-motion'
import { desiPersonas, type Persona } from '@/lib/desiPersonas'

interface PersonaSelectorProps {
  selectedPersona: Persona
  onSelectPersona: (persona: Persona) => void
  compact?: boolean
}

export default function PersonaSelector({ 
  selectedPersona, 
  onSelectPersona,
  compact = false 
}: PersonaSelectorProps) {
  
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {desiPersonas.map((persona) => (
          <motion.button
            key={persona.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectPersona(persona)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              selectedPersona.id === persona.id
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                : 'glass text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={persona.description}
          >
            <span className="text-lg">{persona.icon}</span>
            <span className="text-sm">{persona.name}</span>
          </motion.button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Choose Response Style
        </h3>
        <p className="text-white/70 text-sm">
          Select the tone for AI-generated replies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {desiPersonas.map((persona) => (
          <motion.button
            key={persona.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectPersona(persona)}
            className={`p-5 rounded-xl font-medium transition-all text-left ${
              selectedPersona.id === persona.id
                ? 'bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-primary text-white shadow-xl'
                : 'glass border border-white/10 text-white/70 hover:text-white hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{persona.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">{persona.name}</div>
                <div className="text-xs opacity-70 leading-relaxed mt-2">
                  {persona.description}
                </div>
              </div>
              {selectedPersona.id === persona.id && (
                <div className="text-primary text-xl">✓</div>
              )}
            </div>

            {/* Example Preview */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-white/50 mb-1">Example reply:</div>
              <div className="text-xs italic text-white/80 line-clamp-2">
                "{persona.examples.positive.substring(0, 100)}..."
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Current Selection Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 border border-primary/30"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">{selectedPersona.icon}</div>
          <div className="flex-1">
            <div className="font-semibold text-white">
              Currently Selected: {selectedPersona.name}
            </div>
            <div className="text-sm text-white/70">
              {selectedPersona.description}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
