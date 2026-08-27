import { useRef, useState } from "react";
import { Alert, Button, ConfirmationDialog, FileUpload, Input, SectionCard, Separator } from "@espressif/dashboard-ui-components";
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell,
} from '@espressif/dashboard-ui-components'
import { useEsp } from "../../esp/EspContext";
import { readFileAsBytes } from "../../lib/serial";
import removeIcon from "../../../assets/icons/remove.png";
import { Cpu } from "lucide-react";

interface Row {
  id: number;
  offset: string;
  file: File | null;
}

let rowSeq = 1;

export function DiyTab({ goToConsole }: { goToConsole: () => void }) {
  const { connected, chipDesc, busy, eraseFlash, flashFiles } = useEsp();
  const deviceReady = connected && chipDesc !== "default";

  const [rows, setRows] = useState<Row[]>([{ id: 0, offset: "0x1000", file: null }]);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 3000);
  };

  const addRow = () => setRows((prev) => [...prev, { id: rowSeq++, offset: "0x8000", file: null }]);
  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const validate = (): FlashFileInput[] | string => {
    const seen = new Set<number>();
    const files: FlashFileInput[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const offset = parseInt(row.offset);
      if (Number.isNaN(offset)) return `Offset field in row ${i + 1} is not a valid address!`;
      if (seen.has(offset)) return `Offset field in row ${i + 1} is already in use!`;
      seen.add(offset);
      if (!row.file) return `No file selected for row: ${i + 1}!`;
      files.push({ file: row.file, address: offset });
    }
    return files;
  };

  const onProgram = async () => {
    const result = validate();
    if (typeof result === "string") {
      showError(result);
      return;
    }
    goToConsole();
    const fileArray = await Promise.all(
      result.map(async ({ file, address }) => ({
        data: await readFileAsBytes(file),
        address,
      })),
    );
    await flashFiles(fileArray);
  };

  const onErase = async () => {
    goToConsole();
    await eraseFlash();
  };

  return (
    <div className="space-y-4">
      {connected && (
        <SectionCard 
        icon={<Cpu />} 
        variant="gradient"
        color="secondary"
        primaryText="Connected to device" 
        secondaryText={chipDesc}
         actions={ 
          <ConfirmationDialog
            title="Are you sure you want to erase the flash?"
            description="This action cannot be undone."
            onConfirm={() => void onErase()}
            onCancel={() => undefined}
          >
            <Button variant="default" color="error">Erase Flash</Button>
          </ConfirmationDialog>
          }
         allowCollapse={false}
         defaultOpen={true}
         size="default"
        >
        </SectionCard>
      )}
      <div className="space-y-1">
        <Separator />

      <h5 className="text-base font-semibold">
      <p>
        Choose your own built firmware image from local storage to flash and use.
        </p>
      </h5>
      <Separator />
      </div>
      {error && (
        <Alert type="error" title="Validation error">
          {error}
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flash Address</TableHead>
            <TableHead>Selected File</TableHead>
            <TableHead> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Input
                    className="max-w-40"
                    value={row.offset}
                    onChange={(e) => updateRow(row.id, { offset: e.target.value })}
                  />
              </TableCell>
              <TableCell>
                <FileUpload
                  hideDropzoneOnFileSelect
                  id={`file-upload-${row.id}`}
                  onChange={(e) => updateRow(row.id, { file: e.target.files?.[0] ?? null })}
                />
              </TableCell>
            <TableCell>
              {rows.length > 1 && (
                <Button
                  size="sm"
                  color="secondary"
                  className="w-auto"
                  onClick={() => removeRow(row.id)}
                >
                  <img src={removeIcon} alt="" className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

     

      <div className="flex justify-end gap-2 w-90">
        <Button variant="outline" size="sm" onClick={addRow}>
          Add File
        </Button>
        <Button variant="outline" size="sm" disabled={!deviceReady || busy} onClick={() => void onProgram()}>
          Program
        </Button>
      </div>
    </div>
  );
}

interface FlashFileInput {
  file: File;
  address: number;
}
