import { Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import Layout from './components/Layout'

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Layout />} />
      </Routes>
    </>
  )
}
