'use client';

import { useState } from 'react';

type SetupStatus = {
  sallaConnected: boolean;
  whatsappConnected: boolean;
  messageConfigured: boolean;
  subscriptionActive: boolean;
};

export default function OnboardingChecklist({ status }: { status?: SetupStatus }) {
  const [dismissed, setDismissed] = useState(false);

  // For visual purposes if not passed, pretend first 2 are done
  const currentStatus = status || {
    sallaConnected: true,
    whatsappConnected: false,
    messageConfigured: false,
    subscriptionActive: false,
  };

  const steps = [
    { id: 1, title: 'ربط متجر سلة', done: currentStatus.sallaConnected },
    { id: 2, title: 'مسح رمز واتساب', done: currentStatus.whatsappConnected },
    { id: 3, title: 'تخصيص رسالة التذكير', done: currentStatus.messageConfigured },
    { id: 4, title: 'تفعيل الاشتراك', done: currentStatus.subscriptionActive },
  ];

  const allDone = steps.every((s) => s.done);

  if (allDone || dismissed) return null;

  const totalDone = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((totalDone / steps.length) * 100);

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm relative overflow-hidden" dir="rtl" lang="ar">
      <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">أكمل إعداد حسابك</h2>
          <p className="text-sm text-slate-500 mt-1">
            أنت على بعد خطوات قليلة من استرجاع مبيعاتك المفقودة
          </p>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="إخفاء"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.id} className={`flex items-center p-3 rounded-lg border ${step.done ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-100'}`}>
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ml-3 ${step.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              {step.done ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              ) : (
                <span className="text-xs font-medium">{step.id}</span>
              )}
            </div>
            <span className={`text-sm ${step.done ? 'text-slate-500 line-through' : 'text-slate-700 font-medium'}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
