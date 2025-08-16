import React from 'react';
import notFound from '../assets/undraw_page-eaten_b2rt.svg';

export default function NotFound() {
    return (
      <div className='justify-items-center space-y-10'>
        <h1 className='text-9xl font-bold text-[#f59e0b]'>404</h1>
        <p className='text-lg text-[#536976]'>Oups ! La page demandée n’existe pas.</p>
        <img src={notFound} alt="404" width="500px" height="500px" />
      </div>
    );
  }
  