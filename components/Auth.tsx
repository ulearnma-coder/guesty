
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Auth component provides a login form for users to sign in.
 * It handles the logic for authentication against Supabase.
 */
const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary">
            <div className="w-full max-w-md p-8 space-y-8 bg-secondary rounded-lg shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-center text-white">Login</h1>
                    <p className="mt-2 text-center text-sm text-text-secondary">
                        Sign in to manage your restaurant
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-accent bg-primary placeholder-text-secondary text-text-primary rounded-t-md focus:outline-none focus:ring-highlight focus:border-highlight focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-accent bg-primary placeholder-text-secondary text-text-primary rounded-b-md focus:outline-none focus:ring-highlight focus:border-highlight focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                      <div className="bg-red-900/50 text-red-300 p-3 rounded-md text-sm">
                          <strong>Login failed:</strong> {error}
                      </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-highlight hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlight disabled:bg-gray-500"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;
