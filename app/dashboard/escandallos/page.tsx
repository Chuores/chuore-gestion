'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function R() { const r = useRouter(); useEffect(() => r.push('/dashboard/escandallos/productos'), [r]); return null }
