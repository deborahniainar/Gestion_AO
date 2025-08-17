import React from 'react';
import notFound from '../assets/undraw_page-eaten_b2rt.svg';

export default function NotFound() {
    return (
      <div style={{ textAlign: "center", padding: "50px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1>404</h1>
        <p>Oups ! La page demandée n’existe pas.</p>
        <img src={notFound} alt="404" width="500px" height="500px" />
      </div>
    );
  }
  