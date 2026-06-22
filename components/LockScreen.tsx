import React, { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface LockScreenProps {
    onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
    const [code, setCode] = useState(['', '', '']);
    const [error, setError] = useState(false);
    const correctCode = ['P', 'M', 'A'];

    const handleInput = (index: number, value: string) => {
        if (value.length > 1) value = value[value.length - 1];

        const newCode = [...code];
        newCode[index] = value.toUpperCase();
        setCode(newCode);
        setError(false);

        // Auto move focus
        if (value && index < 2) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.join('') === 'PMA') {
            onUnlock();
        } else {
            setError(true);
            setCode(['', '', '']);
            document.getElementById('otp-0')?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl transition-all duration-500">
            <div className="bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20 backdrop-filter backdrop-blur-md w-full max-w-sm text-center">
                <div className="mb-6 flex justify-center">
                    <div className={`p-4 rounded-full ${error ? 'bg-red-500/20' : 'bg-blue-500/20'} transition-colors`}>
                        {error ? <Lock className="w-8 h-8 text-red-400" /> : <Lock className="w-8 h-8 text-blue-400" />}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Restricted Access</h2>
                <p className="text-gray-300 mb-8">Type PMA for unlock</p>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-3 mb-8">
                        {code.map((digit, idx) => (
                            <input
                                key={idx}
                                id={`otp-${idx}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInput(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-transparent text-white focus:outline-none transition-all
                                    ${error ? 'border-red-500 animate-shake' : 'border-white/30 focus:border-blue-400 focus:bg-blue-500/10'}`}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/30"
                    >
                        Unlock Application
                    </button>
                </form>
            </div>
        </div>
    );
}
