import {notFound} from 'next/navigation'
import PersonalWorkspace from '@/components/PersonalWorkspace'
export default function PersonalPreview() {
  if(process.env.NODE_ENV!=='development')notFound()
  return <PersonalWorkspace preview/>
}
