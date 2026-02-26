import { useEffect } from 'react'
import './Home.css'

function Home() {
  // Tambahkan class home-bg ke .content saat halaman Home aktif
  useEffect(() => {
    const content = document.querySelector('.content')
    if (content) content.classList.add('home-bg')
    return () => {
      if (content) content.classList.remove('home-bg')
    }
  }, [])

  return (
    <div className="home-title-wrapper">
      <div className="home-title">
        <div className="line1">DASHBOARD MONITORING</div>
        <div className="line2">ASSET MAINTENANCE</div>
        <div className="line3">PT ALDZAMA</div>
      </div>
    </div>
  )
}

export default Home
