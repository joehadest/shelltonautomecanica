import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Radio,
  Award,
  Wrench,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ServicesGrid } from "@/components/services-grid";
import { HeroStats } from "@/components/hero-stats";
import { SobreDestaque } from "@/components/sobre-destaque";
import { FeatureWithAdvantages } from "@/components/ui/feature-with-advantages";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[85vh] overflow-hidden border-b border-border">
        {/* Banner de fundo */}
        <div className="absolute inset-0 animate-hero-zoom">
          <Image
            src="/shellton-hero-banner.png"
            alt=""
            fill
            priority
            className="object-cover object-center brightness-[0.85] contrast-[1.05]"
            sizes="100vw"
            quality={90}
          />
        </div>
        {/* Vinheta leve — deixa a oficina visível e mantém o texto legível */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 sm:from-black/25 sm:to-black/25" />
        {/* Transição suave para a seção seguinte */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute -left-32 top-0 size-96 animate-glow-in rounded-full bg-primary/10 blur-[120px]" />
        <div
          className="absolute -right-20 bottom-0 size-80 animate-glow-in rounded-full bg-primary/5 blur-[120px]"
          style={{ animationDelay: "300ms" }}
        />

        <div className="relative mx-auto flex min-h-[85vh] w-full max-w-6xl 3xl:max-w-[1700px] flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
          <div className="mb-8 animate-fade-in drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            <Logo size="lg" className="justify-center" />
          </div>

          <span
            className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-primary/40 bg-black/40 px-4 py-1.5 text-xs font-semibold text-primary shadow-lg backdrop-blur-md"
            style={{ animationDelay: "120ms" }}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Oficina aberta · Acompanhe a fila em tempo real
          </span>

          <h1
            className="max-w-4xl animate-fade-in text-4xl font-extrabold leading-tight tracking-tight text-foreground drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] sm:text-6xl"
            style={{ animationDelay: "240ms" }}
          >
            Seu carro em boas mãos na{" "}
            <span className="text-primary">Shellton Auto Mecânica</span>
          </h1>

          <p
            className="mt-6 max-w-2xl animate-fade-in text-lg text-foreground/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            style={{ animationDelay: "360ms" }}
          >
            Manutenção e reparos com diagnóstico preciso, peças de qualidade e
            total transparência. Agende online e acompanhe cada etapa do
            serviço.
          </p>

          <div
            className="mt-10 flex animate-fade-in flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "480ms" }}
          >
            <Link
              href="/agendamento"
              className={cn(buttonVariants({ size: "lg" }), "group")}
            >
              Agendar Serviço
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/fila"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              <Radio className="text-primary" />
              Ver Fila em Tempo Real
            </Link>
          </div>

          <div
            className="w-full animate-fade-in"
            style={{ animationDelay: "600ms" }}
          >
            <HeroStats />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="relative mx-auto w-full max-w-6xl 3xl:max-w-[1700px] px-4 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Texto */}
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
              <span className="h-px w-8 bg-primary" />
              Quem somos
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Tradição, técnica e{" "}
              <span className="text-primary">paixão por carros</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              A Shellton Auto Mecânica nasceu da paixão por automóveis e do
              compromisso com um atendimento honesto. Combinamos equipamentos
              modernos de diagnóstico com a experiência de profissionais que
              tratam cada veículo como se fosse o próprio.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Nosso objetivo é simples: devolver o seu carro funcionando como
              novo, no prazo combinado e sem surpresas no orçamento.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Profissionais qualificados",
                "Orçamento sem compromisso",
                "Peças com procedência",
                "Prazos que se cumprem",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm font-medium text-foreground"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="#servicos"
              className={cn(buttonVariants({ variant: "outline" }), "group mt-9")}
            >
              Conheça nossos serviços
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Painel visual */}
          <div className="relative overflow-hidden">
            <div className="absolute -right-6 -top-6 size-40 rounded-full bg-primary/15 blur-[90px]" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-black p-7 shadow-2xl sm:p-9">
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-[80px]" />

              <div className="relative flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_40px_rgba(225,29,42,0.5)]">
                  <Award className="size-8" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    Compromisso com a qualidade
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Cada reparo passa por checklist e teste antes da entrega.
                    Transparência do início ao fim.
                  </p>
                </div>
              </div>

              <div className="relative mt-7 space-y-3 border-t border-border/60 pt-7">
                {[
                  {
                    icon: Wrench,
                    title: "Diagnóstico preciso",
                    desc: "Equipamentos modernos para encontrar a causa real do problema.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Garantia nos serviços",
                    desc: "Você sai com a tranquilidade de um reparo coberto.",
                  },
                  {
                    icon: Clock,
                    title: "Agilidade no atendimento",
                    desc: "Acompanhe a fila em tempo real e economize seu tempo.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="group flex items-start gap-3.5 rounded-xl border border-transparent bg-background/40 p-3.5 transition-colors hover:border-primary/30 hover:bg-background/70"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {title}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative mt-7">
                <SobreDestaque />
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeatureWithAdvantages />

      {/* SERVIÇOS */}
      <section
        id="servicos"
        className="scroll-mt-20 border-t border-border bg-card/30 py-20"
      >
        <div className="mx-auto w-full max-w-6xl 3xl:max-w-[1700px] px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Portfólio
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Serviços que oferecemos
            </h2>
            <p className="mt-4 text-muted-foreground">
              Da manutenção preventiva ao reparo complexo, temos a solução
              completa para o seu veículo.
            </p>
          </div>

          <div className="mt-12">
            <ServicesGrid />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden border-y border-primary/30 py-20 text-center shadow-2xl sm:py-28">
        {/* imagem de fundo */}
        <Image
          src="/shellton-cta-banner.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          quality={90}
        />
        {/* overlay para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/85" />
        {/* glows decorativos */}
        <div className="absolute -right-10 -top-10 size-72 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-16 -left-10 size-72 rounded-full bg-primary/10 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-6xl 3xl:max-w-[1700px] px-4">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-black/30 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Vagas abertas hoje
            </span>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Pronto para cuidar do seu carro?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Faça seu agendamento online em poucos minutos. Sem filas, sem
              complicação.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/agendamento"
                className={cn(buttonVariants({ size: "lg" }), "group")}
              >
                Agendar agora
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/fila"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "group"
                )}
              >
                <Radio className="text-primary" />
                Ver fila ao vivo
              </Link>
            </div>

            <div className="mx-auto mt-10 flex max-w-lg flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Resposta rápida
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Orçamento sem compromisso
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Acompanhe em tempo real
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
