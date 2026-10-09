import {
  Input,
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  SimpleCard,
  SimpleList,
  type SimpleListItem,
} from "@espressif/dashboard-ui-components";
import { useEsp } from "../../esp/EspContext";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const opts = (...values: (string | number)[]) =>
  values.map((v) => ({ value: String(v), label: String(v) }));

export function SettingsTab() {
  const { settings, updateSettings, connected } = useEsp();

  const items: SimpleListItem[] = [
    {
      key: 'terminologies',
      label: 'Web Serial API references and terminologies',
      content:<div className="space-y-1">
        <p className="text-sm text-muted-foreground">
        <Link to="https://wicg.github.io/serial/#serialoptions-dictionary" color="primary">SerialOptions:</Link>
         <code style={{color:"#d63384"}}>baudRate, dataBits, stopBits, parity, flowControl, bufferSize.</code></p>
        </div>,
    },
    {
      key: 'guidelines',
      label: 'General Guidelines',
      content: <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          While connected, the flashing baud rate is locked. You can change the console baud rate
      and serial settings at any time; however, these changes only take effect the next time
      you reset the device or start a new connection.</p>
          <Separator/>
      <p className="text-sm text-muted-foreground">
        If the firmware TOML defines a <code style={{color:"#d63384"}}>console_baudrate</code> for the 
        app <Link to="https://github.com/espressif/esp-launchpad/blob/main/config/config.toml" color="primary" >here</Link>, 
        that value will be used instead of the value set in the settings panel below.
        </p>
      </div>,

    },
  ]
  return (
    <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm">
      <h5 className="mb-1 text-lg font-semibold">Serial connection configurations</h5>
      <div>
        <SimpleCard>
        <div className="space-y-2">
          <br/>
        <SimpleList
              items={items}
        />
        <Separator/>
        </div>
        </SimpleCard>
      </div>
    <br/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Flashing baud rate"
          value={String(settings.flashingBaudrate)}
          onChange={(v) => updateSettings({ flashingBaudrate: Number(v) })}
          options={opts(921600, 460800, 230400, 115200)}
          disabled={connected}
        />
        <SelectField
          label="Console baud rate"
          value={String(settings.consoleBaudrate)}
          onChange={(v) => updateSettings({ consoleBaudrate: Number(v) })}
          options={opts(115200, 74880)}
        />
        <SelectField
          label="Data bits"
          value={String(settings.dataBits)}
          onChange={(v) => updateSettings({ dataBits: Number(v) as 7 | 8 })}
          options={opts(8, 7)}
        />
        <SelectField
          label="Stop bits"
          value={String(settings.stopBits)}
          onChange={(v) => updateSettings({ stopBits: Number(v) as 1 | 2 })}
          options={opts(1, 2)}
        />
        <SelectField
          label="Parity"
          value={settings.parity}
          onChange={(v) => updateSettings({ parity: v as ParityType })}
          options={[
            { value: "none", label: "none" },
            { value: "even", label: "even" },
            { value: "odd", label: "odd" },
          ]}
        />
        <SelectField
          label="Flow control"
          value={settings.flowControl}
          onChange={(v) => updateSettings({ flowControl: v as FlowControlType })}
          options={[
            { value: "none", label: "none" },
            { value: "hardware", label: "hardware" },
          ]}
        />
        <Field label="Buffer size (bytes)">
          <Input
            type="number"
            min={1}
            max={16777216}
            step={1}
            value={settings.bufferSize}
            onChange={(e) => updateSettings({ bufferSize: Number(e.target.value) })}
          />
        </Field>
      </div>
    </div>
  );
}
