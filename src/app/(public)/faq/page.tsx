import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const questions = [
  {
    question: 'Preciso conectar minha conta bancária?',
    answer:
      'Não. As movimentações são registradas manualmente, sem integração bancária.',
  },
  {
    question: 'Que tipo de movimentação posso registrar?',
    answer:
      'Você pode registrar receitas e despesas e organizá-las por categorias.',
  },
  {
    question: 'Como funcionam os orçamentos?',
    answer:
      'Você define valores por categoria e acompanha o uso do orçamento ao longo do mês, com alertas de limite.',
  },
  {
    question: 'Posso acompanhar uma meta de economia?',
    answer:
      'Sim. Crie metas e acompanhe visualmente o progresso em relação ao valor desejado.',
  },
  {
    question: 'Quanto custa usar o Investir por Conta?',
    answer:
      'Os valores e as condições comerciais ainda não foram publicados. Consulte a página de planos para ver as informações mais recentes.',
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:grid-cols-[0.75fr_1.25fr] md:gap-20 md:px-8 md:py-24">
      <div className="md:sticky md:top-10 md:self-start">
        <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase text-lime-300">
          <span className="h-px w-8 bg-lime-300" /> Dúvidas frequentes
        </p>
        <h1 className="font-heading text-5xl font-semibold leading-[1.04] md:text-6xl">
          Respostas <span className="text-lime-300">diretas.</span>
        </h1>
        <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
          O essencial para entender como o Investir por Conta funciona.
        </p>
        <Link
          href="/pricing"
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-lime-300 hover:text-lime-200"
        >
          Ver informações de planos{' '}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="border-t border-border">
        {questions.map(({ question, answer }, index) => (
          <details key={question} className="group border-b border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-heading text-base font-medium marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:py-6 md:text-lg [&::-webkit-details-marker]:hidden">
              <span className="flex items-start gap-4">
                <span className="mt-1 font-mono text-xs text-lime-300">
                  0{index + 1}
                </span>
                {question}
              </span>
              <span
                aria-hidden="true"
                className="text-xl text-lime-300 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-6 pl-9 text-sm leading-7 text-muted-foreground md:text-base">
              {answer}
            </p>
          </details>
        ))}
        <div className="pt-7 text-sm leading-6 text-muted-foreground">
          Ainda tem uma dúvida? Fale com a comunidade no{' '}
          <a
            href="https://github.com/gabrielpiomachado/investir-por-conta/discussions"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline decoration-lime-300 underline-offset-4"
          >
            GitHub Discussions
          </a>
          .
        </div>
      </div>
    </div>
  );
}
