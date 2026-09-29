import { notFound } from 'next/navigation'
import WorkationPreview from '@/components/WorkationPreview'

export const dynamic = 'force-dynamic'
export default function PreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <WorkationPreview />
}
