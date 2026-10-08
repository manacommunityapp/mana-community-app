import React, { useRef, useEffect } from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import { ArrowLeft, CheckCircle2, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';

export const OtpVerificationScreen: React.FC = () => {
  const {
    mobileNumber,
    otpCode,
    setOtpCode,
    resendCountdown,
    handleVerifyOtp,
    handleResendOtp,
    setCurrentStep,
  } = useResidentAuth();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first empty digit box on load
    const firstEmpty = otpCode.findIndex((d) => !d);
    if (firstEmpty !== -1 && inputRefs.current[firstEmpty]) {
      inputRefs.current[firstEmpty]?.focus();
    }
  }, []);

  const handleChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otpCode];
      updated[index] = '';
      setOtpCode(updated);
      return;
    }

    // Handle paste of full 6 digits
    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split('');
      const updated = [...otpCode];
      digits.forEach((d, i) => {
        if (index + i < 6) updated[index + i] = d;
      });
      setOtpCode(updated);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const updated = [...otpCode];
    updated[index] = clean.slice(-1);
    setOtpCode(updated);

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otpCode.every((d) => d.trim().length > 0);

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top Back Nav */}
        <button
          onClick={() => setCurrentStep('WELCOME_LOGIN')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#173B72] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change mobile number</span>
        </button>

        {/* Icon & Heading */}
        <div className="w-12 h-12 rounded-2xl bg-[#EEF4FE] text-[#2F6FED] border border-blue-100 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#173B72] mb-1.5">
          Verify your mobile number
        </h1>
        <p className="text-sm text-[#667085] leading-relaxed mb-6">
          We've sent a 6-digit OTP to{' '}
          <strong className="text-[#202124] font-semibold">+91 {mobileNumber}</strong>
        </p>

        {/* 6-Digit OTP Box Grid */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE3EE] shadow-sm mb-6">
          <div className="flex justify-between gap-2 sm:gap-3 max-w-sm mx-auto">
            {otpCode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none ${
                  digit
                    ? 'border-[#2F6FED] bg-[#EEF4FE] text-[#173B72] ring-2 ring-[#2F6FED]/20'
                    : 'border-[#DCE3EE] bg-white text-[#202124] focus:border-[#2F6FED] focus:ring-2 focus:ring-[#2F6FED]/20'
                }`}
              />
            ))}
          </div>

          {/* Quick Mock Code Hint */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#667085]">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Demo Mock OTP: <strong className="text-[#173B72]">582914</strong>
            </span>
            <button
              onClick={() => setOtpCode(['5', '8', '2', '9', '1', '4'])}
              className="text-[#2F6FED] font-semibold hover:underline"
            >
              Fill Mock
            </button>
          </div>
        </div>

        {/* Resend & Status */}
        <div className="flex items-center justify-between text-xs px-2">
          {resendCountdown > 0 ? (
            <span className="text-[#667085] flex items-center gap-1.5">
              <span>Resend OTP in</span>
              <strong className="text-[#173B72] font-mono font-bold">
                00:{resendCountdown.toString().padStart(2, '0')}
              </strong>
            </span>
          ) : (
            <button
              onClick={handleResendOtp}
              className="font-semibold text-[#2F6FED] hover:text-[#173B72] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend OTP</span>
            </button>
          )}

          <button
            onClick={() => setCurrentStep('WELCOME_LOGIN')}
            className="text-[#667085] hover:text-[#173B72] font-medium"
          >
            Wrong number?
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 space-y-2">
        <button
          onClick={handleVerifyOtp}
          disabled={!isOtpComplete}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isOtpComplete
              ? 'bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-[#173B72]/20 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>Verify</span>
        </button>
      </div>
    </div>
  );
};
