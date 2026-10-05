"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./documentos.module.css";

type DocumentoModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

/** O dialog nativo mantém foco, Escape e conteúdo de fundo inativo. */
export function DocumentoModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: DocumentoModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn(styles.modal, wide && styles.modalWide)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const fields = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((field) => field.getClientRects().length > 0);
        const first = fields[0];
        const last = fields.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last &&
          first
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className={styles.modalFrame}>
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Documentos da oficina</p>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </header>
        <div className={styles.modalBody}>{children}</div>
        {footer && <footer className={styles.modalFooter}>{footer}</footer>}
      </div>
    </dialog>
  );
}
