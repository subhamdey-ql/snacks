import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MyMenu, MyWallet } from "@/modules/me/types";

export const useMeAPI = () => {
  const useMyMenuQuery = () => useQuery({ queryKey: ["me", "menu"], queryFn: () => apiFetch.get<MyMenu>("/me/menu") });
  const useMyWalletQuery = () => useQuery({ queryKey: ["me", "wallet"], queryFn: () => apiFetch.get<MyWallet>("/me/wallet") });
  return { useMyMenuQuery, useMyWalletQuery };
};
