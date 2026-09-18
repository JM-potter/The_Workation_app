'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, BYPASS_AUTH } from './supabase'
import { getMembership } from './membership-client'

export function useHrOnly() {
  const router = useRouter()
  useEffect(() => {
    if (BYPASS_AUTH) return
    getMembership().then(member => {
      if(member.status !== 'approved') router.replace('/pending')
      else if(member.role !== 'hr') router.replace('/select')
    }).catch(()=>router.replace('/pending'))
  }, [router])
}
