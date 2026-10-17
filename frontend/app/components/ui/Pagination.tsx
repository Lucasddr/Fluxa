import { ChevronLeft, ChevronRight } from "lucide-react";
import FilterSelect from "./FilterSelect";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  return [...new Set([0, currentPage - 1, currentPage, currentPage + 1, totalPages - 1])]
    .filter((page) => page >= 0 && page < totalPages)
    .sort((a, b) => a - b);
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
}: PaginationProps) {
  const pageCount = Math.max(1, totalPages);
  const page = Math.min(Math.max(0, currentPage), pageCount - 1);
  const visiblePages = getVisiblePages(page, pageCount);
  const firstItem = totalItems === 0 ? 0 : page * pageSize + 1;
  const lastItem = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
      <p className="min-w-0 text-[13px] text-ink-3" role="status" aria-live="polite">
        Mostrando {firstItem}–{lastItem} de {totalItems}
      </p>

      <nav
        aria-label="Paginação"
        className="flex min-h-11 items-center gap-1"
      >
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Página anterior"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-line text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <span className="px-2 text-xs text-ink-2 sm:hidden">
          {page + 1} / {pageCount}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {visiblePages.map((pageIndex, index) => {
            const previousPage = visiblePages[index - 1];

            return (
              <span key={pageIndex} className="contents">
                {previousPage !== undefined && pageIndex - previousPage > 1 && (
                  <span className="px-1 text-sm text-ink-3" aria-hidden="true">
                    …
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(pageIndex)}
                  aria-label={`Página ${pageIndex + 1}`}
                  aria-current={pageIndex === page ? "page" : undefined}
                  className={`h-11 min-w-11 rounded-[var(--radius)] px-2 text-sm transition-colors ${
                    pageIndex === page
                      ? "bg-ink font-medium text-paper"
                      : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {pageIndex + 1}
                </button>
              </span>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label="Próxima página"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-line text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>

      <div className="flex items-center gap-2 text-[13px] text-ink-3">
        <span>Itens por página</span>
        <FilterSelect
          label="Itens por página"
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FilterSelect>
      </div>
    </div>
  );
}
