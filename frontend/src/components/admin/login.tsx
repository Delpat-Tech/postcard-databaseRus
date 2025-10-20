import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";

export default function LoginForm() {
    const { adminLogin, error } = useAuthStore();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!username || !password) {
            setLocalError("Username and password are required");
            return;
        }
        try {
            await adminLogin(username, password);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : String(err));
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    className="w-full p-2 border rounded"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="w-full p-2 border rounded"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {(localError || error) && (
                    <p className="text-sm text-red-600">{localError || error}</p>
                )}
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded w-full">
                    Login
                </button>
            </form>
        </div>
    );
}
