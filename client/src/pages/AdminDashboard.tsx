import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeads, fetchSchemes } from '../api';
import { formatINR } from '../lib/utils';
import { Loader2, Inbox } from 'lucide-react';

export default function AdminDashboard() {
  const [filterPlanId, setFilterPlanId] = useState<string>('');

  const { data: schemes } = useQuery({
    queryKey: ['schemes'],
    queryFn: fetchSchemes,
  });

  const { data: leadsData, isLoading, isError } = useQuery({
    queryKey: ['leads', filterPlanId],
    queryFn: () => fetchLeads(filterPlanId || undefined),
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-forest-900">Leads Dashboard</h1>
          <p className="text-sm text-charcoal-800">Manage and view all incoming gold loan applications.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-forest-900">Filter by Plan:</label>
          <select 
            className="input-field py-2 text-sm w-48"
            value={filterPlanId}
            onChange={(e) => setFilterPlanId(e.target.value)}
          >
            <option value="">All Plans</option>
            {schemes?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-charcoal-800">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-4" />
            <p>Loading leads...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-600">
            <p>Failed to load leads. Please try again later.</p>
          </div>
        ) : !leadsData || leadsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-charcoal-800">
            <Inbox className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-forest-900">No applications found</p>
            <p className="text-sm">There are no leads matching your current filter.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-100 border-b border-ivory-200">
                <th className="px-6 py-4 text-xs font-semibold text-forest-900 uppercase tracking-wider">Application ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-forest-900 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-forest-900 uppercase tracking-wider">Gold (Net)</th>
                <th className="px-6 py-4 text-xs font-semibold text-forest-900 uppercase tracking-wider">Scheme</th>
                <th className="px-6 py-4 text-xs font-semibold text-forest-900 uppercase tracking-wider">Eligible Loan</th>
                <th className="px-6 py-4 text-xs font-semibold text-forest-900 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-forest-900 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {leadsData.map((lead: any) => (
                <tr key={lead.applicationId} className="hover:bg-ivory-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-forest-900">
                    {lead.applicationId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-forest-900">{lead.customerName}</div>
                    <div className="text-sm text-gray-500">+91 {lead.maskedMobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-800">
                    {lead.netWeightGrams}g
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-800">
                    {lead.selectedPlan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gold-600">
                    {formatINR(lead.eligibleLoanRupees)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
        <p><strong>Note:</strong> This is a demo administrative view. In a production environment, this page would be protected by strict authentication and authorization controls.</p>
      </div>
    </div>
  );
}
