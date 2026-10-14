import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1fr_0.8fr] md:items-end md:px-8 md:py-24">
          <div>
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase text-lime-300">
              <span className="h-px w-8 bg-lime-300" /> Sobre o projeto
            </p>
            <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-[1.04] md:text-7xl">
              Feito para quem quer assumir{' '}
              <span className="text-lime-300">as próprias escolhas.</span>
            </h1>
          </div>
          <p className="max-w-lg text-base leading-7 text-muted-foreground md:justify-self-end md:text-lg md:leading-8">
            O Investir por Conta é um software independente, feito no Brasil
            para ajudar pessoas a entender melhor suas finanças e planejar com
            mais clareza.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.7fr_1.3fr] md:gap-20 md:px-8 md:py-20">
        <div className="flex items-start gap-4">
          <span
            role="img"
            aria-label="Bandeira do Brasil"
            className="mt-1 h-8 w-12 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/assets/img/brazil.png')" }}
          />
          <div>
            <p className="font-heading text-lg font-medium">
              Independente. Brasileiro.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Um projeto sobre escolhas financeiras pessoais.
            </p>
          </div>
        </div>
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold md:text-4xl">
            Clareza muda o que vem depois.
          </h2>
          <div className="mt-6 space-y-5 text-base leading-7 text-muted-foreground">
            <p>
              Quando você sabe para onde seu dinheiro vai, fica mais fácil
              pensar para onde gostaria que ele fosse. O primeiro passo é ter
              uma visão honesta do presente.
            </p>
            <p>
              Por isso, o produto reúne registros de receitas e despesas,
              categorias, orçamentos e metas de economia em uma experiência
              simples de acompanhar.
            </p>
          </div>
          <blockquote className="mt-9 border-l-2 border-lime-300 pl-5 font-heading text-xl leading-8 text-foreground md:text-2xl">
            Se você sabe para onde o seu dinheiro vai, pode escolher para onde
            quer levá-lo.
          </blockquote>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="max-w-2xl font-heading text-2xl font-medium leading-snug">
            Menos complicação para acompanhar. Mais espaço para decidir.
          </p>
          <Link
            href="/sign-up"
            className={buttonVariants({
              size: 'lg',
              className:
                'h-11 shrink-0 gap-2 bg-lime-300 px-5 text-black hover:bg-lime-200',
            })}
          >
            Conheça o app <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
