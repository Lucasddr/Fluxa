"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppDialog from "@/app/components/ui/Dialog";
import Button from "@/app/components/ui/Button";
import EmptyState from "@/app/components/ui/EmptyState";
import FormAlert from "@/app/components/ui/FormAlert";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import Select from "@/app/components/ui/Select";
import Skeleton from "@/app/components/ui/Skeleton";
import { formatCurrency } from "@/app/utils/Formatters";
import { selectCategories } from "@/services/categories";
import {
  importStatementRows,
  previewStatementImport,
  responseErrorMessage,
} from "@/services/accounts";
import type {
  Account,
  StatementImportResult,
  StatementPreview,
  StatementPreviewRow,
} from "@/services/accounts";

type StatementCategory = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
};

type EditableStatementRow = StatementPreviewRow & {
  selected: boolean;
  dateInput: string;
  amountInput: string;
  descriptionInput: string;
  categoryId: string;
};

type StatementImportDialogProps = {
  account: Account | null;
  onClose: () => void;
  onImported: () => void;
};

const PAGE_SIZE = 25;

function parseSignedAmount(input: string): number | null {
  const cleaned = input.trim().replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /^-?\d{1,3}(?:\.\d{3})+$/.test(cleaned)
      ? cleaned.replace(/\./g, "")
      : cleaned;
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function categoryKind(amount: number): StatementCategory["kind"] {
  return amount > 0 ? "INCOME" : "EXPENSE";
}

function defaultCategoryId(categories: StatementCategory[], amount: number) {
  return categories.find((category) => category.kind === categoryKind(amount))?.id ?? "";
}

function asEditableRow(
  row: StatementPreviewRow,
  categories: StatementCategory[]
): EditableStatementRow {
  return {
    ...row,
    selected: !row.duplicate,
    dateInput: row.occurredAt,
    amountInput: String(row.signedAmount),
    descriptionInput: row.description,
    categoryId: defaultCategoryId(categories, row.signedAmount),
  };
}

export default function StatementImportDialog({
  account,
  onClose,
  onImported,
}: StatementImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<StatementCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [retryCategories, setRetryCategories] = useState(0);
  const [preview, setPreview] = useState<StatementPreview | null>(null);
  const [rows, setRows] = useState<EditableStatementRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatementImportResult | null>(null);
  const [page, setPage] = useState(0);
  const accountId = account?.id;

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoryError(null);
      try {
        const response = await selectCategories();
        if (!response.ok) throw new Error(await responseErrorMessage(response));
        const data = (await response.json()) as StatementCategory[];
        if (!cancelled) setCategories(data);
      } catch (loadError) {
        if (!cancelled) {
          setCategoryError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar as categorias. Tente novamente."
          );
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [accountId, retryCategories]);

  const selectedCount = rows.filter((row) => row.selected && !row.duplicate).length;
  const duplicateCount = rows.filter((row) => row.duplicate).length;
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const visibleRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [page, rows]
  );

  function resetPreview() {
    setPreview(null);
    setRows([]);
    setResult(null);
    setError(null);
    setPage(0);
  }

  async function handlePreview() {
    if (!account || !file || previewLoading) return;
    if (!categories.some((category) => category.kind === "INCOME")
      || !categories.some((category) => category.kind === "EXPENSE")) {
      setError("Crie ao menos uma categoria de receita e uma de despesa antes de importar.");
      return;
    }
    setPreviewLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await previewStatementImport(account.id, file);
      if (!response.ok) throw new Error(await responseErrorMessage(response));
      const data = (await response.json()) as StatementPreview;
      setPreview(data);
      setRows(data.rows.map((row) => asEditableRow(row, categories)));
      setPage(0);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Não foi possível ler o extrato. Confira o arquivo e tente novamente."
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  function updateRow(sourceReference: string, patch: Partial<EditableStatementRow>) {
    setRows((current) => current.map((row) => {
      if (row.sourceReference !== sourceReference) return row;
      const next = { ...row, ...patch };
      if (patch.amountInput !== undefined) {
        const amount = parseSignedAmount(patch.amountInput);
        if (amount !== null && amount !== 0 && categoryKind(amount) !== categoryKind(row.signedAmount)) {
          next.categoryId = defaultCategoryId(categories, amount);
          next.signedAmount = amount;
        }
      }
      return next;
    }));
  }

  async function handleImport() {
    if (!account || importLoading || selectedCount === 0) return;
    const selectedRows = rows.filter((row) => row.selected && !row.duplicate);
    for (const row of selectedRows) {
      const amount = parseSignedAmount(row.amountInput);
      if (!row.dateInput || !row.descriptionInput.trim() || row.descriptionInput.trim().length > 200
        || amount === null || amount === 0 || !row.categoryId) {
        setError(`Revise os campos da movimentação na linha ${row.rowNumber}.`);
        setPage(Math.floor(rows.indexOf(row) / PAGE_SIZE));
        return;
      }
    }

    setImportLoading(true);
    setError(null);
    try {
      const response = await importStatementRows(
        account.id,
        selectedRows.map((row) => ({
          sourceReference: row.sourceReference,
          occurredAt: row.dateInput,
          signedAmount: parseSignedAmount(row.amountInput)!,
          description: row.descriptionInput.trim(),
          categoryId: row.categoryId,
        })),
        preview?.statementBalance ?? null,
        preview?.statementBalanceAsOf ?? null
      );
      if (!response.ok) throw new Error(await responseErrorMessage(response));
      const imported = (await response.json()) as StatementImportResult;
      setResult(imported);
      onImported();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Não foi possível importar as movimentações. Tente novamente."
      );
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <AppDialog
      open={account !== null}
      onOpenChange={(open) => {
        if (!open && !previewLoading && !importLoading) onClose();
      }}
      title={`Importar extrato${account ? ` · ${account.name}` : ""}`}
      description="Os dados são lidos para a prévia e só viram movimentações depois da sua confirmação."
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={previewLoading || importLoading}>
            Fechar
          </Button>
          {!preview && (
            <Button onClick={() => void handlePreview()} loading={previewLoading} disabled={!file || categoriesLoading}>
              Ver prévia
            </Button>
          )}
          {preview && !result && (
            <Button onClick={() => void handleImport()} loading={importLoading} disabled={selectedCount === 0}>
              Importar {selectedCount} movimentações
            </Button>
          )}
        </div>
      }
    >
      {!preview && !result && (
        <section className="flex flex-col gap-3" aria-labelledby="statement-file-heading">
          <div>
            <h2 id="statement-file-heading" className="text-base font-medium text-ink">
              Arquivo do extrato
            </h2>
            <p className="mt-1 text-sm text-ink-3">CSV ou OFX, até 5 MB e 5.000 movimentações.</p>
          </div>
          <div>
            <Label htmlFor="statement-file">Selecionar arquivo</Label>
            <Input
              id="statement-file"
              type="file"
              accept=".csv,.ofx,text/csv,application/x-ofx"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                resetPreview();
              }}
            />
          </div>
          {categoriesLoading && <Skeleton className="h-10" />}
          {categoryError && (
            <div className="flex flex-col gap-2">
              <FormAlert>{categoryError}</FormAlert>
              <Button variant="secondary" onClick={() => setRetryCategories((key) => key + 1)}>
                Tentar carregar categorias novamente
              </Button>
            </div>
          )}
          {!categoriesLoading && (
            (!categories.some((category) => category.kind === "INCOME")
              || !categories.some((category) => category.kind === "EXPENSE"))
            && !categoryError
          ) && (
            <EmptyState
              title="Categorias necessárias"
              description="Cadastre ao menos uma categoria de receita e uma de despesa para classificar as movimentações importadas."
              action={(
                <Link
                  href="/home/categories"
                  className="inline-flex min-h-[44px] items-center text-sm font-medium text-ink underline underline-offset-4"
                >
                  Cadastrar categorias
                </Link>
              )}
            />
          )}
        </section>
      )}

      {preview && !result && (
        <section className="flex flex-col gap-3" aria-labelledby="statement-preview-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="statement-preview-heading" className="text-base font-medium text-ink">
                Prévia do arquivo {preview.format}
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                {rows.length} movimentações · {selectedCount} selecionadas · {duplicateCount} duplicadas ou já importadas
              </p>
              {preview.statementBalance !== null && preview.statementBalanceAsOf && (
                <p className="mt-1 text-sm text-ink-2">
                  Saldo final do OFX: {formatCurrency(preview.statementBalance)} em {preview.statementBalanceAsOf.slice(0, 10).split("-").reverse().join("/")}
                  . Será conferido quando as movimentações selecionadas forem importadas.
                </p>
              )}
            </div>
            <Button variant="secondary" onClick={resetPreview} disabled={importLoading}>
              Escolher outro arquivo
            </Button>
          </div>

          {pageCount > 1 && (
            <nav aria-label="Páginas da prévia" className="flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                Anterior
              </Button>
              <span className="text-sm text-ink-3" aria-live="polite">
                Página {page + 1} de {pageCount}
              </span>
              <Button variant="secondary" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page + 1 >= pageCount}>
                Próxima
              </Button>
            </nav>
          )}

          <ol className="max-h-[50dvh] divide-y divide-line overflow-y-auto border-y border-line">
            {visibleRows.map((row) => {
              const amount = parseSignedAmount(row.amountInput);
              const kind = amount === null || amount === 0
                ? categoryKind(row.signedAmount)
                : categoryKind(amount);
              const rowCategories = categories.filter((category) => category.kind === kind);
              return (
                <li key={row.rowNumber} className="flex flex-col gap-3 py-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0 accent-ink"
                      aria-label={`Importar movimentação da linha ${row.rowNumber}`}
                      checked={row.selected && !row.duplicate}
                      disabled={row.duplicate || importLoading}
                      onChange={(event) => updateRow(row.sourceReference, { selected: event.target.checked })}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink-3">
                        Linha {row.rowNumber}{row.duplicate ? " · Duplicada ou já importada; será ignorada" : ""}
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor={`statement-date-${row.rowNumber}`}>Data</Label>
                          <Input
                            id={`statement-date-${row.rowNumber}`}
                            type="date"
                            value={row.dateInput}
                            disabled={row.duplicate || importLoading}
                            onChange={(event) => updateRow(row.sourceReference, { dateInput: event.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`statement-amount-${row.rowNumber}`}>Valor (R$)</Label>
                          <Input
                            id={`statement-amount-${row.rowNumber}`}
                            type="text"
                            inputMode="decimal"
                            value={row.amountInput}
                            disabled={row.duplicate || importLoading}
                            onChange={(event) => updateRow(row.sourceReference, { amountInput: event.target.value })}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label htmlFor={`statement-description-${row.rowNumber}`}>Descrição</Label>
                        <Input
                          id={`statement-description-${row.rowNumber}`}
                          type="text"
                          maxLength={200}
                          value={row.descriptionInput}
                          disabled={row.duplicate || importLoading}
                          onChange={(event) => updateRow(row.sourceReference, { descriptionInput: event.target.value })}
                        />
                      </div>
                      <div className="mt-3">
                        <Label htmlFor={`statement-category-${row.rowNumber}`}>Categoria</Label>
                        <Select
                          id={`statement-category-${row.rowNumber}`}
                          value={row.categoryId}
                          disabled={row.duplicate || importLoading || rowCategories.length === 0}
                          onChange={(event) => updateRow(row.sourceReference, { categoryId: event.target.value })}
                        >
                          <option value="">Selecione uma categoria</option>
                          {rowCategories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </Select>
                      </div>
                      <p className={`mt-2 text-sm tabular-nums ${kind === "INCOME" ? "text-positive" : "text-ink-2"}`}>
                        {amount === null ? "Informe um valor válido" : formatCurrency(amount)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div
        className={result ? "flex flex-col gap-2" : "sr-only"}
        role="status"
        aria-live="polite"
      >
        {result && (
          <>
            <h2 className="font-medium text-ink">Importação concluída</h2>
            <p className="text-sm text-ink-2">
              {result.importedCount} movimentações adicionadas. {result.duplicateCount + duplicateCount} duplicadas foram ignoradas.
              {result.statementBalanceRecorded
                ? " O saldo final do OFX também foi salvo para conferência."
                : ""}
            </p>
          </>
        )}
      </div>
      {error && <FormAlert>{error}</FormAlert>}
    </AppDialog>
  );
}
