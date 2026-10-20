"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FileText, UploadCloud } from "lucide-react";

import AppDialog from "@/app/components/ui/Dialog";
import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";
import CategorySelect from "@/app/components/categories/CategorySelect";
import CurrencyInput, {
  formatAmountValue,
} from "@/app/components/ui/CurrencyInput";
import EmptyState from "@/app/components/ui/EmptyState";
import FormAlert from "@/app/components/ui/FormAlert";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import Skeleton from "@/app/components/ui/Skeleton";
import Textarea from "@/app/components/ui/Textarea";
import { formatCurrency } from "@/app/utils/Formatters";
import { selectCategories } from "@/services/categories";
import {
  importStatementRows,
  previewStatementImport,
  previewStatementText,
  responseErrorMessage,
} from "@/services/accounts";
import type {
  Account,
  StatementImportResult,
  StatementPreview,
  StatementPreviewRow,
} from "@/services/accounts";
import type { CategoryOption } from "@/app/components/categories/CategorySelect";

type StatementCategory = CategoryOption;

type EditableStatementRow = StatementPreviewRow & {
  selected: boolean;
  dateInput: string;
  amountInput: string;
  descriptionInput: string;
  categoryId: string;
  categorySuggested: boolean;
  rememberCategoryRule: boolean;
};

type StatementImportDialogProps = {
  account: Account | null;
  onClose: () => void;
  onImported: () => void;
};

const PAGE_SIZE = 25;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function parseSignedAmount(input: string): number | null {
  const cleaned = input.trim().replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (!cleaned) return null;
  const withSeparators = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /^-?\d{1,3}(?:\.\d{3})+$/.test(cleaned)
      ? cleaned.replace(/\./g, "")
      : cleaned;
  const normalized = withSeparators.replace(/[.,]$/, "");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MAX_FILE_BYTES) {
    return `${(bytes / 1024).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} MB`;
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
    amountInput: formatAmountValue(row.signedAmount),
    descriptionInput: row.description,
    categoryId: row.suggestedCategoryId ?? defaultCategoryId(categories, row.signedAmount),
    categorySuggested: row.suggestedCategoryId !== null,
    rememberCategoryRule: row.suggestedCategoryId !== null,
  };
}

