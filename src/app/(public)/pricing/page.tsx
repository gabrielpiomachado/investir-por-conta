import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const included = [
  'Registro manual de receitas e despesas',
  'Categorias para organizar movimentações',
  'Orçamentos e acompanhamento de limites',
  'Metas de economia com progresso visual',
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <div className="max-w-3xl">
        <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase text-lime-300">
          <span className="h-px w-8 bg-lime-300" /> Planos
        </p>
        <h1 className="font-heading text-5xl font-semibold leading-[1.04] md:text-7xl">
          Clareza primeiro.{' '}
          <span className="text-lime-300">Valores em breve.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
          As informações de preços e condições ainda não foram publicadas. Por
          enquanto, conheça o que você pode organizar com o Investir por Conta.
        </p>
      </div>

      <div className="mt-14 grid gap-12 border-y border-border py-8 md:grid-cols-[0.8fr_1.2fr] md:gap-20 md:py-12">
        <div>
          <p className="text-xs font-semibold uppercase text-lime-300">
            O que já faz parte
          </p>
          <h2 className="mt-3 font-heading text-2xl font-semibold">
            Sua vida financeira, em perspectiva.
          </h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-6">
              <Check
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-lime-300"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Ainda não há valores ou planos para comparar. Quando as condições
          comerciais estiverem definidas, elas serão apresentadas aqui com
          clareza.
        </p>
        <Link
          href="/sign-up"
          className={buttonVariants({
            size: 'lg',
            className:
              'h-11 shrink-0 gap-2 bg-lime-300 px-5 text-black hover:bg-lime-200',
          })}
        >
          Conhecer o app <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
