import { useCallback, useEffect, useState } from 'react';

/** Chrome, Edge and Android's "install this app" offer (not yet in the DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The browser offers installation once, often before React has mounted, so the
// offer is kept here from the moment the app loads.
let offer: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    offer = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    offer = null;
    notify();
  });
}

/**
 * Installing the family app on a phone or computer (client request, 20 Nov
 * 2026: the parent and student portal as a PWA). `canInstall` is true only
 * while the browser offers it; Safari never does (there it is Share → Add to
 * Home Screen), and an installed app is never offered again.
 */
export function useInstallPrompt(): { canInstall: boolean; install: () => Promise<void> } {
  const [canInstall, setCanInstall] = useState(offer !== null);

  useEffect(() => {
    const update = () => setCanInstall(offer !== null);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = useCallback(async () => {
    const current = offer;
    if (!current) return;
    offer = null;
    notify();
    try {
      await current.prompt();
      await current.userChoice;
    } catch {
      // The browser already used this offer; it makes a new one when it can.
    }
  }, []);

  return { canInstall, install };
}
