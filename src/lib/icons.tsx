import {
  Droplet,
  Gauge,
  Cog,
  Zap,
  Disc3,
  CarFront,
  Wrench,
  Battery,
  Wind,
  Thermometer,
  Fuel,
  Settings,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

/** Ícones disponíveis para os serviços do portfólio. */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  ClipboardCheck,
  Droplet,
  Gauge,
  Cog,
  Zap,
  Disc3,
  CarFront,
  Wrench,
  Battery,
  Wind,
  Thermometer,
  Fuel,
  Settings,
};

export const SERVICE_ICON_OPTIONS = Object.keys(SERVICE_ICONS);

export function getServiceIcon(name: string): LucideIcon {
  return SERVICE_ICONS[name] ?? Wrench;
}
