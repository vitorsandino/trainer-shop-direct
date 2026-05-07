import { useEffect, useState } from "react";
import { getCurrentUser, subscribeAuth, type User } from "@/lib/auth";
import { cartCount, subscribeCart } from "@/lib/cart";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    setUser(getCurrentUser());
    return subscribeAuth(() => setUser(getCurrentUser()));
  }, []);
  return user;
}

export function useCartCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(cartCount());
    return subscribeCart(() => setN(cartCount()));
  }, []);
  return n;
}
