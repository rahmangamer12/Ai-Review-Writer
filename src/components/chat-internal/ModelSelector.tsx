'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, Zap, Sparkles, Eye, Check, Gauge
} from 'lucide-react'
import { MODELS, MODEL_GROUPS, getModelIcon } from './models'

interface ModelSelectorProps {
  isOpen: boolean
  onClose: () => void
  selectedModel: string
  onSelectModel: (modelId: string) => void
}

type FilterType = 'all' | 'speed' | 'reasoning' | 'vision' | 'general'
type SortType = 'quality' | 'speed' | 'context' | 'name'

const filterLabels: Record<FilterType, string> = {
  all: 'All',
  speed: 'Speed',
  reasoning: 'Reasoning',
  vision: 'Vision',
  general: 'General'
}

const sortLabels: Record<SortType, string> = {
  quality: 'Quality',
  speed: 'Speed',
  context: 'Context',
  name: 'Name'
}

const getBadgeStyles = (color: string, selected: boolean) => {
  if (selected) {
    return 'bg-violet-500/30 text-violet-200 border-violet-400/50'
  }
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return colors[color] || 'bg-white/10 text-white/60 border-white/20'
}

export default function ModelSelector({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel
}: ModelSelectorProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('quality')

  const filteredModels = useMemo(() => {
    let models = [...MODELS]
    
    if (search) {
      const searchLower = search.toLowerCase()
      models = models.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.badge.toLowerCase().includes(searchLower)
      )
    }
    
    if (activeFilter !== 'all') {
      if (activeFilter === 'general') {
        models = models.filter(m => m.badge === 'GENERAL' || m.badge === 'FAST')
      } else {
        const group = MODEL_GROUPS[activeFilter as keyof typeof MODEL_GROUPS]
        if (group) {
          models = models.filter(m => group.includes(m.id))
        }
      }
    }
    
    switch (sortBy) {
      case 'quality':
        models.sort((a, b) => b.quality - a.quality)
        break
      case 'speed':
        const speedOrder: Record<string, number> = { 'Instant': 0, 'Ultra Fast': 1, 'Fast': 2, 'Balanced': 3, 'Medium': 4, 'High Quality': 5 }
        models.sort((a, b) => (speedOrder[a.speed] || 3) - (speedOrder[b.speed] || 3))
        break
      case 'context':
        models.sort((a, b) => b.contextTokens - a.contextTokens)
        break
      case 'name':
        models.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    
    return models
  }, [search, activeFilter, sortBy])

  const handleSelect = (modelId: string) => {
    onSelectModel(modelId)
    onClose()
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 95) return 'text-red-400'
    if (quality >= 90) return 'text-orange-400'
    if (quality >= 85) return 'text-yellow-400'
    return 'text-green-400'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl max-h-[85vh] bg-[#0c0c18] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 bg-gradient-to-b from-[#0c0c18] to-[#0a0a14]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Select Model</h2>
                  <p className="text-xs text-white/40">Choose the best AI for your task</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors active:scale-[0.98]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none focus:bg-white/[0.08] transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white active:scale-[0.98]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(filterLabels) as FilterType[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] ${
                    activeFilter === filter
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {filterLabels[filter]}
                </button>
              ))}
              <div className="flex-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 focus:outline-none cursor-pointer"
              >
                {(Object.keys(sortLabels) as SortType[]).map(sort => (
                  <option key={sort} value={sort} className="bg-[#0c0c18]">
                    Sort: {sortLabels[sort]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Models List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredModels.map((model, idx) => (
                <motion.button
                  key={model.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => handleSelect(model.id)}
                  className={`relative p-4 rounded-2xl text-left transition-all border ${
                    selectedModel === model.id
                      ? 'bg-violet-600/20 border-violet-500/40'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        selectedModel === model.id
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-600'
                          : 'bg-white/[0.05]'
                      }`}>
                        {getModelIcon(model.iconName)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{model.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-block ${getBadgeStyles(model.badgeColor, selectedModel === model.id)}`}>
                          {model.badge}
                        </span>
                      </div>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="w-5 h-5 text-violet-400" />
                    )}
                  </div>

                  <p className="text-xs text-white/40 mt-2 line-clamp-2">{model.description}</p>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30">
                    <span className={`flex items-center gap-1 ${getQualityColor(model.quality)}`}>
                      <Gauge className="w-3 h-3" /> {model.quality}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {model.speed}
                    </span>
                    <span>{model.context}</span>
                    {model.supportsVision && (
                      <span className="text-pink-400 flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> Vision
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {filteredModels.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="w-10 h-10 text-white/20 mb-3" />
                <p className="text-white/40 text-sm">No models found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 bg-[#0a0a14]">
            <div className="flex items-center justify-between text-xs text-white/30">
              <span>{filteredModels.length} models</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-400" /> AutoReview AI
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
