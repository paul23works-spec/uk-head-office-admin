import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { Mail, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import DisconnectGmailButton from './DisconnectGmailButton';

export const metadata = {
  title: 'Communications Integrations | UK Head Office',
};

export default async function CommunicationsIntegrationsPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  // Resolve the logged-in user's business employee ID (e.g. EMP-004)
  // to the actual Employee database ID (UUID).
  const employee = await prisma.employee.findUnique({
    where: {
      employeeId: user.employeeId,
    },
    select: {
      id: true,
    },
  });

  if (!employee) {
    throw new Error('Employee record not found');
  }

  // GmailConnection and WhatsAppConnection both reference Employee.id.
  const gmailConnection = await prisma.gmailConnection.findUnique({
    where: {
      employeeId: employee.id,
    },
  });

  const whatsAppConnection = await prisma.whatsAppConnection.findUnique({
    where: {
      employeeId: employee.id,
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Communications & Integrations
        </h1>

        <p className="text-muted-foreground mt-2">
          Manage your external communication services (Gmail, WhatsApp).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gmail Integration Card */}
        <div className="border rounded-xl p-6 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Mail className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-semibold">Gmail</h2>
            </div>

            {gmailConnection ? (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                Not Configured
              </span>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your professional Gmail account to allow the UK Head
              Office system to send and receive project emails on your behalf.
            </p>

            {gmailConnection ? (
              <div className="text-sm space-y-1 bg-slate-50 p-3 rounded-lg border">
                <p>
                  <strong>Account:</strong>{' '}
                  {gmailConnection.emailAddress}
                </p>

                <p>
                  <strong>Connected On:</strong>{' '}
                  {gmailConnection.connectedAt.toLocaleDateString()}
                </p>
              </div>
            ) : null}

            <div className="pt-4 flex gap-4">
              {!gmailConnection ? (
                <a
                  href="/api/integrations/gmail/auth"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Connect Gmail
                </a>
              ) : (
                <>
                  <a
                    href="/management/communications/gmail"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Open Workspace
                  </a>
                  <DisconnectGmailButton />
                </>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Business Integration Card */}
        <div className="border rounded-xl p-6 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <MessageCircle className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-semibold">
                WhatsApp Business
              </h2>
            </div>

            {whatsAppConnection ? (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                Not Configured
              </span>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Link your WhatsApp Business API number to interact with
              vendors, site engineers, and external stakeholders.
            </p>

            {whatsAppConnection ? (
              <div className="text-sm space-y-1 bg-slate-50 p-3 rounded-lg border">
                <p>
                  <strong>Phone Number ID:</strong>{' '}
                  {whatsAppConnection.phoneNumberId}
                </p>

                <p>
                  <strong>Connected On:</strong>{' '}
                  {whatsAppConnection.connectedAt.toLocaleDateString()}
                </p>
              </div>
            ) : null}

            <div className="pt-4">
              <button
                disabled
                className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                Contact Administrator
              </button>

              <p className="text-xs text-muted-foreground mt-2">
                WhatsApp Business provisioning is handled by IT
                Administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}