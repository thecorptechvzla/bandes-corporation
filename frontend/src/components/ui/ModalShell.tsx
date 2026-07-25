import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  noHeader?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  panelClassName?: string;
  closeOnBackdrop?: boolean;
  hideCloseButton?: boolean;
  noPadding?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  header,
  noHeader = false,
  children,
  footer,
  size = 'md',
  className = '',
  panelClassName = '',
  closeOnBackdrop = true,
  hideCloseButton = false,
  noPadding = false,
}: ModalShellProps) {
  const renderHeader = () => {
    if (noHeader) return null;

    if (header) {
      return (
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
          {header}
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (title || subtitle) {
      return (
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
          <div>
            {title && (
              <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[10px] font-mono text-[var(--pm-text-dim)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full ${sizeClasses[size]} glass-panel rounded-2xl overflow-hidden ${panelClassName}`}
            onClick={e => e.stopPropagation()}
          >
            {renderHeader()}

            <div className={noPadding ? '' : 'p-6'}>
              {children}
            </div>

            {footer && (
              <div className="px-6 pb-6 pt-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
