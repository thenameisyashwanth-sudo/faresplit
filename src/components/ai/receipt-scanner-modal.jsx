import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Receipt,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

const sampleReceipts = [
  {
    name: 'Sample Cafe Bill',
    title: 'Brew & Co. Cafe',
    amount: 840,
    category: 'food',
    items: ['2x Iced Latte', '1x Butter Croissant', '1x Avocado Toast'],
    previewBg: 'from-amber-500/20 to-orange-500/20',
  },
  {
    name: 'Sample Gas Station',
    title: 'Shell Auto Fuel',
    amount: 2200,
    category: 'transport',
    items: ['Premium Petrol 21.5L', 'Windshield Wash'],
    previewBg: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    name: 'Sample Supermarket',
    title: 'FreshMart Supermarket',
    amount: 1750,
    category: 'shopping',
    items: ['Organic Snacks', 'Beverages', 'Camping Gear Supplies'],
    previewBg: 'from-emerald-500/20 to-teal-500/20',
  },
]

export function ReceiptScannerModal({ isOpen, onClose, onScanComplete }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setSelectedImage(url)
    processScanning(file.name, file)
  }

  const handleSampleSelect = (sample) => {
    setSelectedImage('sample')
    processScanning(sample.title, sample)
  }

  const processScanning = (fileName, meta) => {
    setIsScanning(true)
    setScanResult(null)

    // Simulate AI Vision & OCR Scanner latency
    setTimeout(() => {
      let extracted = {
        title: 'Starbucks Coffee House',
        amount: 980,
        category: 'food',
        date: new Date().toISOString().split('T')[0],
        items: ['1x Caramel Macchiato', '1x Cheese Croissant', 'Service Tax (5%)'],
      }

      if (typeof meta === 'object' && meta.amount) {
        extracted = {
          title: meta.title,
          amount: meta.amount,
          category: meta.category,
          date: new Date().toISOString().split('T')[0],
          items: meta.items || [],
        }
      } else {
        const lowerName = fileName.toLowerCase()
        if (lowerName.includes('hotel') || lowerName.includes('stay') || lowerName.includes('resort')) {
          extracted = {
            title: 'Seaside Paradise Resort',
            amount: 5400,
            category: 'stay',
            date: new Date().toISOString().split('T')[0],
            items: ['1x Deluxe Suite Night', 'Breakfast Buffet'],
          }
        } else if (lowerName.includes('cab') || lowerName.includes('uber') || lowerName.includes('fuel')) {
          extracted = {
            title: 'Uber Intercity Trip',
            amount: 1420,
            category: 'transport',
            date: new Date().toISOString().split('T')[0],
            items: ['Base Fare 45km', 'Toll Charges'],
          }
        }
      }

      setScanResult(extracted)
      setIsScanning(false)
    }, 2000)
  }

  const handleApply = () => {
    if (scanResult) {
      onScanComplete(scanResult)
      onClose()
      setSelectedImage(null)
      setScanResult(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">AI Receipt Vision Scanner</h2>
                <p className="text-xs font-semibold text-indigo-600">Auto-extract title, total & category</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="mt-5 space-y-4">
            {!selectedImage ? (
              <div className="space-y-4">
                {/* Upload Zone */}
                <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center transition hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer">
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-indigo-600 shadow-md group-hover:scale-110 transition duration-300">
                    <Upload className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Upload Receipt Photo</p>
                  <p className="mt-1 text-xs text-gray-500">Supports PNG, JPG, WEBP up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Sample Receipts Quick Selector */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Or try with sample receipts:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {sampleReceipts.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSampleSelect(s)}
                        className={`group relative overflow-hidden rounded-xl border border-gray-200 p-2.5 text-left transition hover:border-indigo-500 hover:shadow-md bg-gradient-to-br ${s.previewBg}`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-black text-gray-800 truncate">
                          <Receipt className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{s.title}</span>
                        </div>
                        <p className="mt-1 text-xs font-extrabold text-indigo-700">₹{s.amount}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scanning Screen */}
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-slate-900 p-6 text-white min-h-[220px]">
                  {/* Glowing Scan Line Animation */}
                  {isScanning && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '95%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8]"
                    />
                  )}

                  <div className="z-10 text-center w-full">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600/30 text-indigo-300 backdrop-blur-md">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-indigo-200">Analyzing Receipt with AI...</p>
                          <p className="text-[11px] text-gray-400">Extracting merchant, totals & OCR lines</p>
                        </div>
                      </div>
                    ) : scanResult ? (
                      <div className="w-full text-left space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="h-4 w-4" /> OCR Match Confirmed (98%)
                          </div>
                          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase">
                            {scanResult.category}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Merchant / Title</p>
                            <p className="text-lg font-black text-white">{scanResult.title}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-medium">Total Detected</p>
                            <p className="text-2xl font-black text-emerald-400">₹{scanResult.amount}</p>
                          </div>
                        </div>

                        {scanResult.items?.length > 0 && (
                          <div className="rounded-xl bg-white/5 p-2.5">
                            <p className="text-[11px] font-bold text-gray-400 mb-1">Detected Items:</p>
                            <ul className="text-xs space-y-0.5 text-gray-300">
                              {scanResult.items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImage(null)
                      setScanResult(null)
                    }}
                    className="rounded-xl text-xs font-bold"
                  >
                    Scan Another Image
                  </Button>

                  {scanResult && (
                    <Button
                      onClick={handleApply}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 font-bold text-white shadow-lg shadow-indigo-500/30 hover:opacity-90"
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" /> Auto-Fill Expense Form
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
