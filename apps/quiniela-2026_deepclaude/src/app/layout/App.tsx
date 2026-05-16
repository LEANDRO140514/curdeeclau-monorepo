import Nav from '../../shared/ui/Nav'
import TopBar from '../../shared/ui/TopBar'
import Toast from '../../shared/ui/Toast'
import Momento0Oraculo from '../../features/select-signs/Momento0Oraculo'
import Momento1Arquitecto from '../../features/generate-reduction/Momento1Arquitecto'
import Momento2Notario from '../../features/export-ticket/Momento2Notario'
import Momento3Estadio from '../../pages/results/Momento3Estadio'
import { useStore } from '../providers/store'

const PAGES = [
  <Momento0Oraculo key="oraculo" />,
  <Momento1Arquitecto key="arquitecto" />,
  <Momento2Notario key="notario" />,
  <Momento3Estadio key="estadio" />,
]

export default function App() {
  const fase = useStore((s) => s.fase)

  return (
    <div className="min-h-screen bg-dark font-body text-white selection:bg-primary/30">
      <TopBar />
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="animate-fade-in pt-6">
          {PAGES[fase]}
        </div>
      </main>
      <Toast />
    </div>
  )
}
