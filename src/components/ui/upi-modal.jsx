import { Check, Copy, QrCode, X } from 'lucide-react'
import { useState } from 'react'
import QRCodeRaw from 'react-qr-code'

import { Button } from '@/components/ui/button'
import { generateUpiLink } from '@/utils/upi'

const QRCode =
  QRCodeRaw?.default?.default ||
  QRCodeRaw?.default?.QRCode ||
  QRCodeRaw?.QRCode ||
  QRCodeRaw?.default ||
  QRCodeRaw

export function UpiPaymentModal({ isOpen, onClose, upiId, name, amount, tripName }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const upiUrl = generateUpiLink({
    pa: upiId,
    pn: name,
    am: amount,
    tn: `${tripName || 'FareSplit'} payment`,
  })

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Pay via UPI App / QR</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center text-center">
          {/* High-res Scannable QR Code */}
          <div className="rounded-2xl border-2 border-indigo-100 bg-white p-4 shadow-md">
            <QRCode value={upiUrl || `upi://pay?pa=${upiId}`} size={180} />
          </div>

          <div className="mt-3 text-xs text-gray-500 font-medium">
            Scan using <span className="font-bold text-indigo-600">Google Pay</span>,{' '}
            <span className="font-bold text-indigo-600">PhonePe</span>,{' '}
            <span className="font-bold text-indigo-600">Paytm</span>, or{' '}
            <span className="font-bold text-indigo-600">BHIM</span>
          </div>

          {/* Payment details */}
          <div className="mt-4 w-full rounded-2xl bg-gray-50 p-3 text-left border border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Payee:</span>
              <span className="font-bold text-gray-900">{name}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>UPI ID:</span>
              <span className="font-mono font-bold text-indigo-600">{upiId}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm font-extrabold text-gray-900 border-t border-gray-200/60 pt-1.5">
              <span>Amount:</span>
              <span className="text-emerald-600">₹{Number(amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex w-full flex-col gap-2">
            <Button
              onClick={() => {
                window.location.href = upiUrl
              }}
              className="h-11 w-full rounded-xl bg-indigo-600 font-bold hover:bg-indigo-700 shadow-md"
            >
              Open UPI App Direct
            </Button>
            <Button
              onClick={copyUpiId}
              variant="outline"
              className="h-10 w-full rounded-xl border-gray-200 text-gray-700"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> UPI ID Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4 text-gray-500" /> Copy UPI ID
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
