"use client";

import { useEffect } from "react";

/** Largura ideal do painel admin no mobile (~720px). */
const ADMIN_VIEWPORT = "width=720";
const DEFAULT_VIEWPORT = "width=device-width, initial-scale=1";

/**
 * Ajusta o viewport da área admin para ~720px.
 * Layout legível no celular, com botões e cards em tamanho confortável.
 */
export function AdminDesktopViewport() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    const previous = meta?.getAttribute("content") ?? DEFAULT_VIEWPORT;

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", ADMIN_VIEWPORT);
    document.documentElement.classList.add("admin-desktop-viewport");
    document.body.classList.add("admin-desktop-viewport");

    return () => {
      meta?.setAttribute("content", previous || DEFAULT_VIEWPORT);
      document.documentElement.classList.remove("admin-desktop-viewport");
      document.body.classList.remove("admin-desktop-viewport");
    };
  }, []);

  return null;
}
