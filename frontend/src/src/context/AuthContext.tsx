import  { createContext, useState, useContext, useEffect} from 'react';
import type { ReactNode } from 'react';

interface User {
    user_id: number
    username: string
    email: string
}

interface AuthContextType {
    user: User | null
    login: (userData: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    // Check if already logged in
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await fetch('http://localhost:3000/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setUser(data.user);
                }
            } catch (e) {
                console.error("Session recovery failed", e);
                localStorage.removeItem('token');
            }
        };
        verifyToken();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    }

    return (
    <AuthContext.Provider value={{ user, login, logout }}>
        {children}
    </AuthContext.Provider>
    )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
};