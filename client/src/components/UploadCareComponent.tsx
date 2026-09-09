import * as React from 'react'
import { FileUploaderRegular } from '@uploadcare/react-uploader'
import type {
  OutputCollectionState,
  OutputFileEntry,
} from '@uploadcare/react-uploader'
import '@uploadcare/react-uploader/core.css'

import { cn } from '@/lib/utils'

/**
 * The public key is not a secret — it identifies the project to Uploadcare and
 * ships in the bundle either way — but it still belongs with the other
 * third-party keys rather than inline. The literal is the fallback so a
 * checkout without the variable keeps working.
 */
const PUBKEY =
  import.meta.env.VITE_UPLOADCARE_PUBKEY?.toString() || '475683612e070410c348'

/** What a caller gets back for each file, flattened out of Uploadcare's entry. */
export type UploadedFile = {
  /** The CDN URL. This is what the API wants — see `image_url` / `file_url`. */
  url: string
  uuid: string
  name: string
  size: number
  mimeType: string
  isImage: boolean
}

function toUploadedFile(entry: OutputFileEntry<'success'>): UploadedFile {
  return {
    url: entry.cdnUrl,
    uuid: entry.uuid,
    name: entry.name,
    size: entry.size,
    mimeType: entry.mimeType,
    isImage: entry.isImage,
  }
}

export type UploadCareComponentProps = {
  /** Called with every successfully uploaded file once the batch finishes. */
  onUpload?: (files: Array<UploadedFile>) => void
  /** Convenience for the single-file case — the first file of the batch. */
  onUploadOne?: (file: UploadedFile) => void
  /** Called when the collection empties, e.g. the last file was removed. */
  onClear?: () => void
  multiple?: boolean
  /** Restrict the picker to images. */
  imgOnly?: boolean
  /** Comma-separated Uploadcare sources, e.g. `"local, camera, url"`. */
  sourceList?: string
  /** Reject anything larger, in megabytes. */
  maxSizeMb?: number
  /** Extra accept string passed through to Uploadcare, e.g. `"application/pdf"`. */
  accept?: string
  className?: string
  classNameUploader?: string
}

/**
 * The app's file and photo uploader.
 *
 * Every upload surface goes through here rather than a bare `<input
 * type="file">`, so camera capture, drag-and-drop, progress and CDN hosting are
 * the same everywhere. Files land on Uploadcare's CDN and the caller receives
 * the URL — the API takes that URL and fetches the bytes itself, so nothing
 * here posts a file part.
 */
export function UploadCareComponent({
  onUpload,
  onUploadOne,
  onClear,
  multiple = false,
  imgOnly = false,
  sourceList = 'local, camera, url',
  maxSizeMb,
  accept,
  className,
  classNameUploader,
}: UploadCareComponentProps) {
  const handleSuccess = React.useCallback(
    (state: OutputCollectionState<'success'>) => {
      const files = state.successEntries.map(toUploadedFile)
      if (!files.length) return
      onUpload?.(files)
      onUploadOne?.(files[0])
    },
    [onUpload, onUploadOne],
  )

  // `change` fires on removals too, which is the only signal that the caller's
  // held URL is now stale.
  const handleChange = React.useCallback(
    (state: OutputCollectionState) => {
      if (state.totalCount === 0) onClear?.()
    },
    [onClear],
  )

  return (
    <div className={className}>
      <FileUploaderRegular
        pubkey={PUBKEY}
        sourceList={sourceList}
        cameraModes="photo"
        multiple={multiple}
        imgOnly={imgOnly}
        accept={accept}
        maxLocalFileSizeBytes={maxSizeMb ? maxSizeMb * 1024 * 1024 : undefined}
        classNameUploader={cn('uc-light', classNameUploader)}
        onCommonUploadSuccess={handleSuccess}
        onChange={handleChange}
      />
    </div>
  )
}

export default UploadCareComponent
