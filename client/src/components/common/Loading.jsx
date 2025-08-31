import React from 'react';

const Loading = ({ message = 'Loading...', fullPage = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${fullPage ? 'min-h-screen' : 'py-8'}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      {message && <p className="mt-4 text-lg text-gray-600">{message}</p>}
    </div>
  );
};

export default Loading;
