const DEFAULT_BASE_URL = 'http://localhost:8000'

const BUG_REPORT_ENDPOINT = '/api/bug/bug-reports/'

export type BugReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export type BugReportPayload = {
  title: string
  description: string
  severity: BugReportSeverity
}

export async function submitBugReport(payload: BugReportPayload) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL

  const response = await fetch(`${baseUrl}${BUG_REPORT_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message =
      typeof errorPayload?.detail === 'string'
        ? errorPayload.detail
        : 'Unable to send your bug report. Please try again.'

    throw new Error(message)
  }
}
