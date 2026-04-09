/**
 * ユーザー基礎情報をlocalStorageで管理するカスタムフック
 *
 * 入口Bを使う際の経理方式・青色申告などを保存し、2回目以降の利用を快適にする。
 */
import { useCallback, useEffect, useState } from "react";
import type { AccountingMethod, EntityType, ReturnType } from "./treatmentDecision";

const STORAGE_KEY = "sakutto-user-profile";

export interface StoredProfile {
  accountingMethod?: AccountingMethod;
  returnType?: ReturnType;
  entityType?: EntityType;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<StoredProfile>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredProfile) : {};
    } catch {
      return {};
    }
  });

  // localStorageに保存
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // 保存失敗は無視（プライベートブラウジング等）
    }
  }, [profile]);

  const setAccountingMethod = useCallback((method: AccountingMethod) => {
    setProfile((prev) => ({ ...prev, accountingMethod: method }));
  }, []);

  const setReturnType = useCallback((type: ReturnType) => {
    setProfile((prev) => ({ ...prev, returnType: type }));
  }, []);

  const setEntityType = useCallback((type: EntityType) => {
    setProfile((prev) => ({ ...prev, entityType: type }));
  }, []);

  const clearProfile = useCallback(() => {
    setProfile({});
  }, []);

  return {
    profile,
    setAccountingMethod,
    setReturnType,
    setEntityType,
    clearProfile,
  };
}
