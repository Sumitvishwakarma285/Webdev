import { useEffect, useState, useRef } from "react";
import { WebContainer } from "@webcontainer/api";

export function useWebContainer() {
  const webContainerRef = useRef(null); // Store the WebContainer instance
  const [webContainer, setWebContainer] = useState(null);

  useEffect(() => {
    async function bootWebContainer() {
      if (!webContainerRef.current) { // Ensure only one instance is created
        const instance = await WebContainer.boot();
        webContainerRef.current = instance;
        setWebContainer(instance);
      }
    }

    bootWebContainer();

    return () => {
      // Cleanup on unmount (Optional)
      webContainerRef.current?.teardown?.();
      webContainerRef.current = null;
    };
  }, []);

  return webContainer;
}
