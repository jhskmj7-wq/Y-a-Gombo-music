import { lazy, ComponentType } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasAlreadyBeenRefreshed = JSON.parse(
      window.sessionStorage.getItem("page_has_been_refreshed") || "false"
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page_has_been_refreshed", "false");
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenRefreshed) {
        window.sessionStorage.setItem("page_has_been_refreshed", "true");
        window.location.reload();
      }
      throw error;
    }
  });
}
