import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TransactionPaginationProps = {
  activePage: number;
  totalPages: number;
  firstOnPage: number;
  lastOnPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

export function TransactionPagination({
  activePage,
  totalPages,
  firstOnPage,
  lastOnPage,
  totalCount,
  onPageChange,
}: TransactionPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação das transações"
      className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-sm text-muted-foreground">
        Exibindo {firstOnPage}–{lastOnPage} de {totalCount} transações
      </p>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Página anterior"
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Button>
        <span aria-live="polite" className="text-sm font-medium tabular-nums">
          Página {activePage} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Próxima página"
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
        >
          Próxima
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
