import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  data: any // The full analytics data object to export
}

export function ExportModal({ isOpen, onClose, data }: ExportModalProps) {
  const { info: toastInfo, success: toastSuccess, error: toastError } = useToast()

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    try {
      if (format === 'json') {
        const jsonStr = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        toastSuccess('Export successful', 'Your JSON file has been downloaded.')
      } else if (format === 'csv') {
        // Quick and dirty CSV for 'reviews' only
        const reviews = data?.recentReviews || []
        if (reviews.length === 0) {
          toastInfo('No data', 'There are no reviews to export.')
          return
        }
        
        // Escape quotes and format as CSV
        const header = ['ID', 'Author', 'Platform', 'Rating', 'Sentiment', 'Status', 'Date', 'Content']
        const csvRows = [header.join(',')]
        
        for (const r of reviews) {
          const row = [
            r.id,
            `"${(r.author_name || r.reviewer_name || '').replace(/"/g, '""')}"`,
            r.platform,
            r.rating,
            r.sentiment_label || 'neutral',
            r.status,
            r.created_at,
            `"${(r.content || r.review_text || '').replace(/"/g, '""')}"`
          ]
          csvRows.push(row.join(','))
        }
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reviews_export_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toastSuccess('Export successful', 'Your CSV file has been downloaded.')
      } else {
        // PDF not yet implemented fully on client side
        toastInfo('PDF export coming soon', 'This feature is currently being implemented.')
      }
    } catch (e) {
      toastError('Export failed', 'An error occurred while generating the file.')
    } finally {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs sm:max-w-md rounded-2xl border border-white/10 bg-[#0f0f14] p-4 sm:p-6 shadow-2xl mobile-modal"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Download className="h-6 w-6 text-purple-400" />
                Export Analytics
              </h3>
              <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-400 mb-6">Choose your preferred export format:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all"
              >
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Export as CSV</p>
                  <p className="text-sm text-gray-500">Spreadsheet format for Excel</p>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all"
              >
                <div className="rounded-lg bg-blue-500/20 p-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Export as JSON</p>
                  <p className="text-sm text-gray-500">Raw data format for developers</p>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all"
              >
                <div className="rounded-lg bg-rose-500/20 p-2">
                  <FileText className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Export as PDF</p>
                  <p className="text-sm text-gray-500">Formatted report for sharing</p>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
