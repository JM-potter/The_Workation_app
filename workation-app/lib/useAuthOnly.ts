'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, BYPASS_AUTH } from './supabase'
import { getMembership } from './membership-client'

export function useAuthOnly() {
  const router = useRouter()
  useEffect(() => {
    if (BYPASS_AUTH) return
    getMembership().then(member => {
      if(member.status !== 'approved') router.replace('/pending')
    }).catch(()=>router.replace('/pending'))
  }, [router])
}
