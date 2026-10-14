import Link from 'next/link';
import {
  ArrowRight,
  ChartNoAxesCombined,
  ClipboardList,
  Target,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const features = [
  {
    icon: ClipboardList,
    title: 'Registre o que acontece',
    description:
      'Anote receitas e despesas para entender com mais clareza o caminho do seu dinheiro.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Organize o mês',
    description:
      'Use categorias e orçamentos para acompanhar seus gastos ao longo do período.',
  },
  {
    icon: Target,
    title: 'Acompanhe seus planos',
    description:
      'Defina metas de economia e visualize seu progresso em um só lugar.',
  },
];

const steps = [
  ['01', 'Registre', 'Inclua suas movimentações manualmente.'],
  ['02', 'Organize', 'Separe por categorias e acompanhe seus orçamentos.'],
  ['03', 'Decida', 'Use essa visão para escolher seu próximo passo.'],
];

export default function Home() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div>
            <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase text-lime-300">
              <span className="h-px w-8 bg-lime-300" />
              Finanças pessoais, com mais clareza
            </p>
            <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-[1.04] md:text-7xl">
              O seu dinheiro.{' '}
              <span className="text-lime-300">Suas escolhas.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Acompanhe receitas e despesas, organize seus planos e tome
              decisões financeiras com mais contexto.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className={buttonVariants({
                  size: 'lg',
                  className:
                    'h-11 gap-2 bg-lime-300 px-5 text-black hover:bg-lime-200',
                })}
              >
                Criar conta <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Conheça o projeto{' '}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Sem conexão bancária: você registra suas movimentações.
            </p>
          </div>

          <div className="relative border border-border bg-card p-5 md:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Um caminho mais claro
                </p>
                <p className="mt-2 font-heading text-xl font-medium">
                  Do registro à decisão
                </p>
              </div>
              <span className="border border-lime-300/40 px-2 py-1 text-[10px] uppercase text-lime-300">
                Como funciona
              </span>
            </div>
            <ol className="mt-3">
              {steps.map(([number, title, description], index) => (
                <li
                  key={number}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-border py-5 last:border-b-0"
                >
                  <span className="font-heading text-sm text-lime-300">
                    {number}
                  </span>
                  <div>
                    <h2 className="font-medium">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="col-start-1 row-start-2 mx-auto h-4 w-px bg-border"
                    />
                  )}
                </li>
              ))}
            </ol>
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">
              Uma visão ilustrativa do fluxo, não uma captura do aplicativo.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase text-lime-300">
              Menos ruído, mais contexto
            </p>
            <h2 className="mt-4 max-w-sm font-heading text-3xl font-semibold leading-tight md:text-4xl">
              Entenda o presente para planejar o próximo passo.
            </h2>
          </div>
          <div className="grid gap-0 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="border-t border-border py-5 md:border-l md:border-t-0 md:px-5 md:py-0 first:md:border-l-0 first:md:pl-0"
              >
                <span className="mb-5 grid size-9 place-items-center border border-lime-300/40 text-lime-300">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <p className="mb-3 font-heading text-xs text-muted-foreground">
                  0{index + 1}
                </p>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-lime-300">
              Feito para a vida real
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">
              Comece pelo que você já sabe.
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            Não precisa conectar sua conta bancária. Registre seus movimentos no
            seu ritmo e construa uma visão financeira que faça sentido para
            você.
          </p>
          <Link
            href="/faq"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-lime-300 hover:text-lime-200"
          >
            Tire suas dúvidas{' '}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20">
        <div>
          <p className="text-xs font-semibold uppercase text-lime-300">
            Um passo de cada vez
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold">
            Mais clareza começa com um registro.
          </h2>
        </div>
        <Link
          href="/sign-up"
          className={buttonVariants({
            size: 'lg',
            className:
              'h-11 gap-2 bg-lime-300 px-5 text-black hover:bg-lime-200',
          })}
        >
          Começar agora <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
