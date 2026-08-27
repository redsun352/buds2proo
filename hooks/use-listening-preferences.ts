import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_LISTENING_PREFERENCES,
  type ListeningPreferences,
  loadListeningPreferences,
  saveListeningPreferences,
} from "@/lib/buds2/preferences";

export function useListeningPreferences() {
  const [preferences, setPreferences] = useState<ListeningPreferences>(
    DEFAULT_LISTENING_PREFERENCES,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void loadListeningPreferences()
      .then((value) => {
        if (isMounted) setPreferences(value);
      })
      .finally(() => {
        if (isMounted) setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePreferences = useCallback(
    async (nextValues: Omit<ListeningPreferences, "updatedAt">) => {
      const savedValue = await saveListeningPreferences(nextValues);
      setPreferences(savedValue);
    },
    [],
  );

  return { preferences, isReady, updatePreferences };
}
