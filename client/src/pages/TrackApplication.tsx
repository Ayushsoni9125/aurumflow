import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '../api';
import { FileText, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { formatINR, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function TrackApplication() {
  const userId = localStorage.getItem('userId') || '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-leads', userId],
    queryFn: () => fetchLeads(undefined, userId),
  });

  return (
    <div className="max-w-4xl mx-auto w-full px-1 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-900">Application History</h1>
        <p className="text-charcoal-800 text-xs sm:text-sm mt-1 sm:mt-2">
          View and track all your past and current gold loan applications.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 gap-2 text-charcoal-700">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <p className="text-xs">Fetching applications...</p>
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm leading-relaxed">Failed to load application history. Please try again.</p>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="card p-8 sm:p-12 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-base sm:text-lg font-bold text-forest-900">No applications found</h3>
          <p className="text-charcoal-800 text-xs sm:text-sm mt-1 mb-6">You haven't submitted any gold loan applications yet.</p>
          <Link to="/apply" className="btn-primary w-full sm:w-auto">
            Start New Application
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((lead: any) => (
            <div key={lead.applicationId} className="card p-4 sm:p-6 transition-all hover:shadow-md border border-ivory-200 hover:border-gold-300">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-ivory-200 pb-3 mb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs sm:text-sm bg-ivory-100 px-2 py-0.5 rounded text-forest-900 font-bold break-all">
                      {lead.applicationId}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <h3 className="font-bold text-forest-900 text-base sm:text-lg mt-1">{lead.selectedPlan?.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5",
                    lead.status === 'SUBMITTED' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    lead.status === 'APPROVED' ? "bg-green-50 text-green-700 border border-green-200" : 
                    "bg-red-50 text-red-700 border border-red-200"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      lead.status === 'SUBMITTED' ? "bg-blue-500" :
                      lead.status === 'APPROVED' ? "bg-green-500" : "bg-red-500"
                    )} />
                    {lead.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-ivory-50/50 p-3 rounded-lg sm:bg-transparent sm:p-0">
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Applicant</p>
                  <p className="font-medium text-xs sm:text-sm text-forest-900 truncate">{lead.customerName}</p>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Mobile</p>
                  <p className="font-medium text-xs sm:text-sm text-forest-900">{lead.maskedMobile}</p>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Net Weight</p>
                  <p className="font-medium text-xs sm:text-sm text-forest-900">{lead.netWeightGrams}g ({lead.karat}K)</p>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Eligible Loan</p>
                  <p className="font-bold text-sm sm:text-lg text-gold-600">{formatINR(lead.eligibleLoanRupees)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
