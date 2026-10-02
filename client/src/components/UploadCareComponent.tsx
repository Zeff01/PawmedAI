import * as React from 'react'
import { FileUploaderRegular } from '@uploadcare/react-uploader'
import type {
  OutputCollectionState,
  OutputFileEntry,
  UploadCtxProvider,
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
  /**
   * Hide Uploadcare's own button, leaving the zone's controls to drive it.
   * Note this only hides the button — never hide the widget's container, as
   * its dialog is rendered inside it and would be hidden along with it.
   */
  headless?: boolean
  /**
   * Zone content. When given, it is wrapped with the widget in one surface:
   * clicking anywhere on that surface browses for a file, and files can be
   * dropped onto it. Pass a function to render against the drag state and the
   * actions, so the zone can offer its own buttons.
   */
  children?: React.ReactNode | ((state: ZoneState) => React.ReactNode)
  /**
   * Classes for that surrounding surface. A function receives the drag state,
   * so the zone can light up while a file is over it.
   */
  zoneClassName?: string | ((state: { dragActive: boolean }) => string)
}

/** What a zone gets to render against. */
export type ZoneState = {
  /** A file is being dragged over the zone. */
  dragActive: boolean
  /**
   * Skip Uploadcare's dialog and go straight to the operating system's file
   * picker. Rarely what you want — `open` keeps the widget's own UI, with its
   * source list, upload list and progress.
   */
  browse: () => void
  /** Open the camera. */
  openCamera: () => void
  /** Open Uploadcare's picker, listing every source in `sourceList`. */
  open: () => void
  /**
   * The widget itself, for the zone to place where it belongs in the layout
   * rather than after everything else. Render it exactly once; a zone that
   * leaves it out shows no control and relies on the zone-wide click alone.
   */
  uploader: React.ReactNode
}

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
  headless = false,
  children,
  zoneClassName,
}: UploadCareComponentProps) {
  const apiRef = React.useRef<UploadCtxProvider>(null)
  const widgetRef = React.useRef<HTMLDivElement>(null)
  const [dragActive, setDragActive] = React.useState(false)

  const api = React.useCallback(() => apiRef.current?.getAPI(), [])

  const browse = React.useCallback(() => {
    api()?.openSystemDialog()
  }, [api])

  const openCamera = React.useCallback(() => {
    const uploader = api()
    if (!uploader) return
    uploader.setCurrentActivity('camera')
    uploader.setModalState(true)
  }, [api])

  const open = React.useCallback(() => {
    api()?.initFlow()
  }, [api])

  const addFiles = React.useCallback(
    (files: FileList) => {
      const uploader = api()
      if (!uploader) return
      const dropped = Array.from(files)
      for (const file of multiple ? dropped : dropped.slice(0, 1)) {
        uploader.addFileFromObject(file)
      }
    },
    [api, multiple],
  )

  const handleSuccess = React.useCallback(
    (state: OutputCollectionState<'success'>) => {
      const files = state.successEntries.map(toUploadedFile)
      if (!files.length) return
      onUpload?.(files)
      onUploadOne?.(files[0])
    },
    [onUpload, onUploadOne],
  )

  const handleChange = React.useCallback(
    (state: OutputCollectionState) => {
      if (state.totalCount === 0) onClear?.()
    },
    [onClear],
  )

  const widget = (
    <div ref={widgetRef} className={className}>
      <FileUploaderRegular
        apiRef={apiRef}
        headless={headless}
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

  if (!children) return widget

  const zone: ZoneState = {
    dragActive,
    browse,
    openCamera,
    open,
    uploader: widget,
  }

  return (
    <div
      className={cn(
        'cursor-pointer',
        typeof zoneClassName === 'function'
          ? zoneClassName({ dragActive })
          : zoneClassName,
      )}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button')) return
        if (widgetRef.current?.contains(target)) return
        open()
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragActive(false)
        if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files)
      }}
    >
      {typeof children === 'function' ? (
        children(zone)
      ) : (
        <>
          {children}
          {widget}
        </>
      )}
    </div>
  )
}

export default UploadCareComponent
