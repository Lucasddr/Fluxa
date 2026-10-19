"use client";

import { useEffect, useState } from "react";

import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";
import AppDialog from "@/app/components/ui/Dialog";
import EmptyState from "@/app/components/ui/EmptyState";
import ErrorState from "@/app/components/ui/ErrorState";
import FormAlert from "@/app/components/ui/FormAlert";
import Input from "@/app/components/ui/Input";
import Label from "@/app/components/ui/Label";
import PageHeader from "@/app/components/ui/PageHeader";
import Skeleton from "@/app/components/ui/Skeleton";
import { useToast } from "@/app/components/ui/Toaster";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  responseErrorMessage,
  setDefaultAccount,
  updateAccount,
} from "@/services/accounts";
import type { Account } from "@/services/accounts";

function AccountActions({
  account,
  busy,
  onMakeDefault,
  onEdit,
  onDelete,
}: {
  account: Account;
  busy: boolean;
  onMakeDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
      {account.isDefault ? (
        <Badge
          variant="positive"
          className="col-span-2 justify-self-start sm:col-auto"
        >
          Padrão
        </Badge>
      ) : (
        <Button
          variant="secondary"
          className="col-span-2 sm:col-auto"
          onClick={onMakeDefault}
          disabled={busy}
        >
          Tornar padrão
        </Button>
      )}
      <Button variant="ghost" className="sm:col-auto" onClick={onEdit} disabled={busy}>
        Editar
      </Button>
      <Button variant="ghost" className="sm:col-auto" onClick={onDelete} disabled={busy}>
        Excluir
      </Button>
    </div>
  );
}

export default function BankAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await listAccounts();
        if (!response.ok) {
          throw new Error(await responseErrorMessage(response));
        }

        const data = (await response.json()) as Account[];
        if (!cancelled) {
          setAccounts(data);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as contas. Tente novamente."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  function openCreate() {
    setEditingAccount(null);
    setName("");
    setNameError(undefined);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    setName(account.name);
    setNameError(undefined);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setNameError("Informe um nome para a conta.");
      return;
    }
    if (normalizedName.length > 100) {
      setNameError("Use até 100 caracteres.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setNameError(undefined);

    try {
      const response = editingAccount
        ? await updateAccount(editingAccount.id, { name: normalizedName })
        : await createAccount({ name: normalizedName });

      if (!response.ok) {
        throw new Error(await responseErrorMessage(response));
      }

      setDialogOpen(false);
      setRetryKey((current) => current + 1);
      toast(editingAccount ? "Conta atualizada." : "Conta criada.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a conta. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMakeDefault(account: Account) {
    setBusyAccountId(account.id);
    try {
      const response = await setDefaultAccount(account.id);
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response));
      }
      setRetryKey((current) => current + 1);
      toast(`${account.name} agora é a conta padrão.`);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a conta padrão.",
        "error"
      );
    } finally {
      setBusyAccountId(null);
    }
  }

  async function handleDelete() {
    if (!accountToDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await deleteAccount(accountToDelete.id);
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response));
      }
      const deletedName = accountToDelete.name;
      setAccountToDelete(null);
      setRetryKey((current) => current + 1);
      toast(`${deletedName} foi excluída.`);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta. Tente novamente."
      );
    } finally {
      setDeleting(false);
    }
  }

  const contentLoading = loading && accounts === null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <PageHeader
            title="Contas bancárias"
            subtitle="Organize onde suas movimentações acontecem."
          />
        </div>
        <Button onClick={openCreate}>Nova conta</Button>
      </div>

      {loading && accounts !== null && (
        <p className="text-sm text-ink-3" role="status">
          Atualizando contas…
        </p>
      )}

      {loadError && accounts !== null && (
        <div className="flex flex-wrap items-center gap-3" role="alert">
          <p className="text-sm text-negative">{loadError}</p>
          <Button variant="secondary" onClick={() => setRetryKey((key) => key + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}

      {loadError && accounts === null ? (
        <ErrorState message={loadError} onRetry={() => setRetryKey((key) => key + 1)} />
      ) : contentLoading ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Carregando contas">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : accounts?.length === 0 ? (
        <EmptyState
          title="Adicione sua primeira conta"
          description="Você poderá escolher em qual conta registrar cada movimentação."
          action={<Button onClick={openCreate}>Criar conta bancária</Button>}
        />
      ) : (
        <section aria-labelledby="accounts-heading" className="min-w-0">
          <div className="mb-3 flex min-w-0 items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 id="accounts-heading" className="text-lg font-medium text-ink">
                Suas contas
              </h2>
              <p className="w-full whitespace-normal break-words text-sm text-ink-3">
                A conta padrão será selecionada automaticamente nos novos registros.
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-ink-3">
              {accounts?.length ?? 0}
            </span>
          </div>

          <ul className="divide-y divide-line border-y border-line">
            {accounts?.map((account) => (
              <li
                key={account.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words font-medium text-ink">{account.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-ink-3">{account.currency}</p>
                </div>
                <AccountActions
                  account={account}
                  busy={busyAccountId === account.id || saving || deleting}
                  onMakeDefault={() => void handleMakeDefault(account)}
                  onEdit={() => openEdit(account)}
                  onDelete={() => {
                    setDeleteError(null);
                    setAccountToDelete(account);
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <AppDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving) setDialogOpen(open);
        }}
        title={editingAccount ? "Editar conta" : "Nova conta bancária"}
        description="Use um nome que ajude a identificar onde estão as movimentações."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} loading={saving} disabled={saving}>
              {editingAccount ? "Salvar alterações" : "Criar conta"}
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="bank-account-name">Nome da conta</Label>
          <Input
            id="bank-account-name"
            type="text"
            autoComplete="off"
            maxLength={100}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
            }}
            error={nameError}
          />
        </div>
        {formError && <FormAlert>{formError}</FormAlert>}
      </AppDialog>

      <AppDialog
        open={accountToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setAccountToDelete(null);
            setDeleteError(null);
          }
        }}
        title={`Excluir ${accountToDelete?.name ?? "conta"}?`}
        description="Contas com movimentações ou compromissos não podem ser excluídas."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAccountToDelete(null)}
              disabled={deleting}
            >
              Manter conta
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              loading={deleting}
              disabled={deleting}
            >
              Excluir conta
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          Esta ação não pode ser desfeita. Se a conta for padrão, outra conta será
          definida automaticamente.
        </p>
        {deleteError && <FormAlert>{deleteError}</FormAlert>}
      </AppDialog>
    </div>
  );
}
