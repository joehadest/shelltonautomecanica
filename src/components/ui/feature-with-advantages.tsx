import {
  Check,
  Cpu,
  ShieldCheck,
  Radio,
  Award,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  title: string;
  description: string;
  icon?: LucideIcon;
}

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    icon: Cpu,
    title: "Diagnóstico computadorizado",
    description:
      "Scanner automotivo e equipamentos de última geração para identificar falhas com precisão.",
  },
  {
    icon: ShieldCheck,
    title: "Garantia em todos os serviços",
    description:
      "Confiança total: cada reparo é coberto por garantia e passa por checklist de qualidade.",
  },
  {
    icon: Radio,
    title: "Agendamento e fila ao vivo",
    description:
      "Marque online em minutos e acompanhe o status do seu carro em tempo real pelo celular.",
  },
  {
    icon: Award,
    title: "Peças de primeira linha",
    description:
      "Trabalhamos apenas com fornecedores confiáveis para durabilidade e segurança.",
  },
  {
    icon: Receipt,
    title: "Orçamento transparente",
    description:
      "Você aprova antes de qualquer serviço. Sem taxas escondidas nem surpresas na hora de pagar.",
  },
  {
    icon: Users,
    title: "Equipe especializada",
    description:
      "Mecânicos experientes que tratam cada veículo com o mesmo cuidado que dariam ao próprio.",
  },
];

interface FeatureWithAdvantagesProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  items?: FeatureItem[];
  className?: string;
}

function FeatureWithAdvantages({
  badge = "Diferenciais",
  title = "Por que escolher a Shellton?",
  subtitle =
    "Mais do que consertar carros — entregamos confiança, transparência e um atendimento que respeita o seu tempo.",
  items = DEFAULT_FEATURES,
  className,
}: FeatureWithAdvantagesProps) {
  return (
    <section
      id="diferenciais"
      className={cn(
        "relative w-full scroll-mt-20 overflow-x-clip border-y border-border bg-card/20 py-16 lg:py-24",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-1/4 size-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -left-24 bottom-1/4 size-56 rounded-full bg-primary/5 blur-[80px]" />
      </div>
      <div className="relative mx-auto w-full max-w-6xl 3xl:max-w-[1700px] px-4">
        <div className="flex flex-col items-start gap-4">
          <Badge variant="outline" className="border-primary/40 text-primary">
            {badge}
          </Badge>

          <div className="flex max-w-3xl flex-col gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl lg:tracking-tighter">
              {title}
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 pt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:pt-14">
            {items.map((item, i) => {
              const Icon = item.icon ?? Check;
              return (
                <div
                  key={item.title}
                  className="group flex gap-4 rounded-xl border border-border bg-card/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-[0_8px_30px_rgba(225,29,42,0.12)] animate-fade-in"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" strokeWidth={2.25} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="font-semibold leading-snug text-foreground">
                      {item.title}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export { FeatureWithAdvantages, FeatureWithAdvantages as Feature };
