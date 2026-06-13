import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Eye, X, CheckCircle, Info, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react';

interface EmailLog {
  id: string;
  recipient: string;
  recipientRole: 'customer' | 'vendor';
  subject: string;
  body: string;
  status: 'api_sent' | 'simulated' | 'error';
  errorMessage?: string;
  timestamp: string;
  orderId: string;
}

interface Props {
  token: string | null;
  currentUserEmail?: string;
}

export const EmailNotificationLogs: React.FC<Props> = ({ token, currentUserEmail }) => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  const fetchEmails = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/emails', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        setEmails(data.sort((a: EmailLog, b: EmailLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (err) {
      console.error('Error fetching email notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    
    // Auto-refresh on order updates
    const interval = setInterval(fetchEmails, 60000);
    return () => clearInterval(interval);
  }, [token]);

  if (!token) return null;

  return (
    <div id="email-logs-service-widget" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-lg">
            <Mail className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
              Email Notifications Hub
              <span className="inline-flex items-center gap-1 text-[8px] font-bold font-mono px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full">
                API Service Live
              </span>
            </h3>
            <p className="text-[10px] text-neutral-500">Real-time outbound SMTP &amp; Resend API transactions log</p>
          </div>
        </div>
        
        <button
          onClick={fetchEmails}
          disabled={loading}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 rounded-lg transition duration-200"
          title="Refresh emails log"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-550' : ''}`} />
        </button>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 space-y-2">
          <Mail className="h-6 w-6 text-neutral-300 mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">No system email alerts triggered yet</p>
          <p className="text-[9.5px] text-neutral-400 max-w-[250px] mx-auto leading-relaxed">
            Emails are dispatched instantly when you check out products or receive customer purchase requests.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {emails.map((email) => {
            const isVendor = email.recipientRole === 'vendor';
            return (
              <div 
                key={email.id}
                className="p-3 bg-neutral-25/55 dark:bg-neutral-950/20 border border-neutral-150 dark:border-neutral-850 rounded-xl hover:shadow-xs transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5"
                id={`email-log-${email.id}`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      isVendor 
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/20' 
                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20'
                    }`}>
                      {isVendor ? 'Vendor Notice' : 'Customer Receipt'}
                    </span>
                    
                    <span className="text-[10px] font-mono text-neutral-450">
                      {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    {email.status === 'api_sent' && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold font-mono px-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded">
                        ● Outbound API Active
                      </span>
                    )}
                    {email.status === 'simulated' && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold font-mono px-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded">
                        ● Log Sandbox Verified
                      </span>
                    )}
                    {email.status === 'error' && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold font-mono px-1 bg-rose-50 dark:bg-rose-950/30 text-rose-650 dark:text-rose-455 rounded">
                        ⚠️ Send Failed
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    {email.subject}
                  </h4>
                  
                  <p className="text-[10px] text-neutral-450 truncate">
                    To: <span className="font-mono text-neutral-600 dark:text-neutral-350">{email.recipient}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEmail(email)}
                  className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-250 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer self-stretch sm:self-auto justify-center"
                  id={`view-email-btn-${email.id}`}
                >
                  <Eye className="h-3 w-3" />
                  Preview Mail
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Info sandbox notification */}
      <div className="p-3 bg-indigo-50/40 dark:bg-neutral-950/40 border border-neutral-150 dark:border-neutral-850 rounded-xl flex items-start gap-2 text-[10px] text-neutral-500 leading-normal">
        <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
        <p>
          <strong>API Sandbox Node:</strong> Adding <code className="bg-white dark:bg-neutral-900 border px-1 rounded font-mono">RESEND_API_KEY</code> to your dashboard credentials upgrades this service to trigger actual outbound mail alerts.
        </p>
      </div>

      {/* Email overlay preview lightbox modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn overflow-hidden">
            {/* Header / Meta panel */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white">Email Notification Sandbox Preview</h4>
                  <p className="text-[10px] text-neutral-450">ID: {selectedEmail.id} • Order: #{selectedEmail.orderId}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedEmail(null)}
                className="p-1 bg-neutral-100 hover:bg-neutral-250 dark:bg-neutral-850 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300 rounded-full transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Email Headers Info */}
            <div className="px-5 py-3.5 bg-neutral-100/50 dark:bg-neutral-900 border-b border-neutral-150 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 text-neutral-400 w-16 uppercase text-[9.5px] font-bold">To:</td>
                    <td className="py-1 font-mono text-indigo-650 dark:text-indigo-400 font-bold">{selectedEmail.recipient}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-400 uppercase text-[9.5px] font-bold">From:</td>
                    <td className="py-1 font-mono">notifications@marketplace.com (Verified Resend Relay)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-400 uppercase text-[9.5px] font-bold">Subject:</td>
                    <td className="py-1 text-neutral-900 dark:text-white font-bold">{selectedEmail.subject}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-400 uppercase text-[9.5px] font-bold">Status:</td>
                    <td className="py-1">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                        selectedEmail.status === 'api_sent' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' 
                          : selectedEmail.status === 'error'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200/50'
                          : 'bg-indigo-50 text-indigo-650 border border-indigo-200/50'
                      }`}>
                        {selectedEmail.status === 'api_sent' && 'DELIVERED TO OUTBOX'}
                        {selectedEmail.status === 'simulated' && 'LOGGED FOR SANDBOX DEMO'}
                        {selectedEmail.status === 'error' && 'INTEGRATION FAIL'}
                      </span>
                      {selectedEmail.errorMessage && (
                        <p className="text-[10px] font-mono text-rose-500 mt-1 uppercase max-h-12 overflow-y-auto">{selectedEmail.errorMessage}</p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Email HTML Body Rendered inside sandbox container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-neutral-950 flex items-start justify-center h-full">
              <div 
                className="bg-white rounded-xl shadow-md p-2 w-full max-w-lg overflow-hidden border"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            </div>

            {/* Close visual footer */}
            <div className="p-3 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-right">
              <button 
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
