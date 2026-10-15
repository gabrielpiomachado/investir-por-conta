'use client';

import { Dialog } from '@base-ui/react/dialog';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '../types';

type CategoryDeleteDialogProps = {
  category: Category | null;
  isOpen: boolean;
  isLoadingCount: boolean;
  isDeleting: boolean;
  associatedTransactionsCount: number | null;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function CategoryDeleteDialog({
  category,
  isOpen,
  isLoadingCount,
  isDeleting,
  associatedTransactionsCount,
  error,
  onClose,
  onConfirm,
}: CategoryDeleteDialogProps) {
  const hasAssociatedTransactions =
    associatedTransactionsCount !== null && associatedTransactionsCount > 0;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold">
                Excluir Categoria
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {hasAssociatedTransactions ? (
                  <>
                    Tem certeza de que deseja excluir a categoria{' '}
                    <span className="font-medium text-foreground">
                      {category?.name}
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Tem certeza de que deseja excluir{' '}
                    <span className="font-medium text-foreground">
                      {category?.name}
                    </span>
                    ? Esta ação não pode ser desfeita.
                  </>
                )}
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar confirmação"
              onClick={onClose}
              disabled={isDeleting}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          {isLoadingCount && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
              <span>Verificando transações vinculadas...</span>
            </div>
          )}

          {!isLoadingCount && hasAssociatedTransactions && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="flex items-start gap-2.5">
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold leading-none">
                    Atenção: exclusão em cascata
                  </p>
                  <p className="text-xs leading-relaxed text-destructive/90">
                    Esta categoria possui{' '}
                    <strong className="font-semibold text-destructive">
                      {associatedTransactionsCount}{' '}
                      {associatedTransactionsCount === 1
                        ? 'transação vinculada'
                        : 'transações vinculadas'}
                    </strong>
                    . Ao confirmar a exclusão,{' '}
                    <strong>todas as transações vinculadas serão apagadas permanentemente</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mb-4 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting || isLoadingCount}
            >
              {isDeleting
                ? 'Excluindo...'
                : hasAssociatedTransactions
                  ? 'Excluir categoria e transações'
                  : 'Excluir categoria'}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
