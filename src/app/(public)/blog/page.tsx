import { ArrowUpRight, Newspaper } from 'lucide-react';

const articles = [
  {
    category: 'Organização',
    title: 'Um orçamento que acompanha a sua vida',
    summary:
      'Uma forma mais simples de olhar para limites mensais e ajustar seus planos com o que acontece de verdade.',
    number: '01',
    accent: 'bg-lime-300',
  },
  {
    category: 'Hábitos',
    title: 'O valor de registrar cada movimento',
    summary:
      'Pequenos registros ajudam a transformar a sensação de dúvida em uma visão mais clara do mês.',
    number: '02',
    accent: 'bg-sky-300',
  },
  {
    category: 'Planejamento',
    title: 'Metas financeiras que cabem no seu momento',
    summary:
      'Escolher um objetivo, acompanhar o progresso e revisar o plano também faz parte de chegar lá.',
    number: '03',
    accent: 'bg-rose-300',
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <div className="flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase text-lime-300">
            <span className="h-px w-8 bg-lime-300" /> Ideias para cuidar melhor
            do seu dinheiro
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-[1.04] md:text-7xl">
            Leituras para{' '}
            <span className="text-lime-300">seguir pensando.</span>
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Conteúdos sobre organização financeira e as escolhas do dia a dia.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Newspaper aria-hidden="true" className="size-4 text-lime-300" />
        <span>Conteúdo editorial em preparação</span>
      </div>

      <section
        aria-label="Artigos em preparação"
        className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        {articles.map((article) => (
          <article
            key={article.number}
            className="group border-t border-border pt-4"
          >
            <div
              className={`mb-6 flex aspect-[1.65/1] items-end justify-between overflow-hidden p-5 text-black ${article.accent}`}
            >
              <span className="font-heading text-6xl font-semibold leading-none">
                {article.number}
              </span>
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </div>
            <p className="text-xs font-medium uppercase text-lime-300">
              {article.category}
            </p>
            <h2 className="mt-3 font-heading text-xl font-semibold leading-snug md:text-2xl">
              {article.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {article.summary}
            </p>
            <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
              Artigo em preparação
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
