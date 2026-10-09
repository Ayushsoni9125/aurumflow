import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { fetchQuote, submitLead, type QuoteResponse } from '../api';
import { formatINR, cn } from '../lib/utils';
import { CheckCircle2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// Re-implementing schemas for client-side validation
const formSchema = z.object({
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').regex(/^[\p{L}\p{M} ]+$/u, 'Letters and spaces only'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  grossWeightGrams: z.coerce.number().positive('Must be > 0').max(1000, 'Cannot exceed 1000g'),
  netWeightGrams: z.coerce.number().positive('Must be > 0').max(1000, 'Cannot exceed 1000g'),
  karat: z.coerce.number().refine(val => [18, 22, 24].includes(val), 'Karat must be 18, 22, or 24'),
}).refine(data => data.netWeightGrams <= data.grossWeightGrams, {
  message: 'Net weight cannot exceed gross weight',
  path: ['netWeightGrams']
});

type FormData = z.infer<typeof formSchema>;

export default function ApplicationFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [applicationId, setApplicationId] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: { karat: 22 }
  });

  const formValues = watch();

  const quoteMutation = useMutation({
    mutationFn: fetchQuote,
    onSuccess: (data) => {
      setQuote(data);
      setApiError(null);
      // Auto-select plan if none selected and quote is fresh
      if (data.schemes.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data.schemes[0].schemeId);
      } else if (data.schemes.length > 0 && selectedPlanId) {
        // Ensure selected plan still exists
        const exists = data.schemes.find(s => s.schemeId === selectedPlanId);
        if (!exists) setSelectedPlanId(data.schemes[0].schemeId);
      }
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.error?.message || 'Failed to fetch quote');
      setQuote(null);
    }
  });

  const submitMutation = useMutation({
    mutationFn: submitLead,
    onSuccess: (data) => {
      setApplicationId(data.applicationId);
      setStep(4); // Success
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        // Duplicate handling
        const existingAppId = error.response.data.error.fields?.[0]?.message.match(/AF-[\w-]+/)?.[0] || 'an existing application';
        setApiError(`We found a recent application (${existingAppId}) associated with this mobile number. You can only have one active application within 7 days.`);
      } else {
        setApiError(error.response?.data?.error?.message || 'Failed to submit application');
      }
    }
  });

  // Debounced quote fetch when form values change (if on step 2)
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        if (isValid) {
          quoteMutation.mutate(formValues as any);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formValues.grossWeightGrams, formValues.netWeightGrams, formValues.karat, step, isValid]);

  const onStep1Submit = () => setStep(2);
  
  const onStep2Submit = () => {
    if (selectedPlanId) setStep(3);
  };

  const onFinalSubmit = () => {
    if (selectedPlanId && quote) {
      setApiError(null);
      submitMutation.mutate({
        ...formValues,
        selectedPlanId
      });
    }
  };

  if (step === 4) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="card max-w-lg w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-forest-900">Application Submitted</h2>
            <p className="text-charcoal-800 mt-2">Your application has been received successfully.</p>
          </div>
          <div className="bg-ivory-200 p-4 rounded-lg inline-block">
            <p className="text-sm text-charcoal-800 font-medium">Application ID</p>
            <p className="text-xl font-bold font-mono text-forest-900 mt-1">{applicationId}</p>
          </div>
          <p className="text-sm text-gray-500">
            Please keep this ID for your records. Our team will contact you shortly.
          </p>
          <button onClick={() => window.location.reload()} className="btn-secondary w-full">
            Start New Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-ivory-200 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gold-500 transition-all duration-300 -z-10" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
          
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center bg-ivory-100 px-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                s === step ? "border-gold-500 bg-white text-gold-600" : s < step ? "border-gold-500 bg-gold-500 text-white" : "border-ivory-300 bg-white text-gray-400"
              )}>
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={cn("text-xs mt-2 font-medium", s <= step ? "text-forest-900" : "text-gray-400")}>
                {s === 1 ? 'Details' : s === 2 ? 'Quote' : 'Review'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold">
            {step === 1 && "Estimate your eligible loan"}
            {step === 2 && "Select a loan scheme"}
            {step === 3 && "Review and submit"}
          </h1>
          <p className="text-charcoal-800 text-sm mt-1">
            {step === 1 && "Enter your details to get a preliminary valuation based on today's rate."}
            {step === 2 && "Here is your preliminary quote based on the gold provided."}
            {step === 3 && "Please review your details before confirming the application."}
          </p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{apiError}</p>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-forest-900 mb-1">Full Name</label>
                <input {...register('customerName')} className="input-field" placeholder="John Doe" />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-900 mb-1">Mobile Number</label>
                <input {...register('mobileNumber')} type="tel" inputMode="numeric" className="input-field" placeholder="9876543210" maxLength={10} />
                {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>}
              </div>
            </div>

            <div className="border-t border-ivory-200 pt-6">
              <h3 className="text-sm font-semibold text-forest-900 mb-4 uppercase tracking-wider">Gold Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-forest-900 mb-1">Gross Weight (g)</label>
                  <input {...register('grossWeightGrams')} type="number" step="0.01" inputMode="decimal" className="input-field" placeholder="0.00" />
                  {errors.grossWeightGrams && <p className="text-red-500 text-xs mt-1">{errors.grossWeightGrams.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-900 mb-1">Net Weight (g)</label>
                  <input {...register('netWeightGrams')} type="number" step="0.01" inputMode="decimal" className="input-field" placeholder="0.00" />
                  {errors.netWeightGrams && <p className="text-red-500 text-xs mt-1">{errors.netWeightGrams.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-900 mb-1">Karat (Purity)</label>
                  <select {...register('karat')} className="input-field bg-white">
                    <option value={24}>24K</option>
                    <option value={22}>22K</option>
                    <option value={18}>18K</option>
                  </select>
                  {errors.karat && <p className="text-red-500 text-xs mt-1">{errors.karat.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="btn-primary flex items-center gap-2">
                Continue to Quote <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-forest-900 text-white p-4 rounded-lg">
              <div>
                <p className="text-xs uppercase text-gray-300 font-medium tracking-wider">Estimated Gold Value</p>
                <div className="flex items-center gap-3 mt-1">
                  {quoteMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
                  ) : (
                    <>
                      <span className="text-2xl font-bold font-display text-gold-400">
                        {quote ? formatINR(quote.goldValueRupees) : '---'}
                      </span>
                      <span className="text-sm bg-forest-800 px-2 py-1 rounded text-gray-300">
                        Pure: {quote ? quote.pureGoldGrams.toFixed(2) : '--'}g
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {quote && <p className="text-xs text-gray-500 italic text-right mt-[-1rem] pr-2">{quote.mockRateDisclosure}</p>}

            <div>
              <h3 className="font-medium text-forest-900 mb-3">Available Schemes</h3>
              
              {quoteMutation.isPending && !quote && (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>
              )}
              
              {quote && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quote.schemes.map((scheme) => (
                    <div 
                      key={scheme.schemeId}
                      onClick={() => setSelectedPlanId(scheme.schemeId)}
                      className={cn(
                        "border rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden",
                        selectedPlanId === scheme.schemeId ? "border-gold-500 bg-gold-50/30 ring-1 ring-gold-500 shadow-sm" : "border-ivory-200 hover:border-gold-300 bg-white"
                      )}
                    >
                      {selectedPlanId === scheme.schemeId && (
                        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                          <div className="absolute top-[-15px] right-[-15px] bg-gold-500 text-white w-12 h-12 rotate-45"></div>
                          <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-white z-10" />
                        </div>
                      )}
                      <h4 className="font-bold text-forest-900">{scheme.schemeName}</h4>
                      <p className="text-sm text-charcoal-800 mt-1">{scheme.repaymentDescription}</p>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 pt-4 border-t border-ivory-200">
                        <div>
                          <p className="text-xs text-gray-500">Interest</p>
                          <p className="font-medium text-forest-900">{scheme.annualInterestRatePercent}% p.a.</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Max LTV</p>
                          <p className="font-medium text-forest-900">{scheme.maxLtvPercent}%</p>
                        </div>
                        <div className="col-span-2 bg-ivory-100 p-2 rounded mt-1">
                          <p className="text-xs text-gray-500">Eligible Loan Amount</p>
                          <p className="font-bold text-lg text-gold-600">{formatINR(scheme.eligibleLoanRupees)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-ivory-200">
              <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button onClick={onStep2Submit} disabled={!selectedPlanId || quoteMutation.isPending || !quote} className="btn-primary">
                Review Application
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && quote && (
          <div className="space-y-6">
            <div className="bg-ivory-100 rounded-lg p-5 border border-ivory-200 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-ivory-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Applicant</p>
                  <p className="font-medium text-forest-900">{formValues.customerName}</p>
                  <p className="text-sm text-charcoal-800">+91 {formValues.mobileNumber.slice(0, 4)}XXXX{formValues.mobileNumber.slice(8)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Gold Details</p>
                  <p className="font-medium text-forest-900">{formValues.netWeightGrams}g Net ({formValues.karat}K)</p>
                  <p className="text-sm text-charcoal-800">Gross: {formValues.grossWeightGrams}g</p>
                </div>
              </div>
              
              {(() => {
                const scheme = quote.schemes.find(s => s.schemeId === selectedPlanId)!;
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Selected Plan</p>
                      <p className="font-medium text-forest-900">{scheme.schemeName}</p>
                      <p className="text-sm text-charcoal-800">{scheme.annualInterestRatePercent}% p.a. • {scheme.tenureMonths} mo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Eligible Loan</p>
                      <p className="font-bold text-xl text-gold-600">{formatINR(scheme.eligibleLoanRupees)}</p>
                      <p className="text-xs text-charcoal-800 mt-1">Gold Value: {formatINR(quote.goldValueRupees)}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Preliminary Offer Disclaimer</p>
              <p>This is a preliminary quote based on the details provided and a simulated gold rate. Final loan approval and exact valuation require in-branch physical verification of the gold ornaments.</p>
            </div>

            <div className="flex justify-between pt-4 border-t border-ivory-200">
              <button onClick={() => setStep(2)} className="btn-secondary" disabled={submitMutation.isPending}>Back</button>
              <button 
                onClick={onFinalSubmit} 
                disabled={submitMutation.isPending} 
                className="btn-primary flex items-center gap-2"
              >
                {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
