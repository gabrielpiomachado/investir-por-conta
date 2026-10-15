'use client';

import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/features/categories';
import type { Transaction } from '../types';

type TransactionDeleteDialogProps = {
  transaction: Transaction | null;
  categories: Category[];
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function TransactionDeleteDialog({
  transaction,
  categories,
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: TransactionDeleteDialogProps) {
  const transactionName =
    transaction?.description ||
    categories.find((c) => c.id === transaction?.category_id)?.name ||
    'esta transação';

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
                Excluir transação?
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Tem certeza de que deseja excluir{' '}
                <span className="font-medium text-foreground">
                  {transactionName}
                </span>
                ? Esta ação não pode ser desfeita.
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
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir transação'}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
