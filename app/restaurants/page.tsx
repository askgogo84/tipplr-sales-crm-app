'use client'

import { useEffect, useState } from 'react'
useEffect(() => {
  loadData()

  const channel = supabase
    .channel('realtime-restaurants')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'restaurants',
      },
      () => {
        loadData()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])