"use client";

import { useEffect, useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { CommonButton } from "@/components/common/common-button";
import { CommonLoader } from "@/components/common/common-loader";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { Pagination } from "@/components/common/pagination";
import { Input } from "@/components/ui/input";
import { EmployeeCsvImport } from "@/modules/employees/components/employee-csv-import";
import { EmployeeFormDialog } from "@/modules/employees/components/employee-form-dialog";
import { EmployeeTable } from "@/modules/employees/components/employee-table";
import { useEmployeeActions } from "@/modules/employees/hooks/useEmployeeActions";
import { useEmployeeAPI } from "@/modules/employees/hooks/useEmployeeAPI";
import type { Employee } from "@/modules/employees/types";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 10;

export function EmployeesTemplate(): React.JSX.Element {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState("q");
  const [text, setText] = useState(q ?? "");
  const debounced = useDebounce(text.trim());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>();

  // Push the settled search term to the URL; a changed term goes back to page 1 (a reload keeps ?page).
  useEffect(() => {
    if (debounced === (q ?? "")) return;
    setQ(debounced || null);
    setPage(1);
  }, [debounced, q, setQ, setPage]);

  const { data, isLoading } = useEmployeeAPI().useGetEmployeesQuery({ q: q ?? undefined, page, limit: PAGE_SIZE });
  const { saveEmployee, isSaving } = useEmployeeActions();
  const totalPages = data?.pagination.totalPages;

  // A stale ?page= beyond the last page snaps back once (the key changes, so exactly one refetch).
  useEffect(() => {
    if (totalPages === undefined) return;
    const last = Math.max(1, totalPages);
    if (page > last) setPage(last);
  }, [page, totalPages, setPage]);

  const openDialog = (employee?: Employee): void => {
    setEditing(employee);
    setDialogOpen(true);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input className="w-full sm:w-64" placeholder="Search name or code" value={text} onChange={(e) => setText(e.target.value)} />
        <CommonButton onClick={() => openDialog()}>Add employee</CommonButton>
      </div>
      <EmployeeCsvImport />
      {isLoading || !data ? (
        <CommonLoader />
      ) : (
        <DataEmptyHandler data={data.data} emptyMessage="No employees found.">
          <EmployeeTable
            employees={data.data}
            isSaving={isSaving}
            onEdit={openDialog}
            onToggle={(e) => saveEmployee({ id: e.id, code: e.code, name: e.name, type: e.type, active: !e.active })}
          />
        </DataEmptyHandler>
      )}
      {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
      <EmployeeFormDialog open={dialogOpen} employee={editing} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
