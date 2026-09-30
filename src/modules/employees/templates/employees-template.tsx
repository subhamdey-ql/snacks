"use client";

import { useEffect, useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { FileUp, Plus, Users } from "lucide-react";
import { CommonButton } from "@/components/common/common-button";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmployeeCsvImport } from "@/modules/employees/components/employee-csv-import";
import { EmployeeFormDialog } from "@/modules/employees/components/employee-form-dialog";
import { EmployeeSearchInput } from "@/modules/employees/components/employee-search-input";
import { EmployeeTable } from "@/modules/employees/components/employee-table";
import { useEmployeeActions } from "@/modules/employees/hooks/useEmployeeActions";
import { useEmployeeAPI } from "@/modules/employees/hooks/useEmployeeAPI";
import type { Employee } from "@/modules/employees/types";
import { EMPLOYEE_CSV_INPUT_ID } from "@/modules/employees/utils/employee-display";
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
    <div className="stagger flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Employees"
        description="Everyone who can take snacks"
        actions={
          <>
            {/* Opens the import panel's file picker directly; the panel below then shows the chosen file. */}
            <Button variant="outline" className="h-11 gap-1.5 px-3.5 md-fine:h-10" onClick={() => document.getElementById(EMPLOYEE_CSV_INPUT_ID)?.click()}>
              <FileUp className="size-4" aria-hidden />
              Import CSV
            </Button>
            <CommonButton className="gap-1.5" onClick={() => openDialog()}>
              <Plus className="size-4" aria-hidden />
              Add employee
            </CommonButton>
          </>
        }
      />
      <Card className="gap-4 p-4 sm:p-5">
        <EmployeeSearchInput value={text} onChange={setText} />
        <EmployeeCsvImport />
      </Card>
      <Card className="gap-0 px-4 py-2 sm:px-5">
        {isLoading || !data ? (
          <TableSkeleton />
        ) : (
          <DataEmptyHandler
            data={data.data}
            icon={Users}
            emptyMessage={q ? "No employees match that search." : "No employees yet."}
            hint={q ? "Try a different name or code." : "Add your first employee or import a CSV."}
          >
            <EmployeeTable
              employees={data.data}
              isSaving={isSaving}
              onEdit={openDialog}
              onToggle={(e) => saveEmployee({ id: e.id, code: e.code, name: e.name, type: e.type, active: !e.active })}
            />
          </DataEmptyHandler>
        )}
      </Card>
      {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
      <EmployeeFormDialog open={dialogOpen} employee={editing} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
