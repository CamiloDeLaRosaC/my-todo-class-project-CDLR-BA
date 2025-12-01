import { createContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";

export const AuthenticatorContext = createContext({
    isAuthenticated: false,
    user: null as User | null,
    login: ({ email, password }: { email: string, password: string }) => Promise.resolve(),
    logout: () => Promise.resolve(),
    loading: true
});

export const AuthenticatorProvider = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = async ({ email, password }: { email: string, password: string }) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error("Error login:", error);
            alert("Error al iniciar sesión: " + error.message);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error logout:", error);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthenticated(!!currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    return (
        <AuthenticatorContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthenticatorContext.Provider>
    );
};