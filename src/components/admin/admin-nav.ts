import {
  LayoutDashboard,
  CalendarClock,
  ListOrdered,
  LayoutGrid,
  BarChart3,
  PanelBottom,
  Settings,
  CalendarCog,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type AdminTab =
  | "visao"
  | "agendamentos"
  | "fila"
  | "agenda"
  | "portfolio"
  | "estatisticas"
  | "footer"
  | "config"
  | "documentos";

export type AdminNavItem = {
  id: AdminTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Itens principais no bottom nav mobile */
  mobilePrimary?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    id: "visao",
    label: "Visão geral",
    shortLabel: "Visão",
    icon: LayoutDashboard,
    mobilePrimary: true,
  },
  {
    id: "agendamentos",
    label: "Agendamentos",
    shortLabel: "Agenda",
    icon: CalendarClock,
    mobilePrimary: true,
  },
  {
    id: "fila",
    label: "Fila virtual",
    shortLabel: "Fila",
    icon: ListOrdered,
    mobilePrimary: true,
  },
  {
    id: "agenda",
    label: "Agenda e vagas",
    shortLabel: "Vagas",
    icon: CalendarCog,
  },
  {
    id: "portfolio",
    label: "Portfólio",
    shortLabel: "Serviços",
    icon: LayoutGrid,
  },
  {
    id: "documentos",
    label: "Orçamentos",
    shortLabel: "Orçam.",
    icon: FileText,
    mobilePrimary: true,
  },
  {
    id: "estatisticas",
    label: "Números do site",
    shortLabel: "Números",
    icon: BarChart3,
  },
  {
    id: "footer",
    label: "Rodapé",
    shortLabel: "Rodapé",
    icon: PanelBottom,
  },
  {
    id: "config",
    label: "Configurações",
    shortLabel: "Config",
    icon: Settings,
  },
];

export const ADMIN_MOBILE_PRIMARY = ADMIN_NAV.filter((t) => t.mobilePrimary);
export const ADMIN_MOBILE_MORE = ADMIN_NAV.filter((t) => !t.mobilePrimary);

export function isAdminMoreTab(tab: AdminTab) {
  return ADMIN_MOBILE_MORE.some((t) => t.id === tab);
}
