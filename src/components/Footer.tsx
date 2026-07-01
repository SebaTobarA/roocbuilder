import React from 'react';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-community">
        <span className="footer-community-label">Comunidad oficial</span>
        <span className="footer-community-name">Ragnarok Origin Classic: LATAM</span>
        <span className="footer-community-platform">Discord</span>
      </div>
      <p className="footer-disclaimer">
        ROOC Party Builder es una herramienta creada por fans y no está afiliada a Gravity
        ni al equipo oficial de Ragnarok Origin Classic. Los datos del juego provienen de
        investigación comunitaria y verificación en el juego.
      </p>
    </footer>
  );
}
