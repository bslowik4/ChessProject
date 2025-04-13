import React from 'react';
import { Button } from '@/components/ui/button';

const Instructions = ({ onStart }) => {
  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Instrukcja</h1>
      <p className="mb-6">
        Tutaj pojawi się instrukcja dla uczestnika – będzie się pojawiać przed każdą sesją.
      </p>
      <Button onClick={onStart}>Rozpocznij</Button>
    </div>
  );
};

export default Instructions