export default function StatementImportDialog({
  account,
  onClose,
  onImported,
}: StatementImportDialogProps) {
  const [mode, setMode] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState("");
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

  function selectFile(nextFile: File | null) {
    setFileError(null);
    if (nextFile) {
      const extension = nextFile.name.split(".").pop()?.toLowerCase();
      if (!extension || !["csv", "ofx", "pdf"].includes(extension)) {
        setFileError("Formato não suportado. Envie um arquivo CSV, OFX ou PDF.");
        return;
      }
      if (nextFile.size > MAX_FILE_BYTES) {
        setFileError("O arquivo deve ter no máximo 5 MB.");
        return;
      }
    }
    setFile(nextFile);
    resetPreview();
  }

  const sourceReady = mode === "file" ? file !== null : pastedText.trim().length > 0;

  async function handlePreview() {
    if (!account || !sourceReady || previewLoading) return;
    setPreviewLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = mode === "file"
        ? await previewStatementImport(account.id, file!)
        : await previewStatementText(account.id, pastedText);
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
          next.categorySuggested = false;
          next.rememberCategoryRule = false;
        }
      }
      if (patch.categoryId !== undefined) next.categorySuggested = false;
      if (patch.descriptionInput !== undefined) {
        next.categorySuggested = false;
        next.rememberCategoryRule = false;
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
          rememberCategoryRule: row.rememberCategoryRule,
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
            <Button onClick={() => void handlePreview()} loading={previewLoading} disabled={!sourceReady || categoriesLoading}>
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
              Origem do extrato
            </h2>
            <p className="mt-1 text-sm text-ink-3">
              Arquivo CSV, OFX ou PDF (até 5 MB), ou texto copiado do PDF.
            </p>
          </div>
          <div
            role="group"
            aria-label="Origem do extrato"
            className="inline-flex self-start gap-1 rounded-[var(--radius)] border border-line p-1"
          >
            <button
              type="button"
              aria-pressed={mode === "file"}
              onClick={() => {
                setMode("file");
                resetPreview();
              }}
              className={`min-h-[44px] rounded-[calc(var(--radius)-4px)] px-3 text-[12px] font-medium transition-colors duration-[var(--dur-fast)] ${
                mode === "file" ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
              }`}
            >
              Arquivo
            </button>
            <button
              type="button"
              aria-pressed={mode === "text"}
              onClick={() => {
                setMode("text");
                resetPreview();
              }}
              className={`min-h-[44px] rounded-[calc(var(--radius)-4px)] px-3 text-[12px] font-medium transition-colors duration-[var(--dur-fast)] ${
                mode === "text" ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
              }`}
            >
              Colar texto
            </button>
          </div>
          {mode === "file" ? (
            <div>
              <Label htmlFor="statement-file">Arquivo do extrato</Label>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!dragging) setDragging(true);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDragging(false);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const dropped = event.dataTransfer.files?.[0];
                  if (dropped) selectFile(dropped);
                }}
                className={`mt-1 rounded-[var(--radius)] border-2 border-dashed p-4 transition-colors duration-[var(--dur-fast)] ${
                  dragging
                    ? "border-ink bg-line-subtle"
                    : file
                      ? "border-line-strong bg-surface"
                      : "border-line-strong"
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="statement-file"
                  type="file"
                  accept=".csv,.ofx,.pdf,text/csv,application/x-ofx,application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const picked = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    selectFile(picked);
                  }}
                />
                {file ? (
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 shrink-0 text-ink-3" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                      <p className="text-xs text-ink-3">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={previewLoading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Trocar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={previewLoading}
                        onClick={() => selectFile(null)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-3 text-center">
                    <UploadCloud className="h-6 w-6 text-ink-3" aria-hidden />
                    <p className="text-sm text-ink-2">
                      Arraste o arquivo aqui <span className="text-ink-3">ou</span>
                    </p>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      Escolher arquivo
                    </Button>
                    <p className="text-xs text-ink-3">CSV, OFX ou PDF · até 5 MB</p>
                  </div>
                )}
              </div>
              {fileError && (
                <p role="alert" className="mt-2 text-sm text-negative">
                  {fileError}
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="statement-text">Texto do extrato</Label>
              <Textarea
                id="statement-text"
                rows={8}
                value={pastedText}
                placeholder={"09/10/2026 Pix recebido -225,00\n06/10/2026 Salario 3.000,00"}
                onChange={(event) => {
                  setPastedText(event.target.value);
                  resetPreview();
                }}
              />
              <p className="mt-1 text-sm text-ink-3">
                No PDF, use Ctrl+A e Ctrl+C e cole aqui. Serve também para extratos digitalizados com OCR.
              </p>
            </div>
          )}
          {categoriesLoading && <Skeleton className="h-10" />}
          {categoryError && (
            <div className="flex flex-col gap-2">
              <FormAlert>{categoryError}</FormAlert>
              <Button variant="secondary" onClick={() => setRetryCategories((key) => key + 1)}>
                Tentar carregar categorias novamente
              </Button>
            </div>
          )}
          {!categoriesLoading && !categoryError && categories.length === 0 && (
            <EmptyState
              title="Você ainda não tem categorias"
              description="Ao revisar a prévia você pode criar uma categoria direto na linha, ou cadastrar antes."
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
              {mode === "file" ? "Trocar arquivo" : "Colar outro texto"}
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
              return (
                <li key={row.rowNumber} className="flex flex-col gap-3 py-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-6 w-6 shrink-0 accent-ink"
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
                          <CurrencyInput
                            id={`statement-amount-${row.rowNumber}`}
                            value={row.amountInput}
                            disabled={row.duplicate || importLoading}
                            onValueChange={(value) => {
                              updateRow(row.sourceReference, { amountInput: value });
                            }}
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
                        <CategorySelect
                          id={`statement-category-${row.rowNumber}`}
                          value={row.categoryId}
                          kind={kind}
                          categories={categories}
                          disabled={row.duplicate || importLoading}
                          onChange={(categoryId) => {
                            updateRow(row.sourceReference, { categoryId });
                          }}
                          onCategoriesChange={setCategories}
                        />
                        {row.categorySuggested && (
                          <div className="mt-1">
                            <Badge variant="neutral">Sugestão por regra salva</Badge>
                          </div>
                        )}
                        <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-ink-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-ink"
                            checked={row.rememberCategoryRule}
                            disabled={row.duplicate || importLoading || !row.categoryId}
                            onChange={(event) => updateRow(row.sourceReference, {
                              rememberCategoryRule: event.target.checked,
                            })}
                          />
                          <span>Guardar categoria para próximas importações parecidas</span>
                        </label>
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
              {result.categoryRulesSaved > 0
                ? ` ${result.categoryRulesSaved} regra${result.categoryRulesSaved === 1 ? "" : "s"} de categoria ${result.categoryRulesSaved === 1 ? "salva ou atualizada" : "salvas ou atualizadas"}.`
                : ""}
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
