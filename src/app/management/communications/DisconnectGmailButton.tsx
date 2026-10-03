'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DisconnectGmailButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const router = useRouter();

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/gmail/disconnect', {
        method: 'POST',
      });
      if (res.ok) {
        setShowConfirm(false);
        router.refresh();
      } else {
        console.error('Failed to disconnect Gmail');
        setIsDisconnecting(false);
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      setIsDisconnecting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        Disconnect Gmail
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Disconnect Gmail?</h3>
            <p className="text-sm text-slate-500">
              UK Enterprise will no longer be able to access or send emails through this Gmail account.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDisconnecting}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect Gmail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
