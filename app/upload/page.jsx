"use client"

import { useState, useCallback } from "react"
import Papa from "papaparse"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Download } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

const SKIP_VALUE = "__skip__"
const DB_FIELDS = [
  { value: "patient_id", label: "Patient ID" },
  { value: "visit_date", label: "Visit Date" },
  { value: "department", label: "Department" },
  { value: "visit_type", label: "Visit Type" },
  { value: "wait_time_mins", label: "Wait Time (mins)" },
  { value: "outcome", label: "Outcome" },
  { value: SKIP_VALUE, label: "— Skip —" },
]

const SAMPLE_CSV = `patient_id,visit_date,department,visit_type,wait_time_mins,outcome
P001,2025-03-01,Cardiology,Follow-up,15,Discharged
P002,2025-03-01,Emergency,Emergency,45,Admitted
P003,2025-03-02,General,Checkup,10,Discharged`

const CHUNK_SIZE = 100

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [columns, setColumns] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFile = useCallback((rawFile) => {
    if (!rawFile || !rawFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a .csv file")
      return
    }
    setFile(rawFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (!text) return
      const result = Papa.parse(text, { header: true, skipEmptyLines: true })
      const rows = result.data ?? []
      const cols = result.meta?.fields ?? (rows[0] ? Object.keys(rows[0]) : [])
      setParsedData(rows)
      setColumns(cols)
      const initial = {}
      cols.forEach((col) => {
        const normalized = col.toLowerCase().trim().replace(/\s+/g, "_")
        const match = DB_FIELDS.find(
          (f) => f.value && normalized.includes(f.value.replace(/_/g, ""))
        )
        initial[col] = match ? match.value : SKIP_VALUE
      })
      setColumnMapping(initial)
    }
    reader.readAsText(rawFile)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer?.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  async function handleUpload() {
    if (!parsedData.length) {
      toast.error("No data to upload")
      return
    }
      const mapped = parsedData.map((row) => {
      const out = {}
      DB_FIELDS.forEach(({ value }) => {
        if (!value || value === SKIP_VALUE) return
        const csvCol = Object.keys(columnMapping).find((c) => columnMapping[c] === value)
        if (csvCol && row[csvCol] !== undefined && row[csvCol] !== "") {
          let val = row[csvCol]
          if (value === "wait_time_mins") {
            const n = Number(val)
            if (!Number.isNaN(n)) val = n
          }
          out[value] = val
        }
      })
      return out
    }).filter((r) => Object.keys(r).length > 0)

    if (!mapped.length) {
      toast.error("Map at least one column to a field")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    const total = mapped.length
    let done = 0

    try {
      for (let i = 0; i < mapped.length; i += CHUNK_SIZE) {
        const chunk = mapped.slice(i, i + CHUNK_SIZE)
        const { error } = await supabase.from("patient_records").insert(chunk)
        if (error) throw error
        done += chunk.length
        setUploadProgress(Math.round((done / total) * 100))
      }
      toast.success(`Uploaded ${total} record(s) to patient_records`)
    } catch (err) {
      toast.error(err?.message ?? "Upload failed")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const previewRows = parsedData.slice(0, 5)

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Patient Records</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import visit data from a CSV file. Map columns to patient_records fields, then upload.
        </p>
      </div>

      <Card
        className={`cursor-pointer border-2 border-dashed transition-colors ${
          isDragging ? "border-teal bg-teal/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-12">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {file ? file.name : "Drag and drop a .csv file here, or click to browse"}
          </span>
          <span className="text-xs text-muted-foreground">Only .csv files are accepted</span>
        </label>
      </Card>

      {columns.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Column mapping</CardTitle>
              <CardDescription>
                Map each CSV column to a patient_records field. Unmapped columns are skipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {columns.map((col) => (
                  <div key={col} className="space-y-2">
                    <Label className="text-muted-foreground">{col}</Label>
                    <Select
                      value={columnMapping[col] ?? SKIP_VALUE}
                      onValueChange={(v) => setColumnMapping((prev) => ({ ...prev, [col]: v }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Skip" />
                      </SelectTrigger>
                      <SelectContent>
                        {DB_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview (first 5 rows)</CardTitle>
              <CardDescription>
                {parsedData.length} row(s) parsed. Here are the first 5.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {columns.map((col) => (
                        <TableHead key={col} className="text-muted-foreground">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((col) => (
                          <TableCell key={col} className="text-foreground">
                            {row[col] ?? "\u00A0"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {uploading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Uploading…</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            <Button
              onClick={handleUpload}
              disabled={uploading || parsedData.length === 0}
              className="w-fit bg-teal text-white hover:bg-teal/90"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload to Database
            </Button>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample CSV</CardTitle>
          <CardDescription>
            Download a sample file with the expected headers to see the correct format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}
            download="patient_records_sample.csv"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal hover:underline"
          >
            <Download className="h-4 w-4" />
            Download patient_records_sample.csv
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
