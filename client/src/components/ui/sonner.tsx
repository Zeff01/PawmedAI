import { Toaster as Sonner, toast } from 'sonner'
import type { ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return <Sonner richColors position="top-center" {...props} />
}

export { toast }
