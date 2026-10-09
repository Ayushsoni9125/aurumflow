import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '../api';
import { FileText, CheckCircle2, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { formatINR, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function TrackApplication() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-leads'],
    queryFn: () => fetchLeads(),
  });

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-forest-900">Application History</h1>
        <p className="text-charcoal-800 mt-2">
          View and track all your past and current gold loan applications.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Failed to load application history. Please try again.</p>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="card p-12 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-forest-900">No applications found</h3>
          <p className="text-charcoal-800 mt-2 mb-6">You haven't submitted any gold loan applications yet.</p>
          <Link to="/apply" className="btn-primary">
            Start New Application
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((lead: any) => (
            <div key={lead.applicationId} className="card p-6 animate-in fade-in slide-in-from-bottom-4 transition-shadow hover:shadow-md border border-ivory-200 hover:border-gold-300">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-ivory-200 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm bg-ivory-100 px-2 py-1 rounded text-forest-900 font-bold">
                      {lead.applicationId}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <h3 className="font-bold text-forest-900 text-lg">{lead.selectedPlan?.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Applicant Name</p>
                  <p className="font-medium text-forest-900">{lead.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mobile</p>
                  <p className="font-medium text-forest-900">{lead.maskedMobile}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Net Weight</p>
                  <p className="font-medium text-forest-900">{lead.netWeightGrams}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Eligible Loan</p>
                  <p className="font-bold text-gold-600 text-lg">{formatINR(lead.eligibleLoanRupees)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
