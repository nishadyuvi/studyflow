import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function AppLayout() {
  return (
    <>
      <div className="app-background" aria-hidden="true">
        <span className="app-background__orb app-background__orb--1" />
        <span className="app-background__orb app-background__orb--2" />
        <span className="app-background__orb app-background__orb--3" />
      </div>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  )
}
