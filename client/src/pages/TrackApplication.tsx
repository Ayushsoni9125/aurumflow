import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeadById } from '../api';
import { Search, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatINR, cn } from '../lib/utils';

export default function TrackApplication() {
  const [searchId, setSearchId] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  const { data: lead, isLoading, isError, error } = useQuery({
    queryKey: ['lead', submittedId],
    queryFn: () => fetchLeadById(submittedId),
    enabled: !!submittedId,
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setSubmittedId(searchId.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="card p-6 md:p-8 mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-forest-900">Track Your Application</h1>
          <p className="text-charcoal-800 text-sm mt-1">
            Enter your Application ID below to check the current status of your gold loan application.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="e.g. AF-20231015-XYZ123"
              className="input-field pl-10 uppercase"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap" disabled={!searchId.trim()}>
            Track
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            {(error as any)?.response?.data?.error?.message || 'Application not found. Please check your ID and try again.'}
          </p>
        </div>
      )}

      {lead && (
        <div className="card p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-ivory-200">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  lead.status === 'SUBMITTED' ? "bg-blue-500" :
                  lead.status === 'APPROVED' ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="font-bold text-lg text-forest-900">{lead.status}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Application ID</p>
              <p className="font-mono text-sm bg-ivory-100 px-2 py-1 rounded inline-block">{lead.applicationId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-forest-900 uppercase tracking-wider border-b border-ivory-200 pb-2 mb-3">
                  <FileText className="w-4 h-4" /> Applicant Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-forest-900">{lead.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium text-forest-900">+91 {lead.mobileNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted On</span>
                    <span className="font-medium text-forest-900">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-forest-900 uppercase tracking-wider border-b border-ivory-200 pb-2 mb-3">
                  <CheckCircle2 className="w-4 h-4" /> Selected Scheme
                </h3>
                <div className="bg-gold-50/50 p-4 rounded-lg border border-gold-100">
                  <p className="font-bold text-forest-900">{lead.selectedPlan.name}</p>
                  <p className="text-xs text-charcoal-800 mt-1">
                    {lead.selectedPlan.annualInterestRatePercent}% p.a. Interest • Max {lead.selectedPlan.maxLtvPercent}% LTV
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-forest-900 uppercase tracking-wider border-b border-ivory-200 pb-2 mb-3">
                Valuation Summary
              </h3>
              <div className="bg-ivory-50 rounded-xl border border-ivory-200 p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Gross Weight</span>
                  <span className="font-medium text-forest-900">{lead.grossWeightGrams}g</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Net Weight</span>
                  <span className="font-medium text-forest-900">{lead.netWeightGrams}g</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Purity</span>
                  <span className="font-medium text-forest-900">{lead.karat} Karat</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Pure Gold</span>
                  <span className="font-medium text-forest-900">{parseFloat(lead.pureGoldGrams).toFixed(2)}g</span>
                </div>
                
                <div className="pt-4 border-t border-ivory-200">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500">Estimated Gold Value</span>
                    <span className="font-medium text-forest-900">{formatINR(lead.goldValueRupees)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-forest-900 text-white p-3 rounded-lg mt-3">
                    <span className="text-sm font-medium">Eligible Loan</span>
                    <span className="font-bold text-lg text-gold-400">{formatINR(lead.eligibleLoanRupees)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
