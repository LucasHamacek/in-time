import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import type { UserProfile } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Create or get user profile from backend
          const response = await apiRequest("POST", "/api/user", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          });
          
          const profile = await response.json();
          setUserProfile(profile);
        } catch (error) {
          console.error("Error creating/fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const register = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    
    const response = await apiRequest("PUT", `/api/user/${user.uid}`, updates);
    const updatedProfile = await response.json();
    setUserProfile(updatedProfile);
    return updatedProfile;
  };

  return {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };
}
